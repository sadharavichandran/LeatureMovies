import mongoose from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobileNumber: String,
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    rewardCoins: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const UserModel = mongoose.model('User', UserSchema);

class User {
  static toPublic(doc) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    obj.id = obj._id;
    delete obj._id;
    delete obj.password;
    return obj;
  }

  static async create(fullName, email, mobileNumber, passwordHash, role = 'user') {
    const doc = await UserModel.create({ fullName, email, mobileNumber, password: passwordHash, role, rewardCoins: 0 });
    return this.toPublic(doc);
  }

  static async findByEmail(email) {
    return await UserModel.findOne({ email }).lean();
  }

  static async findById(id) {
    const doc = await UserModel.findById(id).lean();
    if (!doc) return null;
    doc.id = doc._id;
    delete doc._id;
    delete doc.password;
    return doc;
  }

  static async getAll() {
    const docs = await UserModel.find().select('fullName email mobileNumber role rewardCoins createdAt').lean();
    return docs.map(d => ({ ...d, id: d._id, _id: undefined }));
  }

  static async updateCoins(id, amount) {
    const doc = await UserModel.findByIdAndUpdate(
      id,
      { $inc: { rewardCoins: amount } },
      { new: true }
    ).lean();
    if (!doc) return null;
    doc.id = doc._id;
    delete doc._id;
    delete doc.password;
    return doc;
  }
}

export default User;
