import Booking from '../models/Booking.js';
import Slot from '../models/Slot.js';
import ParkingLocation from '../models/ParkingLocation.js';
import ParkingFloor from '../models/ParkingFloor.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import mongoose from 'mongoose';
import { calculateDynamicPrice } from '../utils/pricingEngine.js';
import { sendBookingNotification } from '../utils/notificationService.js';
import { SlotAllocationService, checkIfEVRequired, checkIfAccessibilityRequired, getSlotDistance, RuleBasedSlotScoringStrategy, mapVehicleType } from '../services/SlotAllocationService.js';
import { invalidateFloorCache } from '../config/redis.js';

// Helper to keep floor capacity and parking location available counters synchronized
export const updateFloorCounters = async (parkingHubId, floorId) => {
  try {
    const floor = await ParkingFloor.findById(floorId);
    if (!floor) return;

    // Count all active bookings on this floor
    const activeBookings = await Booking.find({
      parkingHubId,
      floorId,
      status: { $in: ['Confirmed', 'Slot Assigned', 'Checked In', 'booked'] }
    });

    const occupiedSlots = activeBookings.filter(b => b.status === 'Checked In' || b.status === 'occupied').length;
    const reservedCapacity = activeBookings.filter(b => b.status === 'Confirmed' || b.status === 'booked' || b.status === 'Slot Assigned').length;
    const availableSlots = Math.max(0, floor.totalSlots - occupiedSlots - reservedCapacity);

    floor.occupiedSlots = occupiedSlots;
    floor.reservedCapacity = reservedCapacity;
    floor.availableSlots = availableSlots;
    await floor.save();

    // Invalidate Redis cache for this floor's availability calculations
    await invalidateFloorCache(floorId.toString());

    // Also update parent ParkingLocation available slots count for backward compatibility
    const location = await ParkingLocation.findById(parkingHubId);
    if (location) {
      const totalActiveBookings = await Booking.find({
        locationId: parkingHubId,
        status: { $in: ['Confirmed', 'Slot Assigned', 'Checked In', 'booked'] }
      });
      location.availableSlots = Math.max(0, location.totalSlots - totalActiveBookings.length);
      await location.save();
    }
  } catch (error) {
    console.error(`Error updating floor counters for floor ${floorId}:`, error);
  }
};


class LocalLockManager {
  constructor() {
    this.locks = new Map();
  }

  async acquire(key) {
    while (this.locks.get(key)) {
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    this.locks.set(key, true);
  }

  release(key) {
    this.locks.delete(key);
  }
}
const localLockManager = new LocalLockManager();

const getAdjacentDates = (dateStr) => {
  const date = new Date(`${dateStr}T00:00:00`);
  const prevDate = new Date(date.getTime() - 24 * 60 * 60 * 1000);
  const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  return [
    prevDate.toISOString().split('T')[0],
    dateStr,
    nextDate.toISOString().split('T')[0]
  ];
};

export const getOverlappingCount = async (locationId, floorId, date, startTime, duration, excludeBookingId = null, session = null) => {
  const reqStart = new Date(`${date}T${startTime}:00`);
  const reqEnd = new Date(reqStart.getTime() + Number(duration) * 60 * 60 * 1000);

  const datesToQuery = getAdjacentDates(date);
  
  const query = {
    parkingHubId: locationId,
    floorId: floorId,
    bookingDate: { $in: datesToQuery },
    status: { $in: ['Confirmed', 'Slot Assigned', 'Checked In', 'booked'] }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const activeBookings = session 
    ? await Booking.find(query).session(session)
    : await Booking.find(query);

  let overlappingCount = 0;
  for (const b of activeBookings) {
    const bStart = new Date(`${b.bookingDate}T${b.startTime}:00`);
    const bEnd = new Date(bStart.getTime() + b.duration * 60 * 60 * 1000);
    if (bStart < reqEnd && bEnd > reqStart) {
      overlappingCount++;
    }
  }

  return overlappingCount;
};


// @desc    Create a new booking ticket
// @route   POST /api/v1/bookings
// @access  Private
export const createBooking = async (req, res) => {
  const {
    bookingId,
    name,
    mobile,
    vehicleNumber,
    vehicleName,
    locationId,
    locationName,
    slotId,
    floor,
    entryDate,
    entryTime,
    duration,
    totalCost,
    paymentMode,

    // Fallbacks from React Native client
    facilityId,
    durationHours,
    vehicleModel,
    paymentOption,
    additionalServices
  } = req.body;

  try {
    const resolvedLocationId = locationId || facilityId;
    const resolvedDuration = duration !== undefined ? duration : durationHours;
    const resolvedVehicleNumber = vehicleNumber;
    const resolvedVehicleName = vehicleName || vehicleModel;
    const resolvedPaymentMode = paymentMode || paymentOption || 'PAY_AFTER_CHECKOUT';

    // Pricing mapping for additional services
    const SERVICE_PRICES = {
      'Rest Area': 150,
      'EV Charging': 250,
      'Car Wash': 300,
      'Food & Beverages': 200
    };

    let resolvedServicesCost = 0;
    const resolvedServices = additionalServices || [];
    if (Array.isArray(resolvedServices)) {
      resolvedServices.forEach(srv => {
        if (SERVICE_PRICES[srv]) {
          resolvedServicesCost += SERVICE_PRICES[srv];
        }
      });
    }

    const location = await ParkingLocation.findById(resolvedLocationId);
    if (!location) {
      return res.status(404).json({ message: 'Parking location not found' });
    }
    if (location.status !== 'Active') {
      return res.status(400).json({ message: 'Parking location is inactive' });
    }
    const resolvedLocationName = locationName || location.parkingName;

    // Resolve user details if missing
    const resolvedName = name || req.user.fullName || req.user.name || 'Drivix User';
    const resolvedMobile = mobile || req.user.mobile || '0000000000';

    // Resolve date and time
    const now = new Date();
    const resolvedEntryDate = entryDate || now.toISOString().split('T')[0];
    const resolvedEntryTime = entryTime || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // --- Validation Rules ---
    // 1. Past booking date
    const currentDateStr = now.toISOString().split('T')[0];
    if (resolvedEntryDate < currentDateStr) {
      return res.status(400).json({ message: 'Booking date cannot be in the past' });
    }

    // 2. Past start time
    if (resolvedEntryDate === currentDateStr) {
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const [reqHours, reqMinutes] = resolvedEntryTime.split(':').map(Number);
      if (reqHours < currentHours || (reqHours === currentHours && reqMinutes < currentMinutes)) {
        return res.status(400).json({ message: 'Booking start time cannot be in the past' });
      }
    }

    // 3. Invalid duration (duration > 0)
    const durationNum = Number(resolvedDuration);
    if (isNaN(durationNum) || durationNum <= 0) {
      return res.status(400).json({ message: 'Duration must be greater than 0' });
    }

    // 4. Configured maximum duration validation
    if (location.maxDuration && durationNum > location.maxDuration) {
      return res.status(400).json({ message: `Duration exceeds maximum allowed duration of ${location.maxDuration} hours` });
    }

    // 5. Invalid Vehicle if vehicleId is passed
    if (req.body.vehicleId) {
      const vehicle = await Vehicle.findById(req.body.vehicleId);
      if (!vehicle) {
        return res.status(400).json({ message: 'Invalid vehicle' });
      }
    }

    // 6. Invalid / Inactive floor
    let floorDoc = null;
    const searchFloor = floor || 'L1';
    
    floorDoc = await ParkingFloor.findOne({
      parkingHubId: resolvedLocationId,
      $or: [
        { floorName: searchFloor },
        { _id: mongoose.Types.ObjectId.isValid(searchFloor) ? searchFloor : undefined }
      ]
    });

    if (!floorDoc) {
      return res.status(400).json({ message: 'Invalid floor' });
    }

    if (floorDoc.active === false) {
      return res.status(400).json({ message: 'Floor is inactive' });
    }

    const resolvedFloor = floorDoc.floorName;
    const resolvedFloorId = floorDoc._id;

    // Resolve total cost
    let resolvedTotalCost = totalCost;
    if (resolvedTotalCost === undefined || resolvedTotalCost === null) {
      const recommendation = calculateDynamicPrice({
        basePrice: location.hourlyPrice,
        totalSlots: location.totalSlots,
        availableSlots: location.availableSlots
      });
      resolvedTotalCost = (recommendation.recommendedPrice * durationNum) + resolvedServicesCost;
    }

    const finalPaymentMode = resolvedPaymentMode;
    const isPayNow = finalPaymentMode === 'PAY_NOW';

    // Helper to create the booking document inside lock / transaction
    const executeBookingCreation = async (session = null) => {
      const overlappingCount = await getOverlappingCount(
        resolvedLocationId,
        resolvedFloorId,
        resolvedEntryDate,
        resolvedEntryTime,
        durationNum,
        null,
        session
      );

      if (overlappingCount >= floorDoc.totalSlots) {
        throw new Error('CAPACITY_FULL');
      }

      const bookingData = {
        bookingId: bookingId || `DRX-${Date.now().toString(36).toUpperCase()}`,
        userId: req.user._id,
        name: resolvedName,
        mobile: resolvedMobile,
        vehicleNumber: resolvedVehicleNumber,
        vehicleName: resolvedVehicleName,
        parkingHubId: resolvedLocationId,
        floorId: resolvedFloorId,
        bookingDate: resolvedEntryDate,
        startTime: resolvedEntryTime,
        vehicleId: req.body.vehicleId || null,

        locationId: resolvedLocationId,
        locationName: resolvedLocationName,
        slotId: null, // Slot remains null until arrival/assignment
        floor: resolvedFloor,
        entryDate: resolvedEntryDate,
        entryTime: resolvedEntryTime,
        duration: durationNum,
        totalCost: Number(resolvedTotalCost),
        paymentMode: finalPaymentMode,
        paymentStatus: isPayNow ? 'paid' : 'pending',
        prepaidAmount: isPayNow ? Number(resolvedTotalCost) : 0,
        finalCost: isPayNow ? Number(resolvedTotalCost) : 0,
        status: 'Confirmed',
        additionalServices: resolvedServices,
        servicesCost: resolvedServicesCost
      };

      const [newBooking] = await Booking.create([bookingData], { session });
      return newBooking;
    };

    let booking;
    const lockKey = `${resolvedLocationId}_${resolvedFloorId}`;

    // Attempt Mongoose Transaction
    let session = null;
    let transactionSuccess = false;
    try {
      session = await mongoose.startSession();
      await session.withTransaction(async () => {
        booking = await executeBookingCreation(session);
      });
      transactionSuccess = true;
    } catch (err) {
      if (err.message === 'CAPACITY_FULL') {
        return res.status(400).json({
          message: `Reservation rejected: Floor capacity is full for ${resolvedFloor} on ${resolvedEntryDate} at ${resolvedEntryTime}.`
        });
      }
      console.warn('⚠️ Mongoose transaction failed, falling back to local queue lock:', err.message);
    } finally {
      if (session) {
        session.endSession();
      }
    }

    // Fallback: local lock if transaction failed or wasn't supported
    if (!transactionSuccess && !booking) {
      try {
        await localLockManager.acquire(lockKey);
        booking = await executeBookingCreation(null);
      } catch (err) {
        if (err.message === 'CAPACITY_FULL') {
          return res.status(400).json({
            message: `Reservation rejected: Floor capacity is full for ${resolvedFloor} on ${resolvedEntryDate} at ${resolvedEntryTime}.`
          });
        }
        return res.status(500).json({ message: err.message });
      } finally {
        localLockManager.release(lockKey);
      }
    }

    // Update floor and location capacities
    await updateFloorCounters(resolvedLocationId, resolvedFloorId);

    // Emit Socket.io update to all connected clients
    const io = req.app.get('socketio');
    if (io) {
      io.emit('floorCapacityUpdated', {
        parkingHubId: resolvedLocationId.toString(),
        floorId: resolvedFloorId.toString(),
        floorName: resolvedFloor
      });
    }

    // Send Email & SMS Notification
    await sendBookingNotification({
      userId: req.user._id,
      title: 'Booking Confirmed',
      message: `Your floor reservation at ${resolvedLocationName}, Floor ${resolvedFloor} is confirmed. A slot will be assigned shortly before arrival.`,
      type: 'booking'
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get bookings of the logged-in user
// @route   GET /api/v1/bookings/my
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id }).populate('locationId').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bookings (Admin only)
// @route   GET /api/v1/bookings/all
// @access  Private/Admin
export const getAllBookings = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized as an admin' });
  }

  try {
    const bookings = await Booking.find({}).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Calculate bill details on checkout
// @route   GET /api/v1/bookings/:id/calculate-bill
// @access  Private
export const calculateBill = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const location = await ParkingLocation.findById(booking.locationId);
    const hourlyRate = location ? location.hourlyPrice : 30;

    // Calculate actual duration in hours (min 1 hour)
    const startTime = booking.createdAt || booking.actualEntryTime || new Date();
    const msElapsed = Date.now() - startTime.getTime();
    const hoursParked = Math.max(1, Math.ceil(msElapsed / (1000 * 60 * 60)));

    const finalCost = (hoursParked * hourlyRate) + (booking.servicesCost || 0);
    const prepaidAmount = booking.prepaidAmount || 0;
    const amountDue = Math.max(0, finalCost - prepaidAmount);

    // Fetch user wallet balance
    const userDoc = await User.findById(req.user._id);
    const walletBalance = userDoc ? userDoc.walletBalance : 0;

    res.json({
      bookingId: booking._id,
      entryTime: booking.createdAt,
      exitTime: new Date(),
      hoursParked,
      hourlyRate,
      servicesCost: booking.servicesCost || 0,
      finalCost,
      prepaidAmount,
      amountDue,
      paymentMode: booking.paymentMode,
      paymentStatus: booking.paymentStatus,
      walletBalance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Vacate/release a booking slot
// @route   PUT /api/v1/bookings/:id/vacate
// @access  Private
export const vacateBooking = async (req, res) => {
  const { paymentMethod } = req.body; // 'wallet' or 'cash' or 'card'

  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify ownership (unless admin)
    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status === 'Checked Out' || booking.status === 'completed') {
      return res.status(400).json({ message: 'Booking is already completed' });
    }

    // 1. Calculate final cost
    const location = await ParkingLocation.findById(booking.locationId);
    const hourlyRate = location ? location.hourlyPrice : 30;

    const startTime = booking.createdAt || booking.actualEntryTime || new Date();
    const msElapsed = Date.now() - startTime.getTime();
    const hoursParked = Math.max(1, Math.ceil(msElapsed / (1000 * 60 * 60)));

    const finalCost = (hoursParked * hourlyRate) + (booking.servicesCost || 0);
    const prepaidAmount = booking.prepaidAmount || 0;
    const amountDue = Math.max(0, finalCost - prepaidAmount);

    // 2. Enforce payment if amountDue > 0
    if (amountDue > 0) {
      if (!paymentMethod) {
        return res.status(400).json({ 
          message: 'Payment required to check out', 
          amountDue,
          requiresPaymentOptions: true 
        });
      }

      if (paymentMethod === 'wallet') {
        const userDoc = await User.findById(req.user._id);
        if (!userDoc || userDoc.walletBalance < amountDue) {
          return res.status(400).json({ message: 'Insufficient wallet balance' });
        }
        userDoc.walletBalance -= amountDue;
        await userDoc.save();
      } else if (paymentMethod === 'cash' || paymentMethod === 'card' || paymentMethod === 'online') {
        // Simulate gate/online checkout payment success
      } else {
        return res.status(400).json({ message: 'Invalid payment method' });
      }
    }

    // 3. Update booking status
    booking.finalCost = finalCost;
    booking.actualExitTime = new Date();
    booking.paymentStatus = 'paid';
    booking.status = 'Checked Out';
    await booking.save();

    // 4. Mark the slot as available again if slot was assigned
    if (booking.slotId) {
      const slot = await Slot.findOne({ facilityId: booking.locationId, id: booking.slotId });
      if (slot) {
        slot.status = 'available';
        slot.CurrentStatus = 'Available';
        await slot.save();

        // Emit Socket.io update to all connected clients!
        const io = req.app.get('socketio');
        if (io) {
          io.emit('slotStatusUpdated', {
            facilityId: booking.locationId.toString(),
            id: booking.slotId,
            status: 'available',
            reservationExpiresAt: null
          });
        }
      }
    }

    // 5. Update floor counters (which automatically updates parent availableSlots)
    await updateFloorCounters(booking.parkingHubId, booking.floorId);

    // 6. Send Email & SMS Notification
    await sendBookingNotification({
      userId: req.user._id,
      title: 'Checkout Completed',
      message: `Successfully checked out of ${location ? location.parkingName : 'parking hub'}.${booking.slotId ? ` Slot ${booking.slotId} is now vacated.` : ''}`,
      type: 'payment'
    });

    res.json({ message: 'Checked out and slot vacated successfully', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Extend booking duration
// @route   PUT /api/v1/bookings/:id/extend
// @access  Private
export const extendBooking = async (req, res) => {
  const { additionalHours, additionalCost } = req.body;

  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify ownership
    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // 1. Check floor capacity for extended duration
    const floorDoc = await ParkingFloor.findById(booking.floorId);
    if (!floorDoc) {
      return res.status(404).json({ message: 'Floor not found' });
    }

    const newDuration = booking.duration + Number(additionalHours);
    const overlappingCount = await getOverlappingCount(booking.parkingHubId, booking.floorId, booking.bookingDate, booking.startTime, newDuration, booking._id);

    if (overlappingCount >= floorDoc.totalSlots) {
      return res.status(400).json({
        message: 'Cannot extend booking: Floor capacity is full for the extended duration.'
      });
    }

    const startDateTime = new Date(`${booking.bookingDate}T${booking.startTime}:00`);
    const newEndDateTime = new Date(startDateTime.getTime() + newDuration * 60 * 60 * 1000);

    // 2. Update booking details
    booking.duration = newDuration;
    booking.totalCost += Number(additionalCost || 0);

    // Recalculate endTime string
    const hours = String(newEndDateTime.getHours()).padStart(2, '0');
    const minutes = String(newEndDateTime.getMinutes()).padStart(2, '0');
    booking.endTime = `${hours}:${minutes}`;

    await booking.save();
    await updateFloorCounters(booking.parkingHubId, booking.floorId);

    res.json({ message: 'Booking extended successfully', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a specific booking (Admin only)
// @route   DELETE /api/v1/bookings/admin/:id
// @access  Private/Admin
export const deleteBookingAdmin = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Mark the associated slot as available again
    const slot = await Slot.findOne({ facilityId: booking.locationId, id: booking.slotId });
    if (slot) {
      slot.status = 'available';
      slot.CurrentStatus = 'Available';
      await slot.save();

      // Emit Socket.io update to all connected clients!
      const io = req.app.get('socketio');
      if (io) {
        io.emit('slotStatusUpdated', {
          facilityId: booking.locationId.toString(),
          id: booking.slotId,
          status: 'available',
          reservationExpiresAt: null,
          reservedBy: null
        });
      }
    }

    // Increment available slots on the parent location
    await ParkingLocation.findByIdAndUpdate(booking.locationId, {
      $inc: { availableSlots: 1 }
    });

    // Delete booking from database
    await Booking.findByIdAndDelete(req.params.id);

    // Notify user via Socket.IO that their booking was removed by admin
    const io = req.app.get('socketio');
    if (io) {
      io.emit('bookingRemoved', {
        userId: booking.userId.toString(),
        bookingId: booking.bookingId,
        message: 'Your booking has been removed by the admin.'
      });
    }

    // Send Email & SMS Notification
    await sendBookingNotification({
      userId: booking.userId,
      title: 'Booking Cancelled',
      message: `Your booking ${booking.bookingId} has been cancelled by the admin.`,
      type: 'booking'
    });

    res.json({ message: 'Booking removed successfully by Admin' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete all bookings (Admin only)
// @route   DELETE /api/v1/bookings/admin/all
// @access  Private/Admin
export const deleteAllBookingsAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find({});
    
    // For each booking, reset its slot status
    for (const booking of bookings) {
      const slot = await Slot.findOne({ facilityId: booking.locationId, id: booking.slotId });
      if (slot) {
        slot.status = 'available';
        slot.CurrentStatus = 'Available';
        await slot.save();

        const io = req.app.get('socketio');
        if (io) {
          io.emit('slotStatusUpdated', {
            facilityId: booking.locationId.toString(),
            id: booking.slotId,
            status: 'available',
            reservationExpiresAt: null,
            reservedBy: null
          });
        }
      }

      // Restore availableSlots on parent facility
      await ParkingLocation.findByIdAndUpdate(booking.locationId, {
        $inc: { availableSlots: 1 }
      });
    }

    // Delete all bookings from database
    await Booking.deleteMany({});

    // Notify all affected users via Socket.IO and send Email/SMS notifications
    const io = req.app.get('socketio');
    for (const booking of bookings) {
      if (io) {
        io.emit('bookingRemoved', {
          userId: booking.userId.toString(),
          bookingId: booking.bookingId,
          message: 'Your booking has been removed by the admin.'
        });
      }

      await sendBookingNotification({
        userId: booking.userId,
        title: 'Booking Cancelled',
        message: `Your booking ${booking.bookingId} has been cancelled by the admin.`,
        type: 'booking'
      });
    }

    res.json({ message: 'All bookings removed successfully by Admin' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign slot shortly before arrival
// @route   POST /api/v1/bookings/:id/assign-slot
// @access  Private
export const assignSlot = async (req, res) => {
  const targetId = req.params.id || req.body.bookingId || req.body.id;
  try {
    const result = await SlotAllocationService.allocateSlot(targetId);
    res.json({
      success: true,
      bookingId: result.booking.bookingId,
      slotId: result.booking.slotRefId,
      slotNumber: result.booking.slotId,
      floorName: result.booking.floor,
      status: 'SLOT_ASSIGNED',
      assignedAt: result.booking.assignedAt,
      booking: result.booking,
      qrToken: result.qrToken
    });
  } catch (error) {
    if (error.message.includes('No suitable') || error.message.includes('No compatible')) {
      return res.json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get slot recommendations (admin/preview debug API)
// @route   GET /api/v1/bookings/:bookingId/slot-recommendations
// @access  Private
export const getSlotRecommendations = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate('userId');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const location = await ParkingLocation.findById(booking.locationId);
    if (!location) {
      return res.status(404).json({ message: 'Parking location not found' });
    }

    const user = booking.userId;
    let vehicle = null;
    if (booking.vehicleId) {
      vehicle = await Vehicle.findById(booking.vehicleId);
    }

    const allSlotsOnFloor = await Slot.find({
      facilityId: booking.locationId,
      floorId: booking.floorId
    });

    const eligibleSlots = allSlotsOnFloor.filter(slot => {
      if (slot.CurrentStatus !== 'Available' || slot.status !== 'available') return false;
      
      const bookingVehicleType = vehicle ? (vehicle.type || vehicle.vehicleType || 'Car') : 'Car';
      const targetType = mapVehicleType(bookingVehicleType || booking.vehicleName);
      const slotType = slot.vehicleType || 'Car';
      if (slotType.toLowerCase() !== targetType.toLowerCase()) return false;

      const requiresEV = checkIfEVRequired(booking, user, vehicle);
      if (requiresEV && !slot.EVSupported) return false;

      const requiresAccessibility = checkIfAccessibilityRequired(booking, user);
      if (requiresAccessibility && !slot.Accessibility) return false;

      return true;
    });

    const strategy = new RuleBasedSlotScoringStrategy();
    const recommendations = eligibleSlots.map(slot => {
      const result = strategy.scoreSlot(slot, booking, location, user, vehicle);
      const distance = getSlotDistance(slot, location);
      return {
        slotNumber: slot.id || slot.slotNumber,
        score: result.score,
        walkingDistance: Math.round(distance),
        sameZone: result.sameZone,
        vehicleCompatible: result.vehicleCompatible,
        evCompatible: result.evCompatible
      };
    });

    recommendations.sort((a, b) => b.score - a.score);

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm user arrival 30 mins before booking
// @route   POST /api/v1/bookings/:id/arrival-confirmation
// @access  Private
export const confirmArrival = async (req, res) => {
  const targetId = req.params.id || req.body.bookingId || req.body.id;
  const { action } = req.body; // 'yes', 'delay', 'cancel'

  try {
    const booking = await Booking.findById(targetId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (action === 'cancel') {
      booking.status = 'Cancelled';
      if (booking.slotId) {
        const slot = await Slot.findOne({ facilityId: booking.locationId, id: booking.slotId });
        if (slot) {
          slot.status = 'available';
          slot.CurrentStatus = 'Available';
          slot.reservedBy = null;
          await slot.save();
        }
      }
      booking.slotId = null;
      booking.slotRefId = null;
      await booking.save();
      await updateFloorCounters(booking.parkingHubId, booking.floorId);
      
      return res.json({ message: 'Booking cancelled and capacity released successfully', booking });
    }

    if (action === 'delay') {
      // Delay booking start time by 30 minutes
      const [hours, minutes] = booking.startTime.split(':').map(Number);
      let newMinutes = minutes + 30;
      let newHours = hours;
      if (newMinutes >= 60) {
        newMinutes -= 60;
        newHours += 1;
      }
      if (newHours >= 24) {
        newHours -= 24; // wraps around midnight
      }
      const newStartTimeStr = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;

      // Check if there is floor capacity for the new time window
      const floorDoc = await ParkingFloor.findById(booking.floorId);
      if (!floorDoc) {
        return res.status(404).json({ message: 'Floor not found' });
      }

      const overlappingCount = await getOverlappingCount(booking.parkingHubId, booking.floorId, booking.bookingDate, newStartTimeStr, booking.duration, booking._id);

      if (overlappingCount >= floorDoc.totalSlots) {
        return res.status(400).json({
          message: 'Cannot delay booking: Floor capacity is full for the delayed duration.'
        });
      }

      const reqStart = new Date(`${booking.bookingDate}T${newStartTimeStr}:00`);
      const reqEnd = new Date(reqStart.getTime() + booking.duration * 60 * 60 * 1000);

      booking.startTime = newStartTimeStr;
      
      // Recalculate endTime string
      const endHours = String(reqEnd.getHours()).padStart(2, '0');
      const endMinutes = String(reqEnd.getMinutes()).padStart(2, '0');
      booking.endTime = `${endHours}:${endMinutes}`;

      booking.arrivalConfirmed = false; // Prompt again later
      await booking.save();
      await updateFloorCounters(booking.parkingHubId, booking.floorId);

      return res.json({ message: 'Booking time postponed successfully by 30 minutes', booking });
    }

    if (action === 'yes') {
      booking.arrivalConfirmed = true;
      await booking.save();

      // Allocate slot immediately
      const result = await SlotAllocationService.allocateSlot(booking._id);
      return res.json({
        message: 'Arrival confirmed and slot allocated successfully',
        ...result
      });
    }

    res.status(400).json({ message: 'Invalid action parameter' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


