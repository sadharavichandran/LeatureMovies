import { Server } from 'socket.io';
import WatchRoom from './models/WatchRoom.js';

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // Adjust this for production
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Authenticate user for global real-time events
    socket.on('authenticate', ({ userId, role }) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined room user_${userId}`);
      }
      if (role === 'admin') {
        socket.join('admin_channel');
        console.log(`User ${userId} joined admin_channel`);
      }
    });

    // --- WATCH ROOM EVENTS ---

    socket.on('join_watch_room', async ({ roomId, user }) => {
      socket.join(`watch_${roomId}`);
      console.log(`User ${user.userName} joined watch room ${roomId}`);

      try {
        // Add user to participants if not already there
        const room = await WatchRoom.findOne({ roomId });
        if (room) {
          const exists = room.participants.some(p => p.userId === user.id);
          if (!exists) {
            room.participants.push({
              userId: user.id,
              userName: user.fullName || user.userName,
              role: room.hostId === user.id ? 'host' : 'participant'
            });
            await room.save();
          }
        }
      } catch (err) {
        console.error('Error joining watch room DB:', err);
      }

      // Broadcast join activity
      io.to(`watch_${roomId}`).emit('watch_activity', {
        id: Date.now().toString(),
        type: 'join',
        message: `${user.fullName || user.userName} joined the room`,
        timestamp: new Date().toISOString()
      });

      // Send updated participants list to everyone
      const updatedRoom = await WatchRoom.findOne({ roomId });
      if (updatedRoom) {
        io.to(`watch_${roomId}`).emit('watch_room_updated', updatedRoom);
      }
    });

    socket.on('leave_watch_room', async ({ roomId, user }) => {
      socket.leave(`watch_${roomId}`);
      
      try {
        const room = await WatchRoom.findOne({ roomId });
        if (room) {
          room.participants = room.participants.filter(p => p.userId !== user.id);
          await room.save();
          io.to(`watch_${roomId}`).emit('watch_room_updated', room);
        }
      } catch (err) {
        console.error('Error leaving watch room DB:', err);
      }

      // Broadcast leave activity
      io.to(`watch_${roomId}`).emit('watch_activity', {
        id: Date.now().toString(),
        type: 'leave',
        message: `${user.fullName || user.userName} left the room`,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('sync_video', async ({ roomId, action, payload }) => {
      // action: 'play', 'pause', 'seek', 'change_trailer'
      // payload: { timestamp, url, etc. }
      
      // Broadcast to all other users in the room
      socket.to(`watch_${roomId}`).emit('video_sync_action', { action, payload });

      // Persist important state changes
      try {
        if (action === 'change_trailer' || action === 'play' || action === 'pause') {
          const room = await WatchRoom.findOne({ roomId });
          if (room) {
            if (action === 'change_trailer') {
              room.currentVideoUrl = payload.url;
              if (payload.name) {
                room.currentVideoName = payload.name;
              }
              room.currentTimestamp = 0;
              room.isPlaying = true;
              
              // Emit activity
              io.to(`watch_${roomId}`).emit('watch_activity', {
                id: Date.now().toString(),
                type: 'trailer_change',
                message: `Host changed the trailer${payload.name ? ` to: ${payload.name}` : ''}`,
                timestamp: new Date().toISOString()
              });
            } else if (action === 'play') {
              room.isPlaying = true;
              room.currentTimestamp = payload.timestamp;
            } else if (action === 'pause') {
              room.isPlaying = false;
              room.currentTimestamp = payload.timestamp;
            }
            room.lastActivity = new Date();
            await room.save();
          }
        }
      } catch (err) {
        console.error('Error syncing video DB:', err);
      }
    });

    socket.on('send_reaction', ({ roomId, emoji }) => {
      // Just broadcast, no DB
      io.to(`watch_${roomId}`).emit('receive_reaction', {
        id: Date.now().toString() + Math.random().toString(),
        emoji
      });
    });

    socket.on('create_poll', async ({ roomId, poll }) => {
      try {
        const room = await WatchRoom.findOne({ roomId });
        if (room) {
          room.polls.push(poll);
          await room.save();
          io.to(`watch_${roomId}`).emit('watch_room_updated', room);
          
          io.to(`watch_${roomId}`).emit('watch_activity', {
            id: Date.now().toString(),
            type: 'poll_created',
            message: `Host created a new poll: ${poll.question}`,
            timestamp: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Error creating poll:', err);
      }
    });

    socket.on('vote_poll', async ({ roomId, pollId, optionId, userId }) => {
      try {
        const room = await WatchRoom.findOne({ roomId });
        if (room) {
          const poll = room.polls.find(p => p.id === pollId);
          if (poll) {
            // Remove previous vote if any
            poll.options.forEach(opt => {
              opt.votes = opt.votes.filter(id => id !== userId);
            });
            // Add new vote
            const option = poll.options.find(o => o.id === optionId);
            if (option) {
              option.votes.push(userId);
              await room.save();
              io.to(`watch_${roomId}`).emit('watch_room_updated', room);
            }
          }
        }
      } catch (err) {
        console.error('Error voting poll:', err);
      }
    });

    socket.on('rate_movie', async ({ roomId, userId, userName, rating }) => {
      try {
        const room = await WatchRoom.findOne({ roomId });
        if (room) {
          const existingRating = room.ratings.find(r => r.userId === userId);
          if (!existingRating) {
            room.ratings.push({ userId, rating });
            await room.save();
            io.to(`watch_${roomId}`).emit('watch_room_updated', room);
            
              io.to(`watch_${roomId}`).emit('watch_activity', {
                id: Date.now().toString(),
                type: 'rating',
                message: `${userName} rated ${room.currentVideoName || 'the trailer'} ${'⭐'.repeat(rating)}`,
                timestamp: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.error('Error rating movie:', err);
      }
    });

    // Disconnect handling
    socket.on('disconnecting', () => {
      console.log(`User disconnecting: ${socket.id}, rooms:`, Array.from(socket.rooms));
      // Could theoretically handle clean up here if we mapped socket.id to user.id,
      // but client handles leave_watch_room on unmount.
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};
