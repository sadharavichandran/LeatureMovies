import WaitingQueue from '../models/WaitingQueue.js';
import User from '../models/User.js';

const waitingQueueController = {
  async join(req, res) {
    try {
      const { showId, movieId, movieTitle, theatreId, theatreName, showTime, seatsRequested } = req.body;
      const userId = req.user.id;
      
      let userName = req.user.fullName;
      let userEmail = req.user.email;

      if (!userName || !userEmail) {
        const user = await User.findById(userId);
        if (user) {
          userName = userName || user.fullName;
          userEmail = userEmail || user.email;
        }
      }

      // Find active entries of user
      const activeEntries = await WaitingQueue.findActiveByUserId(userId);
      const existingEntry = activeEntries.find(entry => entry.showId === showId);

      let entry;
      if (existingEntry) {
        // Merge or replace seatsRequested
        entry = await WaitingQueue.update(existingEntry.id, { seatsRequested });
      } else {
        entry = await WaitingQueue.create({
          userId,
          userName,
          userEmail,
          showId,
          movieId,
          movieTitle,
          theatreId,
          theatreName,
          showTime,
          seatsRequested,
          isActive: true
        });
      }

      res.json({ message: 'Successfully joined waitlist', entry });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async leave(req, res) {
    try {
      const { id } = req.params;
      const entry = await WaitingQueue.findById(id);
      if (!entry) {
        return res.status(404).json({ error: 'Waitlist entry not found' });
      }

      if (entry.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Mark as inactive instead of deleting (or we can delete, let's mark inactive as per design)
      await WaitingQueue.update(id, { isActive: false });
      res.json({ message: 'Successfully left waitlist' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async getUserEntries(req, res) {
    try {
      const entries = await WaitingQueue.findActiveByUserId(req.user.id);
      res.json({ entries });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async getAllEntries(req, res) {
    try {
      const entries = await WaitingQueue.findAll();
      res.json({ entries });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
};

export default waitingQueueController;
