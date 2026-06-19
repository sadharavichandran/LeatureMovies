import express from 'express';
import bookingController from '../controllers/bookingController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, adminMiddleware, bookingController.getAll);
router.get('/my-bookings', authMiddleware, bookingController.getUserBookings);
router.get('/:id', authMiddleware, bookingController.getById);
router.post('/', authMiddleware, bookingController.create);
router.put('/:id', authMiddleware, bookingController.update);
router.delete('/:id', authMiddleware, adminMiddleware, bookingController.delete);

export default router;
