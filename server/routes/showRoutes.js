import express from 'express';
import showController from '../controllers/showController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', showController.getAll);
router.get('/:id', showController.getById);
router.post('/', authMiddleware, adminMiddleware, showController.create);
router.post('/:id/book-seats', authMiddleware, showController.bookSeats);
router.post('/:id/release-seats', authMiddleware, showController.releaseSeats);
router.put('/:id', authMiddleware, adminMiddleware, showController.update);
router.delete('/:id', authMiddleware, adminMiddleware, showController.delete);

export default router;
