import fs from 'fs';
import path from 'path';
import multer from 'multer';
import Trailer from '../models/Trailer.js';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

const upload = multer({ storage: storage }).single('video');

export const uploadTrailer = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Error uploading file:', err);
      return res.status(500).json({ success: false, error: 'File upload failed' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No video file provided' });
      }

      const { title, movieName, uploadedBy, roomId } = req.body;
      
      const videoUrl = `/uploads/${req.file.filename}`;

      const newTrailer = new Trailer({
        title: title || 'Untitled Trailer',
        movieName: movieName || 'Unknown Movie',
        videoUrl,
        uploadedBy: uploadedBy || 'Anonymous',
        roomId
      });

      await newTrailer.save();

      res.status(201).json({ success: true, trailer: newTrailer });
    } catch (error) {
      console.error('Error saving trailer to DB:', error);
      res.status(500).json({ success: false, error: 'Failed to save trailer details' });
    }
  });
};

export const searchTrailers = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};
    if (q) {
      // Case-insensitive regex search for movieName or title
      query = {
        $or: [
          { movieName: { $regex: q, $options: 'i' } },
          { title: { $regex: q, $options: 'i' } }
        ]
      };
    }
    
    const trailers = await Trailer.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, trailers });
  } catch (error) {
    console.error('Error searching trailers:', error);
    res.status(500).json({ success: false, error: 'Failed to search trailers' });
  }
};
