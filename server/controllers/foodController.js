import Food from '../models/Food.js';

const foodController = {
  async create(req, res) {
    try {
      const foodData = req.body;
      if (!foodData.name || foodData.price === undefined || !foodData.imageUrl) {
        return res.status(400).json({ error: 'Name, price, and imageUrl are required.' });
      }
      foodData.adminId = req.user.id;
      const food = await Food.create(foodData);
      res.json({ message: 'Food item created successfully', food });
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
      const foods = await Food.getAll(adminId);
      res.json({ foods });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async getByTheatre(req, res) {
    try {
      let adminId = null;
      if (req.user && req.user.role === 'admin') {
        adminId = req.user.id;
      }
      const { theatreId } = req.params;
      const foods = await Food.getByTheatre(theatreId, adminId);
      res.json({ foods });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const food = await Food.findById(req.params.id);
      if (!food) {
        return res.status(404).json({ error: 'Food item not found' });
      }
      res.json({ food });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      console.log(`[DEBUG] Updating food item with ID: ${req.params.id}`);
      if (!req.params.id || req.params.id === 'undefined') {
        console.error('[DEBUG] Invalid food id received.');
        return res.status(400).json({ error: 'Invalid food id.' });
      }
      const existingFood = await Food.findById(req.params.id);
      if (!existingFood) {
        return res.status(404).json({ error: 'Food item not found' });
      }
      if (req.user.role === 'admin' && existingFood.adminId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const food = await Food.update(req.params.id, req.body);
      if (!food) {
        return res.status(404).json({ error: 'Food item not found' });
      }
      res.json({ message: 'Food item updated successfully', food });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      console.log(`[DEBUG] Deleting food item with ID: '${req.params.id}'`);
      if (req.params.id === undefined || req.params.id === 'undefined') {
        console.error('[DEBUG] Invalid food id. Aborting delete.');
        return res.status(400).json({ error: 'Invalid food id. Aborting delete.' });
      }
      const existingFood = await Food.findById(req.params.id);
      if (!existingFood) {
        return res.status(404).json({ error: 'Food item not found' });
      }
      if (req.user.role === 'admin' && existingFood.adminId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await Food.delete(req.params.id);
      res.json({ message: 'Food item deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
};

export default foodController;
