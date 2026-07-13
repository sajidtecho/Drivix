import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
console.log('Using MONGO_URI:', MONGO_URI);

try {
  console.log('Connecting...');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected successfully!');
  process.exit(0);
} catch (err) {
  console.error('Connection failed:', err.message);
  process.exit(1);
}
