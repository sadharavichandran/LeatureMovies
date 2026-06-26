import mongoose from 'mongoose';

await mongoose.connect('mongodb://127.0.0.1:27017/leaturemovies');

const TheatreModel = mongoose.model('Theatre', new mongoose.Schema({}, { strict: false }));
const ShowModel    = mongoose.model('Show',    new mongoose.Schema({}, { strict: false }));

const theatres = await TheatreModel.find({});
console.log('Theatres:', theatres.map(t => ({ name: t.name, id: t._id, seats: (t.selectedLayoutSeats||[]).length })));

const shows = await ShowModel.find({});
console.log('Shows:', shows.map(s => ({ title: s.movieTitle, theatreId: s.theatreId, seats: (s.seatNumbers||[]).length })));

await mongoose.disconnect();
