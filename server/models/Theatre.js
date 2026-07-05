import mongoose from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const TheatreSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    name: { type: String, required: true },
    location: String,
    screens: Number,
    hasParking: { type: Boolean, default: false },
    parkingTwoWheelerRows: { type: Number, default: 0 },
    parkingTwoWheelerCols: { type: Number, default: 0 },
    parkingFourWheelerRows: { type: Number, default: 0 },
    parkingFourWheelerCols: { type: Number, default: 0 },
    parkingTwoWheelerCost: { type: Number, default: 0 },
    parkingFourWheelerCost: { type: Number, default: 0 },
    maxRows: { type: Number, default: 10 },
    maxCols: { type: Number, default: 15 },
    selectedLayoutSeats: { type: [String], default: [] },
    vipRows: { type: Number, default: 2 },
    premiumRows: { type: Number, default: 2 },
    adminId: { type: String, default: null },
  },
  { timestamps: true }
);

const TheatreModel = mongoose.model('Theatre', TheatreSchema);

class Theatre {
  static toObj(doc) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    obj.id = obj._id;
    delete obj._id;
    return obj;
  }

  static async create(theatreData) {
    const dataToSave = { ...theatreData };
    delete dataToSave.id;
    delete dataToSave._id;
    const doc = await TheatreModel.create(dataToSave);
    return this.toObj(doc);
  }

  static async findById(id) {
    const doc = await TheatreModel.findById(id).lean();
    if (!doc) return null;
    doc.id = doc._id;
    delete doc._id;
    return doc;
  }

  static async getAll(adminId = null) {
    const query = adminId ? { adminId } : {};
    const docs = await TheatreModel.find(query).sort({ name: 1 }).lean();
    return docs.map((d) => {
      d.id = d._id;
      delete d._id;
      return d;
    });
  }

  static async update(id, theatreData) {
    const dataToUpdate = { ...theatreData };
    delete dataToUpdate.id;
    delete dataToUpdate._id;
    const doc = await TheatreModel.findByIdAndUpdate(id, dataToUpdate, { new: true }).lean();
    if (!doc) return null;
    doc.id = doc._id;
    delete doc._id;
    return doc;
  }

  static async delete(id) {
    await TheatreModel.findByIdAndDelete(id);
    return true;
  }
}

export default Theatre;
