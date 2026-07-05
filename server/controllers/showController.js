import Show from '../models/Show.js';
import WaitingQueue from '../models/WaitingQueue.js';

const showController = {
  async create(req, res) {
    try {
      const showData = req.body;
      showData.adminId = req.user.id;
      const show = await Show.create(showData);
      
      const io = req.app.get('io');
      if (io) io.emit('show_created', show);
      
      res.json({ message: 'Show created successfully', show });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      let adminId = null;
      const isSuperAdmin = req.user && req.user.role === 'superadmin';
      if (req.user && req.user.role === 'admin') {
        adminId = req.user.id;
      }
      const shows = await Show.getAll(adminId, isSuperAdmin);
      res.json({ shows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const show = await Show.findById(req.params.id);
      if (!show) {
        return res.status(404).json({ error: 'Show not found' });
      }
      res.json({ show });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async bookSeats(req, res) {
    try {
      const { seatNumbers, parkingSeatNumbers = [] } = req.body;
      const show = await Show.findById(req.params.id);

      if (!show) {
        return res.status(404).json({ error: 'Show not found' });
      }

      if (show.isCancelled) {
        return res.status(400).json({ error: 'Show is cancelled' });
      }

      const newBookedSeats = [...show.bookedSeats, ...seatNumbers];
      let updatedShow = await Show.updateBookedSeats(req.params.id, newBookedSeats);

      if (parkingSeatNumbers && parkingSeatNumbers.length > 0) {
        const newBookedParkingSeats = [...(updatedShow.bookedParkingSeats || []), ...parkingSeatNumbers];
        updatedShow = await Show.updateBookedParkingSeats(req.params.id, newBookedParkingSeats);
      }

      const io = req.app.get('io');
      if (io) io.emit('show_updated', updatedShow);

      res.json({ message: 'Seats booked successfully', show: updatedShow });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async releaseSeats(req, res) {
    try {
      const { seatNumbers, parkingSeatNumbers = [] } = req.body;
      const show = await Show.findById(req.params.id);

      if (!show) {
        return res.status(404).json({ error: 'Show not found' });
      }

      // Remove the seats from bookedSeats
      const newBookedSeats = show.bookedSeats.filter(seat => !seatNumbers.includes(seat));
      let updatedShow = await Show.updateBookedSeats(req.params.id, newBookedSeats);

      if (parkingSeatNumbers && parkingSeatNumbers.length > 0) {
        const newBookedParkingSeats = (updatedShow.bookedParkingSeats || []).filter(seat => !parkingSeatNumbers.includes(seat));
        updatedShow = await Show.updateBookedParkingSeats(req.params.id, newBookedParkingSeats);
      }

      const io = req.app.get('io');
      if (io) io.emit('show_updated', updatedShow);

      // Notify users on the waiting queue
      const waitlistEntries = await WaitingQueue.findActiveByShowId(req.params.id);
      if (io && waitlistEntries.length > 0) {
        waitlistEntries.forEach(entry => {
          io.to(`user_${entry.userId}`).emit('waitlist_alert', {
            showId: show.id,
            movieId: show.movieId,
            movieTitle: show.movieTitle,
            theatreId: show.theatreId,
            theatreName: show.theatreName,
            showDate: show.date,
            showTime: show.time,
            releasedSeats: seatNumbers
          });
        });
      }

      res.json({ message: 'Seats released successfully', show: updatedShow });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const existingShow = await Show.findById(req.params.id);
      if (!existingShow) {
        return res.status(404).json({ error: 'Show not found' });
      }
      if (req.user.role === 'admin' && existingShow.adminId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const show = await Show.update(req.params.id, req.body);
      if (!show) {
        return res.status(404).json({ error: 'Show not found' });
      }
      
      const io = req.app.get('io');
      if (io) io.emit('show_updated', show);
      
      res.json({ message: 'Show updated successfully', show });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const existingShow = await Show.findById(req.params.id);
      if (!existingShow) {
        return res.status(404).json({ error: 'Show not found' });
      }
      if (req.user.role === 'admin' && existingShow.adminId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await Show.delete(req.params.id);
      
      const io = req.app.get('io');
      if (io) io.emit('show_deleted', req.params.id);
      
      res.json({ message: 'Show deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
};

export default showController;
