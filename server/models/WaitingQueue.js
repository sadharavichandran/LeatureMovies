import mongoose from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const WaitingQueueSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    showId: { type: String, required: true },
    movieId: { type: String, required: true },
    movieTitle: { type: String, required: true },
    theatreId: { type: String, required: true },
    theatreName: { type: String, required: true },
    showTime: { type: String, required: true },
    seatsRequested: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const WaitingQueueModel = mongoose.model('WaitingQueue', WaitingQueueSchema);

class WaitingQueue {
  static toObj(doc) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    obj.id = obj._id;
    delete obj._id;
    return obj;
  }

  static async create(data) {
    const dataToSave = { ...data };
    delete dataToSave.id;
    delete dataToSave._id;
    const doc = await WaitingQueueModel.create(dataToSave);
    return this.toObj(doc);
  }

  static async findActiveByShowId(showId) {
    const docs = await WaitingQueueModel.find({ showId, isActive: true }).lean();
    return docs.map((d) => this.toObj(d));
  }

  static async findActiveByUserId(userId) {
    const docs = await WaitingQueueModel.find({ userId, isActive: true }).sort({ createdAt: -1 }).lean();
    return docs.map((d) => this.toObj(d));
  }

  static async findById(id) {
    const doc = await WaitingQueueModel.findById(id).lean();
    return this.toObj(doc);
  }

  static async update(id, updateData) {
    const dataToUpdate = { ...updateData };
    delete dataToUpdate.id;
    delete dataToUpdate._id;
    const doc = await WaitingQueueModel.findByIdAndUpdate(id, dataToUpdate, { new: true }).lean();
    return this.toObj(doc);
  }

  static async findAll() {
    const docs = await WaitingQueueModel.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    return docs.map((d) => this.toObj(d));
  }

  static async delete(id) {
    await WaitingQueueModel.findByIdAndDelete(id);
    return true;
  }
}

export default WaitingQueue;
