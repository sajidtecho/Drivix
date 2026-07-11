/* global process */
import mongoose from 'mongoose';
import User from '../models/User.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
    
    // Automatically promote drivixmobility@gmail.com to admin if it exists
    await User.findOneAndUpdate(
      { email: 'drivixmobility@gmail.com' },
      { role: 'admin' }
    );
    console.log(`👑 Ensured drivixmobility@gmail.com is admin`);
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
