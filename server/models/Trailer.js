import mongoose from 'mongoose';

const trailerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  movieName: { type: String, required: true },
  videoUrl: { type: String, required: true },
  uploadedBy: { type: String, required: true }, // host user ID or name
  roomId: { type: String }, // Optional, if we want to restrict by room
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Trailer', trailerSchema);
