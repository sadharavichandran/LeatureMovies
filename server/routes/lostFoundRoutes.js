import express from 'express';
import {
  createReport,
  getAllReports,
  getUserReports,
  updateReportStatus
} from '../controllers/lostFoundController.js';

const router = express.Router();

router.post('/', createReport);
router.get('/', getAllReports);
router.get('/user/:userId', getUserReports);
router.put('/:id/status', updateReportStatus);

export default router;
