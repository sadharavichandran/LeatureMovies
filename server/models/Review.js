import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const reviewSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  targetType: {
    type: String,
    enum: ['Movie', 'Theatre', 'Platform'],
    required: true,
  },
  targetId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
  },
}, { 
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

// Ensure one review per user per target
reviewSchema.index({ targetId: 1, userId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
