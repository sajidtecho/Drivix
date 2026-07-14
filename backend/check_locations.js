import mongoose from 'mongoose';

const ATLAS_URI = 'mongodb+srv://drivixmobility_db_user:X9lvJNDZ1RUknC4N@drivix.irkmtpg.mongodb.net/drivix';
const LOCAL_URI = 'mongodb://127.0.0.1:27017/drivix';

async function checkLocations(uri, label) {
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`\n--- Checking ${label} ---`);
    
    // We try both names since mongoose might use singular/plural or different mappings
    const ParkingLocation = conn.connection.model('ParkingLocation', new mongoose.Schema({}, { strict: false }), 'parkinglocations');
    const locations = await ParkingLocation.find({});
    
    console.log(`Total locations found: ${locations.length}`);
    locations.forEach((loc, i) => {
      console.log(`[${i+1}] ID: ${loc._id} | Name: ${loc.parkingName || loc.name} | City: ${loc.city} | Slots: ${loc.totalSlots} | Coordinates: ${JSON.stringify(loc.coordinates || loc.location)}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(`Error checking ${label}:`, err.message);
    try { await mongoose.disconnect(); } catch (_) {}
  }
}

async function main() {
  await checkLocations(LOCAL_URI, 'Local MongoDB');
  await checkLocations(ATLAS_URI, 'MongoDB Atlas');
  process.exit(0);
}

main();
