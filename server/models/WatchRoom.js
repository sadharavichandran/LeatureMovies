import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  role: { type: String, enum: ['host', 'participant'], default: 'participant' },
  joinedAt: { type: Date, default: Date.now },
});

const pollOptionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  votes: [{ type: String }], // array of userIds
});

const pollSchema = new mongoose.Schema({
  id: { type: String, required: true },
  question: { type: String, required: true },
  options: [pollOptionSchema],
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

const ratingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
});

const watchRoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  hostId: { type: String, required: true },
  participants: [participantSchema],
  currentVideoUrl: { type: String, default: '' },
  currentVideoName: { type: String, default: '' },
  currentTimestamp: { type: Number, default: 0 },
  isPlaying: { type: Boolean, default: false },
  polls: [pollSchema],
  ratings: [ratingSchema],
  createdAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
});

export default mongoose.model('WatchRoom', watchRoomSchema);
