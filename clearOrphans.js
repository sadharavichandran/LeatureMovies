import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/LeatureMovies';

mongoose.set('strictQuery', false);

async function clearOrphans() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    const mRes = await db.collection('movies').deleteMany({ 
      $or: [{ adminId: null }, { adminId: { $exists: false } }] 
    });
    console.log(`Deleted ${mRes.deletedCount} orphaned movies.`);

    const tRes = await db.collection('theatres').deleteMany({ 
      $or: [{ adminId: null }, { adminId: { $exists: false } }] 
    });
    console.log(`Deleted ${tRes.deletedCount} orphaned theatres.`);

    const sRes = await db.collection('shows').deleteMany({ 
      $or: [{ adminId: null }, { adminId: { $exists: false } }] 
    });
    console.log(`Deleted ${sRes.deletedCount} orphaned shows.`);

    const fRes = await db.collection('foods').deleteMany({ 
      $or: [{ adminId: null }, { adminId: { $exists: false } }] 
    });
    console.log(`Deleted ${fRes.deletedCount} orphaned food items.`);

    const bRes = await db.collection('bookings').deleteMany({ 
      $or: [{ adminId: null }, { adminId: { $exists: false } }] 
    });
    console.log(`Deleted ${bRes.deletedCount} orphaned bookings.`);

    console.log('\nAll done! Orphaned records have been removed.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

clearOrphans();
