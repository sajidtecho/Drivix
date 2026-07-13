import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Slot from './models/Slot.js';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
console.log('Connecting...');
await mongoose.connect(MONGO_URI);

const slots = await Slot.find({}).sort({ id: 1 });
console.log(`Found ${slots.length} slots in total:`);
for (const s of slots) {
  console.log(`- ID: ${s.id}, Floor: ${s.floor}, Row: ${s.row}, Number: ${s.number}, Status: ${s.status}`);
}

process.exit(0);
