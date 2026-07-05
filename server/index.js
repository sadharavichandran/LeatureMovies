import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import theatreRoutes from './routes/theatreRoutes.js';
import showRoutes from './routes/showRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import lostFoundRoutes from './routes/lostFoundRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import waitingQueueRoutes from './routes/waitingQueueRoutes.js';
import watchRoomRoutes from './routes/watchRoomRoutes.js';
import trailerRoutes from './routes/trailerRoutes.js';
import guideRoutes from './routes/guideRoutes.js';

import http from 'http';
import { initSocket } from './socket.js';

const app = express();
const server = http.createServer(app);
const io = initSocket(server);
app.set('io', io);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/waiting-queue', waitingQueueRoutes);
app.use('/api/watch-room', watchRoomRoutes);
app.use('/api/trailers', trailerRoutes);
app.use('/api/guide', guideRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// 404 API route handler
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found or invalid parameters.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or set a different PORT in your .env file.`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
