import express from 'express';
import movieController from '../controllers/movieController.js';
import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuthMiddleware, movieController.getAll);
router.get('/:id', movieController.getById);
router.post('/', authMiddleware, adminMiddleware, movieController.create);
router.put('/:id', authMiddleware, adminMiddleware, movieController.update);
router.delete('/:id', authMiddleware, adminMiddleware, movieController.delete);
router.delete('/', authMiddleware, adminMiddleware, (req, res) => {
  req.params.id = "";
  return movieController.delete(req, res);
});

export default router;
