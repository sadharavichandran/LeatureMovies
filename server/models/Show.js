import mongoose from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const ShowSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    movieId: String,
    movieTitle: String,
    moviePoster: String,
    theatreId: String,
    theatreName: String,
    location: String,
    screenNumber: String,
    date: String,
    time: String,
    ticketPrice: Number,
    totalSeats: Number,
    seatNumbers: [String],
    vipSeats: [String],
    premiumSeats: [String],
    regularSeats: [String],
    bookedSeats: [String],
    bookedParkingSeats: [String],
    maxRows: { type: Number, default: 10 },
    maxCols: { type: Number, default: 15 },
    vipRows: { type: Number, default: 2 },
    premiumRows: { type: Number, default: 2 },
    isCancelled: { type: Boolean, default: false },
    adminId: { type: String, default: null },
  },
  { timestamps: true }
);

const ShowModel = mongoose.model('Show', ShowSchema);

class Show {
  static _formatDoc(doc) {
    if (!doc) return null;
    if (doc.date && typeof doc.date.toISOString === 'function') {
      doc.date = doc.date.toISOString().split('T')[0];
    } else if (doc.date && typeof doc.date === 'string' && doc.date.includes('T')) {
      doc.date = doc.date.split('T')[0];
    }
    doc.id = doc._id;
    delete doc._id;
    return doc;
  }

  static toObj(doc) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    return this._formatDoc(obj);
  }

  static async create(showData) {
    const dataToSave = { ...showData };
    delete dataToSave.id;
    delete dataToSave._id;
    const doc = await ShowModel.create(dataToSave);
    return this.toObj(doc);
  }

  static async findById(id) {
    const doc = await ShowModel.findById(id).lean();
    return this._formatDoc(doc);
  }

  static async getAll(adminId = null, includeCancelled = false) {
    const query = includeCancelled ? {} : { isCancelled: false };
    if (adminId) query.adminId = adminId;
    const docs = await ShowModel.find(query).sort({ date: 1, time: 1 }).lean();
    return docs.map((d) => this._formatDoc(d));
  }

  static async updateBookedSeats(id, bookedSeats, bookedParkingSeats = []) {
    // If we want to strictly keep existing signatures or expand them, 
    // it's safer to just provide an update generic method, or add bookedParkingSeats to the signature.
    // However, the signature here is specifically updateBookedSeats. Let's just create a new method for parking.
    const doc = await ShowModel.findByIdAndUpdate(id, { bookedSeats }, { new: true }).lean();
    return this._formatDoc(doc);
  }

  static async updateBookedParkingSeats(id, bookedParkingSeats) {
    const doc = await ShowModel.findByIdAndUpdate(id, { bookedParkingSeats }, { new: true }).lean();
    return this._formatDoc(doc);
  }

  static async update(id, showData) {
    const dataToUpdate = { ...showData };
    delete dataToUpdate.id;
    delete dataToUpdate._id;
    const doc = await ShowModel.findByIdAndUpdate(id, dataToUpdate, { new: true }).lean();
    return this._formatDoc(doc);
  }

  static async delete(id) {
    await ShowModel.findByIdAndDelete(id);
    return true;
  }
}

export default Show;
