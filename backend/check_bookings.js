import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';
import Slot from './models/Slot.js';
dotenv.config();

const MONGO_URI = 'mongodb://127.0.0.1:27017/drivix';
console.log('Connecting to local database...');
await mongoose.connect(MONGO_URI);

const activeBookings = await Booking.find({ status: 'booked' });
console.log(`Found ${activeBookings.length} local active bookings:`);
for (const b of activeBookings) {
  console.log(`- Slot: ${b.slotId} (status=${b.status})`);
}

const bookedSlots = await Slot.find({ status: 'booked' });
console.log(`Found ${bookedSlots.length} local slots with status 'booked':`);
for (const s of bookedSlots) {
  console.log(`- Slot: ${s.id} (status=${s.status})`);
}

process.exit(0);
