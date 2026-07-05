import Theatre from '../models/Theatre.js';

const theatreController = {
  async create(req, res) {
    try {
      const theatreData = req.body;
      theatreData.adminId = req.user.id;
      const theatre = await Theatre.create(theatreData);
      res.json({ message: 'Theatre created successfully', theatre });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      let adminId = null;
      if (req.user && req.user.role === 'admin') {
        adminId = req.user.id;
      }
      const theatres = await Theatre.getAll(adminId);
      res.json({ theatres });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const theatre = await Theatre.findById(req.params.id);
      if (!theatre) {
        return res.status(404).json({ error: 'Theatre not found' });
      }
      res.json({ theatre });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      console.log(`[DEBUG] Updating theatre with ID: ${req.params.id}`);
      if (!req.params.id || req.params.id === 'undefined') {
        console.error('[DEBUG] Invalid theatre id received.');
        return res.status(400).json({ error: 'Invalid theatre id.' });
      }
      const existingTheatre = await Theatre.findById(req.params.id);
      if (!existingTheatre) {
        return res.status(404).json({ error: 'Theatre not found' });
      }
      if (req.user.role === 'admin' && existingTheatre.adminId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const theatre = await Theatre.update(req.params.id, req.body);
      if (!theatre) {
        return res.status(404).json({ error: 'Theatre not found' });
      }
      res.json({ message: 'Theatre updated successfully', theatre });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      console.log(`[DEBUG] Deleting theatre with ID: '${req.params.id}'`);
      if (req.params.id === undefined || req.params.id === 'undefined') {
        console.error('[DEBUG] Invalid theatre id. Aborting delete.');
        return res.status(400).json({ error: 'Invalid theatre id. Aborting delete.' });
      }
      const existingTheatre = await Theatre.findById(req.params.id);
      if (!existingTheatre) {
        return res.status(404).json({ error: 'Theatre not found' });
      }
      if (req.user.role === 'admin' && existingTheatre.adminId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await Theatre.delete(req.params.id);
      res.json({ message: 'Theatre deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
};

export default theatreController;
