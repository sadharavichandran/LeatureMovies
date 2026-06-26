import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import YouTubePlayer from 'react-player/youtube';
import FilePlayer from 'react-player/file';
import { Play, Pause, Film, Star, Users, Activity, Loader2, PlaySquare, Search } from 'lucide-react';
import { socketService } from '../../services/socket';
import { watchRoomService, movieService } from '../../services/api';
import { WatchRoom as WatchRoomType, UserProfile, WatchRoomParticipant, WatchRoomPoll } from '../../types';

const YPlayer: any = (YouTubePlayer as any).default || YouTubePlayer;
const FPlayer: any = (FilePlayer as any).default || FilePlayer;

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

interface ReactionItem {
  id: string;
  emoji: string;
  left: number; // random horizontal position
}

interface WatchRoomProps {
  roomId: string;
  currentUser: UserProfile;
  onLeave: () => void;
}

export default function WatchRoom({ roomId, currentUser, onLeave }: WatchRoomProps) {
  const [roomState, setRoomState] = useState<WatchRoomType | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [reactions, setReactions] = useState<ReactionItem[]>([]);


  const [isPlaying, setIsPlaying] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const playerRef = useRef<any>(null);

  // Polls & Ratings
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const [loading, setLoading] = useState(true);

  // Search
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allCatalogMovies, setAllCatalogMovies] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const isHost = roomState?.hostId === currentUser.id;

  useEffect(() => {
    // 1. Fetch initial room state via REST
    const fetchRoom = async () => {
      try {
        const data = await watchRoomService.getRoom(roomId);
        setRoomState(data.room);
        setIsPlaying(data.room.isPlaying);
        setPlayedSeconds(data.room.currentTimestamp);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load room:', err);
        setLoading(false);
      }
    };
    fetchRoom();

    // 2. Connect socket and join room
    if (socketService.socket) {
      socketService.socket.emit('join_watch_room', { roomId, user: currentUser });

      socketService.socket.on('watch_room_updated', (updatedRoom: WatchRoomType) => {
        setRoomState(updatedRoom);
      });

      socketService.socket.on('watch_activity', (activity: ActivityItem) => {
        setActivities(prev => [...prev, activity]);
      });

      socketService.socket.on('video_sync_action', ({ action, payload }) => {
        if (action === 'change_trailer') {
          setRoomState(prev => prev ? { ...prev, currentVideoUrl: payload.url, currentVideoName: payload.name || prev.currentVideoName } : null);
          setIsPlaying(true);
          playerRef.current?.seekTo(0);
        } else if (action === 'play') {
          setIsPlaying(true);
          if (payload.timestamp !== undefined && Math.abs(playedSeconds - payload.timestamp) > 2) {
            playerRef.current?.seekTo(payload.timestamp);
          }
        } else if (action === 'pause') {
          setIsPlaying(false);
          if (payload.timestamp !== undefined) {
            playerRef.current?.seekTo(payload.timestamp);
          }
        } else if (action === 'seek') {
          playerRef.current?.seekTo(payload.timestamp);
          setPlayedSeconds(payload.timestamp);
        }
      });

      socketService.socket.on('receive_reaction', ({ id, emoji }) => {
        setReactions(prev => [
          ...prev,
          { id, emoji, left: 10 + Math.random() * 80 }
        ]);
        // Remove reaction after animation completes (3s)
        setTimeout(() => {
          setReactions(prev => prev.filter(r => r.id !== id));
        }, 3000);
      });
    }

    return () => {
      if (socketService.socket) {
        socketService.socket.emit('leave_watch_room', { roomId, user: currentUser });
        socketService.socket.off('watch_room_updated');
        socketService.socket.off('watch_activity');
        socketService.socket.off('video_sync_action');
        socketService.socket.off('receive_reaction');
      }
    };
  }, [roomId, currentUser]);

  // Fetch catalog movies for host search modal
  useEffect(() => {
    if (showSearchModal && isHost && allCatalogMovies.length === 0) {
      setIsSearching(true);
      movieService.getAll().then(res => {
        setAllCatalogMovies(res.movies || res);
      }).catch(err => {
        console.error('Failed to load movies for search', err);
      }).finally(() => {
        setIsSearching(false);
      });
    }
  }, [showSearchModal, isHost, allCatalogMovies.length]);

  // Activity Feed Auto-scroll
  const activityFeedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activityFeedRef.current) {
      activityFeedRef.current.scrollTop = activityFeedRef.current.scrollHeight;
    }
  }, [activities]);



  const handlePlayPause = (willPlay: boolean) => {
    if (!isHost) return;
    setIsPlaying(willPlay);
    socketService.socket?.emit('sync_video', {
      roomId,
      action: willPlay ? 'play' : 'pause',
      payload: { timestamp: playerRef.current?.getCurrentTime() || 0 }
    });
  };

  const handleSeek = (seconds: number) => {
    if (!isHost) return;
    playerRef.current?.seekTo(seconds);
    setPlayedSeconds(seconds);
    socketService.socket?.emit('sync_video', {
      roomId,
      action: 'seek',
      payload: { timestamp: seconds }
    });
  };

  // Reactions
  const handleReaction = (emoji: string) => {
    socketService.socket?.emit('send_reaction', { roomId, emoji });
    // Optimistic local update
    const id = Date.now().toString() + Math.random().toString();
    setReactions(prev => [...prev, { id, emoji, left: 10 + Math.random() * 80 }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 3000);
  };

  const filteredCatalogMovies = allCatalogMovies.filter((m: any) => 
    m.trailerUrl && 
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchTrailers = async (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-filtering is done via filteredCatalogMovies now
  };

  /**
   * Converts any YouTube-style URL (watch, embed, youtu.be, Google Search redirect)
   * into a clean https://www.youtube.com/watch?v=VIDEO_ID URL that react-player handles.
   */
  const normalizeVideoUrl = (rawUrl: string): string => {
    const url = rawUrl.trim();
    // Google Search redirect with embedded vid: param in the fragment
    if (url.includes('google.com') && url.includes('vid:')) {
      const match = url.match(/vid:([A-Za-z0-9_-]+)/);
      if (match?.[1]) return `https://www.youtube.com/watch?v=${match[1]}`;
    }
    // youtu.be short links
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split(/[?&#]/)[0];
      if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
    }
    // youtube.com/embed/VIDEO_ID
    if (url.includes('youtube.com/embed/')) {
      const videoId = url.split('youtube.com/embed/')[1].split(/[?&#]/)[0];
      if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
    }
    // youtube.com/watch?v=VIDEO_ID (already correct, just strip extra params)
    if (url.includes('youtube.com/watch') && url.includes('v=')) {
      const match = url.match(/[?&]v=([A-Za-z0-9_-]+)/);
      if (match?.[1]) return `https://www.youtube.com/watch?v=${match[1]}`;
    }
    return url; // Return as-is for non-YouTube URLs (local video, Vimeo, etc.)
  };

  const handleSelectMovieTrailer = (movie: any) => {
    if (!isHost) return;
    const finalUrl = normalizeVideoUrl(movie.trailerUrl);
    console.log('[WatchRoom] Playing trailer URL:', finalUrl);
    
    socketService.socket?.emit('sync_video', {
      roomId,
      action: 'change_trailer',
      payload: { url: finalUrl, name: movie.title }
    });
    setRoomState(prev => prev ? { ...prev, currentVideoUrl: finalUrl, currentVideoName: movie.title } : null);
    setIsPlaying(true);
    setShowSearchModal(false);
    setSearchQuery('');
  };

  // Polls
  const handleCreatePoll = () => {
    if (!isHost || !newPollQuestion) return;
    const poll = {
      id: Date.now().toString(),
      question: newPollQuestion,
      options: newPollOptions.filter(o => o.trim() !== '').map(o => ({ id: Math.random().toString(36).substring(7), text: o, votes: [] })),
      createdAt: new Date().toISOString(),
      isActive: true
    };
    socketService.socket?.emit('create_poll', { roomId, poll });
    setShowPollModal(false);
    setNewPollQuestion('');
    setNewPollOptions(['', '']);
  };

  const handleVotePoll = (pollId: string, optionId: string) => {
    socketService.socket?.emit('vote_poll', { roomId, pollId, optionId, userId: currentUser.id });
  };

  // Ratings
  const handleRateMovie = (rating: number) => {
    socketService.socket?.emit('rate_movie', {
      roomId,
      userId: currentUser.id,
      userName: currentUser.fullName || currentUser.email.split('@')[0],
      rating
    });
    setShowRatingModal(false);
  };

  if (loading || !roomState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-stone-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#C5A059] mb-4" />
        <p>Connecting to Watch Room...</p>
      </div>
    );
  }

  // Calculated Ratings
  const averageRating = roomState.ratings.length > 0
    ? (roomState.ratings.reduce((acc, r) => acc + r.rating, 0) / roomState.ratings.length).toFixed(1)
    : '0.0';

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full relative z-10 animate-fadeIn">

      {/* LEFT COLUMN: PLAYER & CONTROLS */}
      <div className="flex-1 flex flex-col gap-6">

        {/* Host Controls */}
        {isHost && (
          <div className="flex flex-col gap-4">
             <button
                onClick={() => setShowSearchModal(true)}
                className="bg-[#C5A059] hover:bg-[#F1D299] text-stone-950 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-colors flex items-center justify-center gap-2 self-start"
             >
                <Search className="w-5 h-5" /> Search Movie Catalog
             </button>
          </div>
        )}

        {/* Video Player Container */}
        <div className="flex justify-between items-center px-2 py-1 mb-[-12px]">
          <h2 className="text-xl font-serif text-stone-100">{roomState.currentVideoName || "Trailer Player"}</h2>
        </div>
        <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 relative shadow-2xl group">
          {roomState.currentVideoUrl ? (
            (roomState.currentVideoUrl.includes('youtube.com') || roomState.currentVideoUrl.includes('youtu.be')) ? (
              <YPlayer
                ref={playerRef}
                url={roomState.currentVideoUrl}
                width="100%"
                height="100%"
                playing={isPlaying}
                controls={true}
                muted={false}
                config={{
                  youtube: {
                    playerVars: {
                      modestbranding: 1,
                      rel: 0,
                      autoplay: 1,
                    }
                  }
                } as any}
                onReady={() => {
                  if (isHost) setIsPlaying(true);
                }}
                onPlay={() => handlePlayPause(true)}
                onPause={() => handlePlayPause(false)}
                onSeek={(e: any) => isHost && handleSeek(e)}
                onProgress={(s: any) => setPlayedSeconds(s.playedSeconds)}
                style={{ pointerEvents: isHost ? 'auto' : 'none' }}
              />
            ) : (
              <FPlayer
                ref={playerRef}
                url={roomState.currentVideoUrl}
                width="100%"
                height="100%"
                playing={isPlaying}
                controls={true}
                muted={false}
                onReady={() => {
                  if (isHost) setIsPlaying(true);
                }}
                onPlay={() => handlePlayPause(true)}
                onPause={() => handlePlayPause(false)}
                onSeek={(e: any) => isHost && handleSeek(e)}
                onProgress={(s: any) => setPlayedSeconds(s.playedSeconds)}
                style={{ pointerEvents: isHost ? 'auto' : 'none' }}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-stone-600 bg-stone-950/50">
              <Film className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-serif text-xl">Waiting for host to load a trailer...</p>
            </div>
          )}

          {/* Reactions Overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {reactions.map((r) => (
              <div
                key={r.id}
                className="absolute text-4xl animate-floatUp"
                style={{ left: `${r.left}%`, bottom: '-50px' }}
              >
                {r.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Reaction Bar & Room Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-card rounded-2xl border border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-500 uppercase font-mono tracking-wider mr-2">React</span>
            {['❤️', '🔥', '😂', '😮', '👏'].map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-xl transition-transform hover:scale-110"
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRatingModal(true)}
              className="px-4 py-2 rounded-xl border border-[#C5A059]/30 bg-[#C5A059]/10 text-[#C5A059] hover:bg-[#C5A059]/20 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            >
              <Star className="w-4 h-4 fill-[#C5A059]" /> Rate Room
            </button>

            {isHost && (
              <button
                onClick={() => setShowPollModal(true)}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-stone-200 hover:bg-white/10 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
              >
                <Activity className="w-4 h-4" /> Create Poll
              </button>
            )}

            <button
              onClick={onLeave}
              className="px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            >
              Leave Room
            </button>
          </div>
        </div>

        {/* Active Polls */}
        {roomState.polls.map(poll => {
          const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0);
          const hasVoted = poll.options.some(opt => opt.votes.includes(currentUser.id));

          return (
            <div key={poll.id} className="glass-card p-5 rounded-2xl border border-[#C5A059]/20 shadow-[0_0_15px_rgba(197,160,89,0.05)]">
              <h4 className="font-serif text-lg text-stone-100 mb-4">{poll.question}</h4>
              <div className="flex flex-col gap-3">
                {poll.options.map(opt => {
                  const percent = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                  const isMyVote = opt.votes.includes(currentUser.id);

                  return (
                    <button
                      key={opt.id}
                      onClick={() => !hasVoted && handleVotePoll(poll.id, opt.id)}
                      disabled={hasVoted}
                      className={`relative w-full text-left p-3 rounded-xl overflow-hidden border transition-all ${isMyVote ? 'border-[#C5A059] bg-[#C5A059]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-[#C5A059]/20 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                      <div className="relative z-10 flex justify-between items-center text-sm font-medium">
                        <span className="text-stone-200">{opt.text}</span>
                        {hasVoted && <span className="text-stone-400 font-mono text-xs">{percent}% ({opt.votes.length})</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* RIGHT COLUMN: SIDEBAR */}
      <div className="w-full lg:w-80 flex flex-col gap-6">

        {/* Room Info & Stats */}
        <div className="glass-card p-5 rounded-2xl border border-white/5">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
            <div>
              <p className="text-[10px] uppercase font-mono text-stone-500 tracking-wider">Room Code</p>
              <h3 className="text-2xl font-serif text-[#C5A059] tracking-widest">{roomId}</h3>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-stone-300">
                <Star className="w-4 h-4 fill-[#C5A059] text-[#C5A059]" />
                <span className="font-bold">{averageRating}</span>
              </div>
              <p className="text-[9px] uppercase font-mono text-stone-500 tracking-wider">{roomState.ratings.length} Ratings</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-stone-400" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-stone-300">
              Participants ({roomState.participants.length})
            </h4>
          </div>

          <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2">
            {roomState.participants.map(p => (
              <div key={p.userId} className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-sm text-stone-300 truncate">{p.userName}</span>
                {p.role === 'host' && (
                  <span className="text-[9px] uppercase font-bold tracking-wider text-[#050505] bg-[#C5A059] px-2 py-0.5 rounded">Host</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="glass-card flex-1 flex flex-col rounded-2xl border border-white/5 overflow-hidden min-h-[300px]">
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#C5A059]" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-stone-300">Room Activity</h4>
          </div>
          <div ref={activityFeedRef} className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
            {activities.length === 0 ? (
              <p className="text-xs text-stone-500 text-center italic mt-10">No activity yet. Room is quiet.</p>
            ) : (
              activities.map(act => (
                <div key={act.id} className="text-xs text-stone-400">
                  <span className="text-stone-500 font-mono text-[10px] mr-2">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`${act.type === 'join' ? 'text-green-400/80' : act.type === 'leave' ? 'text-red-400/80' : act.type.includes('poll') ? 'text-blue-400/80' : 'text-stone-300'}`}>
                    {act.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Create Poll Modal */}
      {showPollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-serif text-stone-100 mb-6">Create New Poll</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] uppercase font-mono text-stone-500 tracking-wider block mb-2">Question</label>
                <input
                  type="text"
                  value={newPollQuestion}
                  onChange={e => setNewPollQuestion(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-stone-200 focus:border-[#C5A059]/50 focus:outline-none"
                  placeholder="E.g. Should we watch Dune part 2 next?"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono text-stone-500 tracking-wider block mb-2">Options</label>
                {newPollOptions.map((opt, i) => (
                  <input
                    key={i}
                    type="text"
                    value={opt}
                    onChange={e => {
                      const newOpts = [...newPollOptions];
                      newOpts[i] = e.target.value;
                      setNewPollOptions(newOpts);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-stone-200 focus:border-[#C5A059]/50 focus:outline-none mb-2"
                    placeholder={`Option ${i + 1}`}
                  />
                ))}
                <button
                  onClick={() => setNewPollOptions([...newPollOptions, ''])}
                  className="text-xs text-[#C5A059] hover:underline"
                >
                  + Add Option
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
              <button
                onClick={() => setShowPollModal(false)}
                className="px-4 py-2 rounded-lg text-stone-400 hover:text-stone-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePoll}
                className="bg-[#C5A059] text-stone-950 px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs"
              >
                Publish Poll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Movie Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-xs p-6 text-center">
            <h3 className="text-xl font-serif text-stone-100 mb-2">Rate Trailer</h3>
            <p className="text-xs text-[#C5A059] mb-1 font-bold">{roomState.currentVideoName || 'Current Trailer'}</p>
            <p className="text-xs text-stone-400 mb-6">Your rating helps others decide.</p>
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => handleRateMovie(star)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star className="w-8 h-8 text-stone-700 hover:text-[#C5A059] hover:fill-[#C5A059] transition-all" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowRatingModal(false)}
              className="text-xs text-stone-500 hover:text-stone-300 uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search Trailers Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-3xl p-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif text-stone-100">Search Movie Catalog</h3>
              <button onClick={() => { setShowSearchModal(false); setSearchQuery(''); }} className="text-stone-500 hover:text-stone-300">Close</button>
            </div>
            
            <form onSubmit={handleSearchTrailers} className="flex gap-3 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by movie name..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-stone-200 focus:border-[#C5A059]/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="bg-[#C5A059] text-stone-950 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center gap-2"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
              </button>
            </form>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 min-h-[300px]">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center h-full text-[#C5A059]">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p className="text-sm">Loading catalog...</p>
                </div>
              ) : filteredCatalogMovies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCatalogMovies.map((movie: any) => (
                    <div key={movie.id || movie._id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col gap-2">
                      <h4 className="font-bold text-stone-200">{movie.title}</h4>
                      <p className="text-xs text-stone-400">Genre: {movie.genre}</p>
                      <button 
                        onClick={() => handleSelectMovieTrailer(movie)}
                        className="mt-2 bg-[#C5A059] hover:bg-[#F1D299] text-stone-950 py-2 rounded-lg text-xs uppercase tracking-wider transition-colors font-bold flex items-center justify-center gap-2"
                      >
                        <PlaySquare className="w-4 h-4" /> Play for Room
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-stone-500 italic">
                  {searchQuery ? 'No movies found for your search.' : 'Type to search for a movie from catalog...'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
