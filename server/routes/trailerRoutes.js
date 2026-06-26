import express from 'express';
import { uploadTrailer, searchTrailers } from '../controllers/trailerController.js';

const router = express.Router();

router.post('/upload', uploadTrailer);
router.get('/search', searchTrailers);

export default router;
