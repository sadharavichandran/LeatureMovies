import Movie from '../models/Movie.js';

const movieController = {
  async create(req, res) {
    try {
      const movieData = { ...req.body };

      // Normalize duration: accept formats like "132 mins", "2h 12m", or numeric strings
      const parseDuration = (val) => {
        if (val === undefined || val === null) return undefined;
        if (typeof val === 'number') return val;
        if (typeof val !== 'string') return undefined;

        const s = val.trim();
        // Match patterns like "2h 15m" or "2h" or "150m" or "150 mins"
        const hourMatch = s.match(/(\d+)\s*h/);
        const minMatch = s.match(/(\d+)\s*m/);
        if (hourMatch || minMatch) {
          const hrs = hourMatch ? parseInt(hourMatch[1], 10) : 0;
          const mins = minMatch ? parseInt(minMatch[1], 10) : 0;
          return hrs * 60 + mins;
        }

        // Fallback: extract first integer number found
        const numMatch = s.match(/(\d+)/);
        if (numMatch) return parseInt(numMatch[1], 10);
        return undefined;
      };

      if (movieData.duration !== undefined) {
        const parsed = parseDuration(movieData.duration);
        if (parsed === undefined || Number.isNaN(parsed)) {
          return res.status(400).json({ error: 'Invalid duration format. Use minutes (e.g. 132) or "2h 12m".' });
        }
        movieData.duration = parsed;
      }
      const movie = await Movie.create(movieData);
      res.json({ message: 'Movie created successfully', movie });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const movies = await Movie.getAll();
      res.json({ movies });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const movie = await Movie.findById(req.params.id);
      if (!movie) {
        return res.status(404).json({ error: 'Movie not found' });
      }
      res.json({ movie });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      console.log(`[DEBUG] Updating movie with ID: ${req.params.id}`);
      if (!req.params.id || req.params.id === 'undefined') {
        console.error('[DEBUG] Invalid movie id received.');
        return res.status(400).json({ error: 'Invalid movie id.' });
      }
      const updateData = { ...req.body };
      const parseDuration = (val) => {
        if (val === undefined || val === null) return undefined;
        if (typeof val === 'number') return val;
        if (typeof val !== 'string') return undefined;
        const s = val.trim();
        const hourMatch = s.match(/(\d+)\s*h/);
        const minMatch = s.match(/(\d+)\s*m/);
        if (hourMatch || minMatch) {
          const hrs = hourMatch ? parseInt(hourMatch[1], 10) : 0;
          const mins = minMatch ? parseInt(minMatch[1], 10) : 0;
          return hrs * 60 + mins;
        }
        const numMatch = s.match(/(\d+)/);
        if (numMatch) return parseInt(numMatch[1], 10);
        return undefined;
      };

      if (updateData.duration !== undefined) {
        const parsed = parseDuration(updateData.duration);
        if (parsed === undefined || Number.isNaN(parsed)) {
          return res.status(400).json({ error: 'Invalid duration format. Use minutes (e.g. 132) or "2h 12m".' });
        }
        updateData.duration = parsed;
      }

      const movie = await Movie.update(req.params.id, updateData);
      if (!movie) {
        return res.status(404).json({ error: 'Movie not found' });
      }
      res.json({ message: 'Movie updated successfully', movie });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      console.log(`[DEBUG] Deleting movie with ID: '${req.params.id}'`);
      if (req.params.id === undefined || req.params.id === 'undefined') {
        console.error('[DEBUG] Invalid movie id. Aborting delete.');
        return res.status(400).json({ error: 'Invalid movie id. Aborting delete.' });
      }
      await Movie.delete(req.params.id);
      res.json({ message: 'Movie deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
};

export default movieController;
