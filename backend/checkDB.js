import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Vehicle from './models/Vehicle.js';

dotenv.config();

const checkURI = async (uri, name) => {
  try {
    console.log(`\n=== Checking ${name} ===`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });

    const vehicles = await Vehicle.find({});
    console.log(`Total Standalone Vehicles: ${vehicles.length}`);
    vehicles.forEach(v => {
      console.log(`- Vehicle Number: ${v.vehicleNumber} | Model: ${v.model} | fuelType: "${v.fuelType}" | vehicleType: "${v.vehicleType}"`);
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
};

run();
