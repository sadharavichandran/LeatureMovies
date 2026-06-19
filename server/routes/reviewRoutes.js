import express from 'express';
import { submitReview, deleteReview, getTargetReviews, getAllTheatreReviews } from '../controllers/reviewController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, submitReview);
router.delete('/:targetId', authMiddleware, deleteReview);
router.get('/theatres', authMiddleware, getAllTheatreReviews);
router.get('/:targetId', getTargetReviews);

export default router;
