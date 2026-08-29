import ParkingLocation from '../models/ParkingLocation.js';
import ParkingFloor from '../models/ParkingFloor.js';
import Slot from '../models/Slot.js';
import Booking from '../models/Booking.js';

export const runDatabaseMigration = async () => {
  try {
    console.log('🔄 Starting Drivix Database Migration for Floors and Slots...');

    const locations = await ParkingLocation.find({});
    console.log(`📍 Found ${locations.length} parking locations to process.`);

    for (const location of locations) {
      const floors = location.floors && location.floors.length > 0 ? location.floors : ['L1'];

      for (const floorName of floors) {
        // 1. Check if the floor document exists
        let floorDoc = await ParkingFloor.findOne({
          parkingHubId: location._id,
          floorName: floorName
        });

        // 2. Count slots on this floor to compute capacity
        const slotsCount = await Slot.countDocuments({
          facilityId: location._id,
          floor: floorName
        });

        const occupiedCount = await Slot.countDocuments({
          facilityId: location._id,
          floor: floorName,
          status: 'occupied'
        });

        const reservedCount = await Slot.countDocuments({
          facilityId: location._id,
          floor: floorName,
          status: { $in: ['booked', 'temporarily_reserved'] }
        });

        const availableCount = slotsCount - occupiedCount - reservedCount;

        if (!floorDoc) {
          console.log(`➕ Creating floor '${floorName}' for hub '${location.parkingName}' (Slots: ${slotsCount})`);
          floorDoc = await ParkingFloor.create({
            parkingHubId: location._id,
            floorName: floorName,
            totalSlots: slotsCount,
            availableSlots: Math.max(0, availableCount),
            occupiedSlots: occupiedCount,
            reservedCapacity: reservedCount
          });
        } else {
          // Update floor details/capacities to sync with slots
          floorDoc.totalSlots = slotsCount;
          floorDoc.occupiedSlots = occupiedCount;
          floorDoc.reservedCapacity = reservedCount;
          floorDoc.availableSlots = Math.max(0, availableCount);
          await floorDoc.save();
        }

        // 3. Update all slot documents for this floor to link to floorId if they don't have it
        await Slot.updateMany(
          {
            facilityId: location._id,
            floor: floorName,
            $or: [
              { floorId: { $exists: false } },
              { floorId: null }
            ]
          },
          {
            $set: {
              floorId: floorDoc._id,
              CurrentStatus: 'Available'
            }
          }
        );
      }
    }

    // A generic query to update all slotIds and CurrentStatus values to ensure consistency
    const unlinkedSlots = await Slot.find({ $or: [{ floorId: { $exists: false } }, { floorId: null }] });
    if (unlinkedSlots.length > 0) {
      console.log(`⚠️ Found ${unlinkedSlots.length} slots without floorId. Attempting to resolve...`);
      for (const slot of unlinkedSlots) {
        let floorDoc = await ParkingFloor.findOne({
          parkingHubId: slot.facilityId,
          floorName: slot.floor
        });
        if (!floorDoc) {
          floorDoc = await ParkingFloor.create({
            parkingHubId: slot.facilityId,
            floorName: slot.floor,
            totalSlots: 1,
            availableSlots: 1
          });
        }
        slot.floorId = floorDoc._id;
        await slot.save();
      }
    }

    // Perform one-time bulk sync of slotId = id and CurrentStatus = mapped status
    const allSlots = await Slot.find({});
    for (const slot of allSlots) {
      let modified = false;
      if (!slot.slotId || slot.slotId !== slot.id) {
        slot.slotId = slot.id;
        modified = true;
      }
      if (!slot.CurrentStatus) {
        if (slot.status === 'available') slot.CurrentStatus = 'Available';
        else if (slot.status === 'booked' || slot.status === 'temporarily_reserved') slot.CurrentStatus = 'Reserved';
        else if (slot.status === 'occupied') slot.CurrentStatus = 'Occupied';
        else if (slot.status === 'maintenance') slot.CurrentStatus = 'Maintenance';
        modified = true;
      }
      if (modified) {
        await slot.save();
      }
    }

    // 4. Update all booking documents to link to floorId if they don't have it
    const unlinkedBookings = await Booking.find({
      $or: [
        { floorId: { $exists: false } },
        { floorId: null }
      ]
    });

    if (unlinkedBookings.length > 0) {
      console.log(`⚠️ Found ${unlinkedBookings.length} bookings without floorId. Attempting to resolve...`);
      for (const booking of unlinkedBookings) {
        const hubId = booking.locationId || booking.parkingHubId;
        const floorName = booking.floor || 'L1';

        if (!hubId) {
          console.warn(`Cannot resolve floorId for booking ${booking.bookingId} because locationId/parkingHubId is missing.`);
          continue;
        }

        let floorDoc = await ParkingFloor.findOne({
          parkingHubId: hubId,
          floorName: floorName
        });

        if (!floorDoc) {
          floorDoc = await ParkingFloor.findOne({ parkingHubId: hubId });
          if (!floorDoc) {
            console.log(`➕ Creating missing floor '${floorName}' for hub '${hubId}' during booking migration.`);
            floorDoc = await ParkingFloor.create({
              parkingHubId: hubId,
              floorName: floorName,
              totalSlots: 1,
              availableSlots: 1
            });
          }
        }

        await Booking.updateOne(
          { _id: booking._id },
          { 
            $set: { 
              floorId: floorDoc._id,
              parkingHubId: hubId
            } 
          }
        );
        console.log(`✅ Successfully updated booking ${booking.bookingId} with floorId.`);
      }
    }

    console.log('✅ Drivix Database Migration completed successfully.');
  } catch (error) {
    console.error('❌ Error during Drivix Database Migration:', error);
  }
};
