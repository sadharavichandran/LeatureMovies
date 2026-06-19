import mongoose from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const FoodSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    category: { type: String, default: 'Snacks' },
    theatreId: { type: String, default: null }, // null means available at all theatres
  },
  { timestamps: true }
);

const FoodModel = mongoose.model('Food', FoodSchema);

class Food {
  static toObj(doc) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    obj.id = obj._id;
    delete obj._id;
    return obj;
  }

  static async create(foodData) {
    const dataToSave = { ...foodData };
    delete dataToSave.id;
    delete dataToSave._id;
    const doc = await FoodModel.create(dataToSave);
    return this.toObj(doc);
  }

  static async findById(id) {
    const doc = await FoodModel.findById(id).lean();
    if (!doc) return null;
    doc.id = doc._id;
    delete doc._id;
    return doc;
  }

  static async getAll() {
    const docs = await FoodModel.find().sort({ name: 1 }).lean();
    return docs.map((d) => {
      d.id = d._id;
      delete d._id;
      return d;
    });
  }

  static async getByTheatre(theatreId) {
    // Return foods that belong to this theatre OR have no theatreId (global foods)
    const docs = await FoodModel.find({
      $or: [{ theatreId }, { theatreId: null }, { theatreId: { $exists: false } }]
    }).sort({ name: 1 }).lean();
    return docs.map((d) => {
      d.id = d._id;
      delete d._id;
      return d;
    });
  }

  static async update(id, foodData) {
    const dataToUpdate = { ...foodData };
    delete dataToUpdate.id;
    delete dataToUpdate._id;
    const doc = await FoodModel.findByIdAndUpdate(id, dataToUpdate, { new: true }).lean();
    if (!doc) return null;
    doc.id = doc._id;
    delete doc._id;
    return doc;
  }

  static async delete(id) {
    await FoodModel.findByIdAndDelete(id);
    return true;
  }
}

export default Food;
