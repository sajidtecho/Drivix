import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Vehicle from './models/Vehicle.js';

dotenv.config();

const checkURI = async (uri, name) => {
  try {
    console.log(`\n=== Checking ${name} (${uri.split('@').pop()}) ===`);
    // Close existing connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    console.log('Connected successfully!');

    const users = await User.find({});
    console.log(`Total Users: ${users.length}`);
    users.forEach(u => {
      console.log(`- User: ${u.fullName || u.name} | Mobile: ${u.mobile}`);
      console.log(`  Embedded Vehicles:`, u.vehicles);
    });

    const vehicles = await Vehicle.find({});
    console.log(`Total Standalone Vehicles: ${vehicles.length}`);
    vehicles.forEach(v => {
      console.log(`- Vehicle: ${v.vehicleNumber} | Model: ${v.model}`);
    });

  } catch (error) {
    console.warn(`Could not query ${name}:`, error.message);
  }
};

const run = async () => {
  const atlasURI = process.env.MONGO_URI;
  const localURI = process.env.MONGO_LOCAL_URI || 'mongodb://127.0.0.1:27017/drivix';

  if (atlasURI) {
    await checkURI(atlasURI, 'MongoDB Atlas (Production)');
  }
  await checkURI(localURI, 'Local MongoDB');

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  console.log('\nDone.');
};

run();
