import Slot from '../models/Slot.js';
import Booking from '../models/Booking.js';
import ParkingFloor from '../models/ParkingFloor.js';
import Vehicle from '../models/Vehicle.js';
import jwt from 'jsonwebtoken';
import { updateFloorCounters } from '../controllers/bookingController.js';

export class SlotAllocationService {
  /**
   * Automatically allocates and assigns the best available slot on the reserved floor for a booking.
   * @param {string} bookingId - The database _id of the booking
   * @returns {Object} Booking and its encrypted QR token
   */
  static async allocateSlot(bookingId) {
    // 1. Fetch booking details
    const booking = await Booking.findById(bookingId).populate('userId');
    if (!booking) {
      throw new Error('Booking not found');
    }

    // If slot is already assigned, return it directly
    if (booking.slotId) {
      // Regenerate token and return
      const qrToken = this.generateToken(booking);
      return { booking, qrToken };
    }

    // 2. Fetch available slots on the reserved floor
    const allSlotsOnFloor = await Slot.find({
      facilityId: booking.locationId,
      floorId: booking.floorId
    });

    // 3. Remove occupied, reserved, or maintenance slots
    const availableSlots = allSlotsOnFloor.filter(
      slot => slot.CurrentStatus === 'Available' && slot.status === 'available'
    );

    if (availableSlots.length === 0) {
      throw new Error('No available slots on the reserved floor');
    }

    // Determine user preferences/requirements
    let requiresEV = booking.additionalServices.includes('EV Charging');
    let requiresAccessibility = false;

    // Check primary vehicle type/fuel
    if (booking.vehicleId) {
      const vehicle = await Vehicle.findById(booking.vehicleId);
      if (vehicle && vehicle.fuelType === 'EV') {
        requiresEV = true;
      }
    }

    // Check user preferences
    if (booking.userId) {
      const user = booking.userId;
      if (user.preferences) {
        if (user.preferences.evCharging) {
          requiresEV = true;
        }
        if (user.preferences.parkingType === 'Disabled') {
          requiresAccessibility = true;
        }
      }
    }

    // 4. Rank remaining slots using a weighted rule-based ranking
    const rankedSlots = availableSlots.map(slot => {
      let score = 0;

      // Priority 1: Same Floor (Guaranteed by querying floorId)

      // Priority 2: EV Charger requirement
      if (requiresEV) {
        if (slot.EVSupported) {
          score += 1000;
        } else {
          score -= 500; // Penalize non-EV slots heavily
        }
      } else {
        if (slot.EVSupported) {
          score -= 200; // Prefer standard slots for non-EV cars
        }
      }

      // Priority 3: Accessibility requirement
      if (requiresAccessibility) {
        if (slot.Accessibility) {
          score += 1000;
        } else {
          score -= 500;
        }
      } else {
        if (slot.Accessibility) {
          score -= 200; // Keep disabled slots free
        }
      }

      // Priority 4: Near Elevator
      if (slot.NearElevator) {
        score += 200;
      }

      // Priority 5: Near Exit
      if (slot.NearExit) {
        score += 150;
      }

      // Priority 6: Walking Distance
      // Parse slot number (smaller slot numbers are closer to main entrance)
      const slotNum = parseInt(slot.slotNumber.replace(/\D/g, ''), 10) || 0;
      score += Math.max(0, 100 - slotNum);

      // Priority 7: Same Parking Zone / Row
      if (slot.row === 'A') score += 50;
      else if (slot.row === 'B') score += 30;
      else if (slot.row === 'C') score += 10;

      // Priority 8: Least Congested Area
      // Count other slots in the same row that are NOT available
      const rowSlots = allSlotsOnFloor.filter(s => s.row === slot.row);
      const busySlotsCount = rowSlots.filter(s => s.CurrentStatus !== 'Available').length;
      score -= (busySlotsCount * 15); // Subtract score for busy rows

      return { slot, score };
    });

    // Sort slots by score descending
    rankedSlots.sort((a, b) => b.score - a.score);
    const bestSlot = rankedSlots[0].slot;

    // 5. Update Booking
    booking.slotId = bestSlot.id;
    booking.slotRefId = bestSlot._id;
    booking.assignedAt = new Date();
    booking.status = 'Slot Assigned';
    await booking.save();

    // 6. Update Slot status to Reserved
    bestSlot.CurrentStatus = 'Reserved';
    bestSlot.status = 'booked';
    bestSlot.reservedBy = booking.userId ? booking.userId._id : null;
    await bestSlot.save();

    // Update capacity counters
    await updateFloorCounters(booking.parkingHubId, booking.floorId);

    // Emit live updates using global socket server
    const io = global.io;
    if (io) {
      io.emit('slotStatusUpdated', {
        facilityId: booking.locationId.toString(),
        id: bestSlot.id,
        status: 'booked',
        reservationExpiresAt: null,
        reservedBy: booking.userId ? booking.userId._id.toString() : null
      });

      io.emit('bookingUpdated', {
        userId: booking.userId ? booking.userId._id.toString() : null,
        bookingId: booking.bookingId,
        slotId: bestSlot.id,
        status: 'Slot Assigned'
      });
    }

    // 7. Generate Encrypted Token for QR
    const qrToken = this.generateToken(booking);

    return { booking, qrToken };
  }

  /**
   * Helper to generate secure QR entry pass JWT token
   */
  static generateToken(booking) {
    const startDateTime = new Date(`${booking.bookingDate}T${booking.startTime}:00`);
    const expiryTime = new Date(startDateTime.getTime() + booking.duration * 60 * 60 * 1000);
    
    return jwt.sign(
      {
        bookingId: booking.bookingId,
        slotId: booking.slotId,
        entryTime: booking.startTime,
        expiryTime: expiryTime.toISOString()
      },
      process.env.JWT_SECRET || 'drivix_jwt_secure_secret_key_123!'
    );
  }
}
