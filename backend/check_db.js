import mongoose from 'mongoose';

const ATLAS_URI = 'mongodb+srv://drivixmobility_db_user:X9lvJNDZ1RUknC4N@drivix.irkmtpg.mongodb.net/drivix';
const LOCAL_URI = 'mongodb://127.0.0.1:27017/drivix';

async function checkDb(uri, label) {
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`\n--- Checking ${label} ---`);
    console.log(`Connected to: ${conn.connection.host}`);
    
    // Check collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`Collections: ${collections.map(c => c.name).join(', ')}`);
    
    const User = conn.connection.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const userCount = await User.countDocuments({});
    console.log(`Total Users in ${label}: ${userCount}`);
    
    const Booking = conn.connection.model('Booking', new mongoose.Schema({}, { strict: false }), 'bookings');
    const bookingCount = await Booking.countDocuments({});
    console.log(`Total Bookings in ${label}: ${bookingCount}`);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(`Error connecting to ${label}:`, err.message);
    try { await mongoose.disconnect(); } catch (_) {}
  }
}

async function main() {
  await checkDb(LOCAL_URI, 'Local MongoDB');
  await checkDb(ATLAS_URI, 'MongoDB Atlas');
  process.exit(0);
}

main();
