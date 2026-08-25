import mongoose from 'mongoose';

const ParkingLocation = mongoose.model('ParkingLocation', new mongoose.Schema({}, { strict: false }));
const ParkingFloor = mongoose.model('ParkingFloor', new mongoose.Schema({}, { strict: false }));
const Slot = mongoose.model('Slot', new mongoose.Schema({}, { strict: false }));

const MONGO_URI = 'mongodb+srv://drivixmobility_db_user:X9lvJNDZ1RUknC4N@drivix.irkmtpg.mongodb.net/drivix';

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('📡 Connected.');

    const locations = await ParkingLocation.find({});
    for (const loc of locations) {
      console.log(`📍 Location: ${loc.parkingName} (${loc._id})`);
      const floors = await ParkingFloor.find({ parkingHubId: loc._id });
      console.log(`  Floors: ${floors.length}`);
      for (const f of floors) {
        const slotCount = await Slot.countDocuments({ floorId: f._id });
        const legacySlotCount = await Slot.countDocuments({ facilityId: loc._id, floor: f.floorName });
        console.log(`   - Floor ${f.floorName}: floorId slots: ${slotCount}, facilityId/floor slots: ${legacySlotCount}`);
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
