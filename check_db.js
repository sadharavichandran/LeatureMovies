import mongoose from './server/config/database.js';
import Movie from './server/models/Movie.js';

setTimeout(async () => {
  const movies = await Movie.getAll();
  console.log(movies.map(m => ({ title: m.title, trailerUrl: m.trailerUrl })));
  process.exit(0);
}, 1000);
