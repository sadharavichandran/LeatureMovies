import express from 'express';
import foodController from '../controllers/foodController.js';
import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuthMiddleware, foodController.getAll);
router.get('/theatre/:theatreId', optionalAuthMiddleware, foodController.getByTheatre);
router.get('/:id', foodController.getById);
router.post('/', authMiddleware, adminMiddleware, foodController.create);
router.put('/:id', authMiddleware, adminMiddleware, foodController.update);
router.delete('/:id', authMiddleware, adminMiddleware, foodController.delete);
router.delete('/', authMiddleware, adminMiddleware, (req, res) => {
  req.params.id = "";
  return foodController.delete(req, res);
});

export default router;
