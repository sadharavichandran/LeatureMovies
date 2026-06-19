import express from 'express';
import waitingQueueController from '../controllers/waitingQueueController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/join', authMiddleware, waitingQueueController.join);
router.delete('/:id', authMiddleware, waitingQueueController.leave);
router.get('/my-queue', authMiddleware, waitingQueueController.getUserEntries);
router.get('/all', authMiddleware, adminMiddleware, waitingQueueController.getAllEntries);

export default router;
