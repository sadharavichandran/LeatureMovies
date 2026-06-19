import mongoose from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const PollSchema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    roomId: { type: String, required: true },
    question: { type: String, required: true },
    options: [
      {
        text: { type: String, required: true },
        votes: { type: Number, default: 0 }
      }
    ],
    userVotes: [
      {
        userId: { type: String, required: true },
        optionIndex: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

const PollModel = mongoose.model('Poll', PollSchema);

class Poll {
  static toObj(doc) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    obj.id = obj._id;
    delete obj._id;
    return obj;
  }

  static async create(pollData) {
    const dataToSave = { ...pollData };
    delete dataToSave.id;
    delete dataToSave._id;
    const doc = await PollModel.create(dataToSave);
    return this.toObj(doc);
  }

  static async findById(id) {
    const doc = await PollModel.findById(id).lean();
    if (!doc) return null;
    doc.id = doc._id;
    delete doc._id;
    return doc;
  }

  static async findByRoomId(roomId) {
    const docs = await PollModel.find({ roomId }).sort({ createdAt: 1 }).lean();
    return docs.map((d) => {
      d.id = d._id;
      delete d._id;
      return d;
    });
  }

  static async vote(pollId, userId, optionIndex) {
    const poll = await PollModel.findById(pollId);
    if (!poll) return null;

    const existingVoteIndex = poll.userVotes.findIndex(v => v.userId === userId);

    if (existingVoteIndex !== -1) {
      const prevOptionIndex = poll.userVotes[existingVoteIndex].optionIndex;
      if (prevOptionIndex === optionIndex) {
        // Prevent duplicate votes on the same option
        return this.toObj(poll);
      }
      // Decrease count of previous option if it is valid
      if (poll.options[prevOptionIndex]) {
        poll.options[prevOptionIndex].votes = Math.max(0, (poll.options[prevOptionIndex].votes || 0) - 1);
      }
      // Increase count of new option
      if (poll.options[optionIndex]) {
        poll.options[optionIndex].votes = (poll.options[optionIndex].votes || 0) + 1;
      }
      // Update vote record
      poll.userVotes[existingVoteIndex].optionIndex = optionIndex;
    } else {
      // User hasn't voted yet
      if (poll.options[optionIndex]) {
        poll.options[optionIndex].votes = (poll.options[optionIndex].votes || 0) + 1;
      }
      poll.userVotes.push({ userId, optionIndex });
    }

    await poll.save();
    return this.toObj(poll);
  }
}

export default Poll;
