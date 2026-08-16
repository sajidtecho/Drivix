import Slot from '../models/Slot.js';
import Booking from '../models/Booking.js';
import ParkingFloor from '../models/ParkingFloor.js';
import ParkingLocation from '../models/ParkingLocation.js';
import Vehicle from '../models/Vehicle.js';
import jwt from 'jsonwebtoken';

// ----------------------------------------------------
// Global Configurable Weights
// ----------------------------------------------------
export const SLOT_ALLOCATION_WEIGHTS = {
  sameFloor: 30,
  walkingDistance: 25,
  sameZone: 15,
  vehicleCompatibility: 10,
  evRequirement: 10,
  accessibility: 5,
  exitElevator: 5
};

export const ASSIGNMENT_THRESHOLD_MINUTES = process.env.ASSIGNMENT_THRESHOLD_MINUTES 
  ? parseInt(process.env.ASSIGNMENT_THRESHOLD_MINUTES, 10) 
  : 30;

// ----------------------------------------------------
// Helper Functions
// ----------------------------------------------------
export const checkIfEVRequired = (booking, user, vehicle) => {
  if (booking.additionalServices && booking.additionalServices.includes('EV Charging')) {
    return true;
  }
  if (vehicle && vehicle.fuelType === 'EV') {
    return true;
  }
  if (user?.preferences?.evCharging) {
    return true;
  }
  return false;
};

export const checkIfAccessibilityRequired = (booking, user) => {
  if (user?.preferences?.parkingType === 'Disabled') {
    return true;
  }
  return false;
};

export const mapVehicleType = (typeStr) => {
  if (!typeStr) return 'Car';
  const lower = typeStr.toLowerCase();
  if (lower.includes('bike') || lower.includes('motorcycle') || lower.includes('scooter') || lower.includes('two-wheeler')) {
    return 'Bike';
  }
  return 'Car';
};

export const getSlotDistance = (slot, location) => {
  if (slot.latitude !== undefined && slot.longitude !== undefined && location.latitude !== undefined && location.longitude !== undefined) {
    const R = 6371; // Earth radius in km
    const dLat = (slot.latitude - location.latitude) * Math.PI / 180;
    const dLon = (slot.longitude - location.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(location.latitude * Math.PI / 180) * Math.cos(slot.latitude * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // distance in meters
  }
  if (slot.distance !== undefined) {
    return Number(slot.distance);
  }
  // Fallback: estimate from slotNumber or row/number
  const slotNum = parseInt(slot.slotNumber?.replace(/\D/g, '') || slot.number || '0', 10) || 0;
  return Math.max(5, slotNum * 5); // 5 meters per slot number
};

// ----------------------------------------------------
// Base Strategy Class for Future ML Compatibility
// ----------------------------------------------------
export class SlotScoringStrategy {
  scoreSlot(slot, booking, location, user, vehicle) {
    throw new Error('scoreSlot must be implemented');
  }
}

// ----------------------------------------------------
// Rule-Based Strategy Class
// ----------------------------------------------------
export class RuleBasedSlotScoringStrategy extends SlotScoringStrategy {
  constructor(customWeights = null) {
    super();
    this.weights = customWeights || SLOT_ALLOCATION_WEIGHTS;
  }

  scoreSlot(slot, booking, location, user, vehicle) {
    // 1. Same Floor Score
    const sameFloorScore = (String(slot.floorId) === String(booking.floorId)) ? 100 : 0;

    // 2. Walking Distance Score
    const distance = getSlotDistance(slot, location);
    const walkingDistanceScore = Math.max(0, 100 - distance);

    // 3. Same Parking Zone Score
    const preferredZone = booking.preferredZone || (user?.preferences?.zone);
    let sameZoneScore = 0;
    if (preferredZone) {
      sameZoneScore = (slot.row === preferredZone || slot.zone === preferredZone) ? 100 : 0;
    } else {
      if (slot.row === 'A') sameZoneScore = 100;
      else if (slot.row === 'B') sameZoneScore = 60;
      else if (slot.row === 'C') sameZoneScore = 30;
    }

    // 4. Vehicle Compatibility Score
    const vehicleCompatibilityScore = 100;

    // 5. EV Requirement Score
    const requiresEV = checkIfEVRequired(booking, user, vehicle);
    let evRequirementScore = 0;
    if (requiresEV) {
      evRequirementScore = slot.EVSupported ? 100 : 0;
    } else {
      evRequirementScore = slot.EVSupported ? 0 : 100; // Prefer standard slots for non-EV
    }

    // 6. Accessibility Score
    const requiresAccessibility = checkIfAccessibilityRequired(booking, user);
    let accessibilityScore = 0;
    if (requiresAccessibility) {
      accessibilityScore = slot.Accessibility ? 100 : 0;
    } else {
      accessibilityScore = slot.Accessibility ? 0 : 100; // Keep accessible slots free
    }

    // 7. Exit / Elevator Proximity Score
    let exitElevatorScore = 0;
    const hasDistExit = slot.distanceToExit !== undefined;
    const hasDistElev = slot.distanceToElevator !== undefined;
    if (hasDistExit || hasDistElev) {
      const distExit = hasDistExit ? Number(slot.distanceToExit) : (slot.NearExit ? 10 : 50);
      const distElev = hasDistElev ? Number(slot.distanceToElevator) : (slot.NearElevator ? 10 : 50);
      exitElevatorScore = Math.max(0, 100 - (distExit + distElev) / 2);
    } else {
      if (slot.NearExit && slot.NearElevator) exitElevatorScore = 100;
      else if (slot.NearExit || slot.NearElevator) exitElevatorScore = 50;
    }

    // Calculate total weighted score
    const totalScore = 
      (sameFloorScore * (this.weights.sameFloor / 100)) +
      (walkingDistanceScore * (this.weights.walkingDistance / 100)) +
      (sameZoneScore * (this.weights.sameZone / 100)) +
      (vehicleCompatibilityScore * (this.weights.vehicleCompatibility / 100)) +
      (evRequirementScore * (this.weights.evRequirement / 100)) +
      (accessibilityScore * (this.weights.accessibility / 100)) +
      (exitElevatorScore * (this.weights.exitElevator / 100));

    return {
      score: Math.round(totalScore),
      walkingDistance: Math.round(distance),
      sameZone: preferredZone ? (slot.row === preferredZone || slot.zone === preferredZone) : (slot.row === 'A'),
      vehicleCompatible: true,
      evCompatible: slot.EVSupported
    };
  }
}

// ----------------------------------------------------
// Main Slot Allocation Service
// ----------------------------------------------------
export class SlotAllocationService {
  static getWeights() {
    let weights = { ...SLOT_ALLOCATION_WEIGHTS };
    if (process.env.SLOT_ALLOCATION_WEIGHTS) {
      try {
        weights = JSON.parse(process.env.SLOT_ALLOCATION_WEIGHTS);
      } catch (err) {
        console.error('Failed to parse SLOT_ALLOCATION_WEIGHTS from environment:', err.message);
      }
    }
    return weights;
  }

  static async allocateSlot(bookingId) {
    // 1. Fetch booking details
    const booking = await Booking.findById(bookingId).populate('userId');
    if (!booking) {
      throw new Error('Booking not found');
    }

    // If slot is already assigned, return it directly
    if (booking.slotId) {
      const qrToken = this.generateToken(booking);
      return { booking, qrToken };
    }

    // 2. Fetch parent location
    const location = await ParkingLocation.findById(booking.locationId);
    if (!location) {
      throw new Error('Parking location not found');
    }

    const user = booking.userId;
    let vehicle = null;
    if (booking.vehicleId) {
      vehicle = await Vehicle.findById(booking.vehicleId);
    }

    const requiresEV = checkIfEVRequired(booking, user, vehicle);
    const requiresAccessibility = checkIfAccessibilityRequired(booking, user);

    let assignedSlot = null;
    let attempts = 0;

    // Concurrency Protection Loop (Optimistic Concurrency Lock)
    while (attempts < 5) {
      // Fetch current slots on the reserved floor
      const allSlotsOnFloor = await Slot.find({
        facilityId: booking.locationId,
        floorId: booking.floorId
      });

      // Filter slots by eligibility criteria
      const eligibleSlots = allSlotsOnFloor.filter(slot => {
        // A slot is excluded if not available
        if (slot.CurrentStatus !== 'Available' || slot.status !== 'available') return false;

        // Vehicle type compatibility
        const bookingVehicleType = vehicle ? (vehicle.type || vehicle.vehicleType || 'Car') : 'Car';
        const targetType = mapVehicleType(bookingVehicleType || booking.vehicleName);
        const slotType = slot.vehicleType || 'Car';
        if (slotType.toLowerCase() !== targetType.toLowerCase()) return false;

        // EV requirement
        if (requiresEV && !slot.EVSupported) return false;

        // Accessibility requirement
        if (requiresAccessibility && !slot.Accessibility) return false;

        return true;
      });

      if (eligibleSlots.length === 0) {
        if (requiresEV && allSlotsOnFloor.filter(s => s.EVSupported).length === 0) {
          throw new Error('No compatible EV parking slot is currently available.');
        }
        if (requiresAccessibility && allSlotsOnFloor.filter(s => s.Accessibility).length === 0) {
          throw new Error('No compatible accessible parking slot is currently available.');
        }
        throw new Error('No suitable parking slot is currently available.');
      }

      // Rank remaining slots
      const strategy = new RuleBasedSlotScoringStrategy(this.getWeights());
      const candidates = eligibleSlots.map(slot => {
        const result = strategy.scoreSlot(slot, booking, location, user, vehicle);
        return { slot, score: result.score };
      });

      // Sort slots by score descending
      candidates.sort((a, b) => b.score - a.score);
      const bestSlotCandidate = candidates[0].slot;

      // Try to lock the slot atomically
      const lockedSlot = await Slot.findOneAndUpdate(
        {
          _id: bestSlotCandidate._id,
          status: 'available',
          CurrentStatus: 'Available'
        },
        {
          $set: {
            status: 'booked',
            CurrentStatus: 'Reserved',
            reservedBy: user ? user._id : null
          }
        },
        { new: true }
      );

      if (lockedSlot) {
        assignedSlot = lockedSlot;
        break;
      }

      // If locking failed (concurrency race), increment attempt and retry
      attempts++;
    }

    if (!assignedSlot) {
      throw new Error('No suitable parking slot is currently available.');
    }

    // 5. Update Booking
    booking.slotId = assignedSlot.id;
    booking.slotRefId = assignedSlot._id;
    booking.assignedAt = new Date();
    booking.status = 'Slot Assigned';
    await booking.save();

    // Update floor capacities
    const { updateFloorCounters } = await import('../controllers/bookingController.js');
    await updateFloorCounters(booking.parkingHubId, booking.floorId);

    // Emit live socket updates
    const io = global.io;
    if (io) {
      io.emit('slotStatusUpdated', {
        facilityId: booking.locationId.toString(),
        id: assignedSlot.id,
        status: 'booked',
        reservationExpiresAt: null,
        reservedBy: user ? user._id.toString() : null
      });

      io.emit('bookingUpdated', {
        userId: user ? user._id.toString() : null,
        bookingId: booking.bookingId,
        slotId: assignedSlot.id,
        status: 'Slot Assigned'
      });
    }

    // Send Booking Notification
    const { sendBookingNotification } = await import('../utils/notificationService.js');
    await sendBookingNotification({
      userId: user ? user._id : null,
      title: 'Parking Slot Assigned',
      message: `Your parking slot has been assigned: Floor ${booking.floor}, Slot ${assignedSlot.id}.`,
      type: 'booking'
    });

    const qrToken = this.generateToken(booking);
    return { booking, qrToken };
  }

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
