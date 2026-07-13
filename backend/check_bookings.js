import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';
import Slot from './models/Slot.js';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
console.log('Connecting...');
await mongoose.connect(MONGO_URI);

const activeBookings = await Booking.find({ status: 'booked' });
console.log(`Found ${activeBookings.length} active bookings:`);
for (const b of activeBookings) {
  const endTime = new Date(b.createdAt.getTime() + b.duration * 60 * 60 * 1000);
  console.log(`Booking ID: ${b.bookingId}`);
  console.log(`- Slot: ${b.slotId} on Floor: ${b.floor}`);
  console.log(`- CreatedAt: ${b.createdAt}`);
  console.log(`- Duration: ${b.duration} hours`);
  console.log(`- EndTime: ${endTime}`);
  console.log(`- Has expired? ${endTime < new Date()}`);
}

const bookedSlots = await Slot.find({ status: 'booked' });
console.log(`Found ${bookedSlots.length} slots with status 'booked':`);
for (const s of bookedSlots) {
  console.log(`- Slot: ${s.id} in Facility: ${s.facilityId}`);
}

process.exit(0);
