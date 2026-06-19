import mongoose from 'mongoose';

const lostFoundSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  theatreId: { type: String, required: true },
  theatreName: { type: String, required: true },
  type: { type: String, enum: ['Lost', 'Found'], required: true },
  itemName: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  imageUrl: { type: String }, // Optional Base64 or URL
  status: { type: String, enum: ['Pending', 'Under Review', 'Found', 'Returned', 'Closed'], default: 'Pending' },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
}, {
  timestamps: false, // We will manually manage createdAt/updatedAt as Strings or let app pass them
});

// Remove MongoDB specific fields when converting to JSON
lostFoundSchema.method('toJSON', function() {
  const { __v, _id, ...object } = this.toObject();
  return object;
});

const LostFound = mongoose.model('LostFound', lostFoundSchema);
export default LostFound;
