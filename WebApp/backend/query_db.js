import mongoose from 'mongoose';
import connectDB from './config/db.js';
import ParkingLocation from './models/ParkingLocation.js';
import dotenv from 'dotenv';

dotenv.config();

const query = async () => {
  try {
    await connectDB();
    const locations = await ParkingLocation.find({});
    console.log('--- PARKING LOCATIONS IN DB ---');
    console.log(JSON.stringify(locations, null, 2));
    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
};

query();
