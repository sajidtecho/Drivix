import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Slot from './models/Slot.js';
dotenv.config();

const MONGO_URI = 'mongodb://127.0.0.1:27017/drivix';
console.log('Connecting to local database...');
await mongoose.connect(MONGO_URI);

const slots = await Slot.find({}).sort({ id: 1 });
console.log(`Found ${slots.length} local slots:`);
for (const s of slots) {
  if (s.status !== 'available') {
    console.log(`- Slot: ${s.id}, Status: ${s.status}, Floor: ${s.floor}`);
  }
}

process.exit(0);
