import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import User from '../models/User.js';
import WaitingQueue from '../models/WaitingQueue.js';

const bookingController = {
  async create(req, res) {
    try {
      const coinsEarned = (req.body.seatNumbers?.length || 0) * 5;
      const coinsUsed = req.body.coinsUsed || 0;
      
      const show = await Show.findById(req.body.showId);
      const adminId = show ? show.adminId : null;
      
      const bookingData = { ...req.body, userId: req.user.id, coinsEarned, coinsUsed, adminId };
      const booking = await Booking.create(bookingData);
      
      // Update user coins
      const netCoins = coinsEarned - coinsUsed;
      if (netCoins !== 0) {
        await User.updateCoins(req.user.id, netCoins);
      }

      const io = req.app.get('io');
      if (io) {
        io.to(`user_${req.user.id}`).emit('booking_created', booking);
        io.to('admin_channel').emit('booking_created', booking);
        
        // Notify user about coin update
        const updatedUser = await User.findById(req.user.id);
        io.to(`user_${req.user.id}`).emit('user_updated', updatedUser);
      }
      
      // Deactivate active waitlist entry if user has one for this show
      try {
        const activeEntries = await WaitingQueue.findActiveByUserId(req.user.id);
        const existingEntry = activeEntries.find(entry => entry.showId === req.body.showId);
        if (existingEntry) {
          await WaitingQueue.update(existingEntry.id, { isActive: false });
        }
      } catch (err) {
        console.error('Error deactivating waitlist entry:', err);
      }
      
      res.json({ message: 'Booking created successfully', booking });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      let adminId = null;
      if (req.user && req.user.role === 'admin') {
        adminId = req.user.id;
      }
      const bookings = await Booking.getAll(adminId);
      res.json({ bookings });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async getUserBookings(req, res) {
    try {
      const bookings = await Booking.findByUserId(req.user.id);
      res.json({ bookings });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Check if user owns this booking or is admin
      if (booking.userId !== req.user.id) {
        if (req.user.role === 'admin' && booking.adminId !== req.user.id) {
          return res.status(403).json({ error: 'Unauthorized' });
        } else if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
          return res.status(403).json({ error: 'Unauthorized' });
        }
      }

      res.json({ booking });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.userId !== req.user.id) {
        if (req.user.role === 'admin' && booking.adminId !== req.user.id) {
          return res.status(403).json({ error: 'Unauthorized' });
        } else if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
          return res.status(403).json({ error: 'Unauthorized' });
        }
      }

      const updatedBooking = await Booking.update(req.params.id, req.body);
      
      // If booking was just cancelled, refund/revert coins
      if (req.body.isCancelled === true && booking.isCancelled === false) {
        const netCoins = (booking.coinsUsed || 0) - (booking.coinsEarned || 0);
        if (netCoins !== 0) {
          await User.updateCoins(booking.userId, netCoins);
        }
      }

      const io = req.app.get('io');
      if (io) {
        io.to(`user_${booking.userId}`).emit('booking_updated', updatedBooking);
        io.to('admin_channel').emit('booking_updated', updatedBooking);
        
        if (req.body.isCancelled === true && booking.isCancelled === false) {
          const updatedUser = await User.findById(booking.userId);
          io.to(`user_${booking.userId}`).emit('user_updated', updatedUser);
        }
      }
      
      res.json({ message: 'Booking updated successfully', booking: updatedBooking });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      if (req.user.role === 'admin' && booking.adminId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      await Booking.delete(req.params.id);
      
      if (booking) {
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${booking.userId}`).emit('booking_deleted', req.params.id);
          io.to('admin_channel').emit('booking_deleted', req.params.id);
        }
      }

      res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
};

export default bookingController;
