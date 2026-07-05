import mongoose from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const BookingSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    userId: String,
    userName: String,
    userEmail: String,
    showId: String,
    movieId: String,
    movieTitle: String,
    moviePoster: String,
    theatreId: String,
    theatreName: String,
    screenNumber: String,
    showDate: Date,
    showTime: String,
    seatNumbers: [String],
    ticketCount: Number,
    ticketPrice: Number,
    totalAmount: Number,
    paymentStatus: { type: String, default: 'Pending' },
    paymentMethod: String,
    qrCodeUrl: String,
    foodOrderItems: { type: Array, default: [] },
    foodDeliveryOption: String,
    foodDeliveryFee: { type: Number, default: 0 },
    parkingSeatNumbers: { type: Array, default: [] },
    parkingTotalCost: { type: Number, default: 0 },
    isCancelled: { type: Boolean, default: false },
    bookingDate: { type: Date, default: Date.now },
    coinsEarned: { type: Number, default: 0 },
    coinsUsed: { type: Number, default: 0 },
    adminId: { type: String, default: null },
  },
  { timestamps: true }
);

const BookingModel = mongoose.model('Booking', BookingSchema);

class Booking {
  static toObj(doc) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    obj.id = obj._id;
    delete obj._id;
    return obj;
  }

  static async create(bookingData) {
    const dataToSave = { ...bookingData };
    delete dataToSave.id;
    delete dataToSave._id;
    const doc = await BookingModel.create(dataToSave);
    return this.toObj(doc);
  }

  static async findById(id) {
    const doc = await BookingModel.findById(id).lean();
    if (!doc) return null;
    doc.id = doc._id;
    delete doc._id;
    return doc;
  }

  static async findByUserId(userId) {
    const docs = await BookingModel.find({ userId, isCancelled: false }).sort({ bookingDate: -1 }).lean();
    return docs.map((d) => {
      d.id = d._id;
      delete d._id;
      return d;
    });
  }

  static async getAll(adminId = null) {
    const query = adminId ? { adminId } : {};
    const docs = await BookingModel.find(query).sort({ bookingDate: -1 }).lean();
    return docs.map((d) => {
      d.id = d._id;
      delete d._id;
      return d;
    });
  }

  static async update(id, updateData) {
    const dataToUpdate = { ...updateData };
    delete dataToUpdate.id;
    delete dataToUpdate._id;
    const doc = await BookingModel.findByIdAndUpdate(id, dataToUpdate, { new: true }).lean();
    if (!doc) return null;
    doc.id = doc._id;
    delete doc._id;
    return doc;
  }

  static async delete(id) {
    await BookingModel.findByIdAndDelete(id);
    return true;
  }
}

export default Booking;
