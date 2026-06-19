import mongoose from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const MovieSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    title: { type: String, required: true },
    posterUrl: String,
    description: String,
    language: String,
    genre: { type: String, required: true },
    duration: { type: String, required: true },
    releaseDate: { type: Date, required: true },
    trailerUrl: String,
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    ratingDistribution: {
      type: Map,
      of: Number,
      default: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
    }
  },
  { timestamps: true }
);

const MovieModel = mongoose.model('Movie', MovieSchema);

class Movie {
  static _formatDoc(doc) {
    if (!doc) return null;
    if (doc.releaseDate && typeof doc.releaseDate.toISOString === 'function') {
      doc.releaseDate = doc.releaseDate.toISOString();
    }
    // ensure duration is a string since frontend expects it
    if (doc.duration !== undefined && typeof doc.duration !== 'string') {
      doc.duration = String(doc.duration);
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

  static async create(movieData) {
    const dataToSave = { ...movieData };
    delete dataToSave.id;
    delete dataToSave._id;
    const doc = await MovieModel.create(dataToSave);
    return this.toObj(doc);
  }

  static async findById(id) {
    const doc = await MovieModel.findById(id).lean();
    return this._formatDoc(doc);
  }

  static async getAll() {
    const docs = await MovieModel.find().sort({ createdAt: -1 }).lean();
    return docs.map((d) => this._formatDoc(d));
  }

  static async update(id, movieData) {
    const dataToUpdate = { ...movieData };
    delete dataToUpdate.id;
    delete dataToUpdate._id;
    const doc = await MovieModel.findByIdAndUpdate(id, dataToUpdate, { new: true }).lean();
    return this._formatDoc(doc);
  }

  static async delete(id) {
    await MovieModel.findByIdAndDelete(id);
    return true;
  }
}

export default Movie;
