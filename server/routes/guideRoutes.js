import express from 'express';
import { askGuide } from '../controllers/guideController.js';

const router = express.Router();

router.post('/ask', askGuide);

export default router;
