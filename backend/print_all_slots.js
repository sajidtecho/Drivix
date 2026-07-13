import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';
import Slot from './models/Slot.js';
import ParkingLocation from './models/ParkingLocation.js';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
console.log('Connecting...');
await mongoose.connect(MONGO_URI);

const locations = await ParkingLocation.find({});
console.log(`Found ${locations.length} facilities:`);
for (const loc of locations) {
  console.log(`- Facility: ${loc.parkingName} (_id: ${loc._id})`);
  const slots = await Slot.find({ facilityId: loc._id });
  console.log(`  Total slots: ${slots.length}`);
  const statusCounts = slots.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});
  console.log(`  Statuses:`, statusCounts);
  
  // Print any slots that are not available
  const activeSlots = slots.filter(s => s.status !== 'available');
  if (activeSlots.length > 0) {
    console.log(`  Non-available slots:`);
    for (const s of activeSlots) {
      console.log(`    * Slot ${s.id} (${s.floor}): status=${s.status}, reservedBy=${s.reservedBy}`);
    }
  }
}

process.exit(0);
