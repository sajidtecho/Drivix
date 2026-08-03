import Booking from '../models/Booking.js';
import Slot from '../models/Slot.js';
import ParkingLocation from '../models/ParkingLocation.js';
import ParkingFloor from '../models/ParkingFloor.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { calculateDynamicPrice } from '../utils/pricingEngine.js';
import { sendBookingNotification } from '../utils/notificationService.js';

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
    const resolvedLocationName = locationName || location.parkingName;

    // Resolve user details if missing
    const resolvedName = name || req.user.fullName || req.user.name || 'Drivix User';
    const resolvedMobile = mobile || req.user.mobile || '0000000000';

    // Resolve date and time
    const now = new Date();
    const resolvedEntryDate = entryDate || now.toISOString().split('T')[0];
    const resolvedEntryTime = entryTime || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. Resolve and Verify Floor Capacity
    let floorDoc = null;
    const searchFloor = floor || 'L1';
    
    // Find the floor document
    floorDoc = await ParkingFloor.findOne({
      parkingHubId: resolvedLocationId,
      $or: [
        { floorName: searchFloor },
        { _id: mongoose.Types.ObjectId.isValid(searchFloor) ? searchFloor : undefined }
      ]
    });

    if (!floorDoc) {
      // Fallback to first floor or create one
      floorDoc = await ParkingFloor.findOne({ parkingHubId: resolvedLocationId });
      if (!floorDoc) {
        floorDoc = await ParkingFloor.create({
          parkingHubId: resolvedLocationId,
          floorName: searchFloor,
          totalSlots: location.totalSlots || 50,
          availableSlots: location.availableSlots || 50
        });
      }
    }

    const resolvedFloor = floorDoc.floorName;
    const resolvedFloorId = floorDoc._id;

    // Capacity Validation Logic: Overlapping active bookings
    const reqStart = new Date(`${resolvedEntryDate}T${resolvedEntryTime}:00`);
    const reqEnd = new Date(reqStart.getTime() + Number(resolvedDuration) * 60 * 60 * 1000);

    const activeBookingsOnFloor = await Booking.find({
      parkingHubId: resolvedLocationId,
      floorId: resolvedFloorId,
      bookingDate: resolvedEntryDate,
      status: { $in: ['Confirmed', 'Slot Assigned', 'Checked In', 'booked'] }
    });

    let overlappingCount = 0;
    for (const b of activeBookingsOnFloor) {
      const bStart = new Date(`${b.bookingDate}T${b.startTime}:00`);
      const bEnd = new Date(bStart.getTime() + b.duration * 60 * 60 * 1000);
      if (bStart < reqEnd && bEnd > reqStart) {
        overlappingCount++;
      }
    }

    if (overlappingCount >= floorDoc.totalSlots) {
      return res.status(400).json({
        message: `Reservation rejected: Floor capacity is full for ${resolvedFloor} on ${resolvedEntryDate} at ${resolvedEntryTime}. (Total: ${floorDoc.totalSlots}, Reserved: ${overlappingCount})`
      });
    }

    // Resolve total cost
    let resolvedTotalCost = totalCost;
    if (resolvedTotalCost === undefined || resolvedTotalCost === null) {
      const recommendation = calculateDynamicPrice({
        basePrice: location.hourlyPrice,
        totalSlots: location.totalSlots,
        availableSlots: location.availableSlots
      });
      resolvedTotalCost = (recommendation.recommendedPrice * Number(resolvedDuration || 1)) + resolvedServicesCost;
    }

    // 2. Create the booking document linked to logged-in user
    const finalPaymentMode = resolvedPaymentMode;
    const isPayNow = finalPaymentMode === 'PAY_NOW';

    const booking = await Booking.create({
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
      duration: Number(resolvedDuration),
      totalCost: Number(resolvedTotalCost),
      paymentMode: finalPaymentMode,
      paymentStatus: isPayNow ? 'paid' : 'pending',
      prepaidAmount: isPayNow ? Number(resolvedTotalCost) : 0,
      finalCost: isPayNow ? Number(resolvedTotalCost) : 0,
      status: 'Confirmed',
      additionalServices: resolvedServices,
      servicesCost: resolvedServicesCost
    });

    // 3. Update floor and location capacities
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

    // 4. Send Email & SMS Notification
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

    const startDateTime = new Date(`${booking.bookingDate}T${booking.startTime}:00`);
    const newDuration = booking.duration + Number(additionalHours);
    const newEndDateTime = new Date(startDateTime.getTime() + newDuration * 60 * 60 * 1000);

    // Query active bookings (excluding the current booking itself!)
    const activeBookings = await Booking.find({
      _id: { $ne: booking._id },
      parkingHubId: booking.parkingHubId,
      floorId: booking.floorId,
      bookingDate: booking.bookingDate,
      status: { $in: ['Confirmed', 'Slot Assigned', 'Checked In', 'booked'] }
    });

    let overlappingCount = 0;
    for (const b of activeBookings) {
      const bStart = new Date(`${b.bookingDate}T${b.startTime}:00`);
      const bEnd = new Date(bStart.getTime() + b.duration * 60 * 60 * 1000);
      if (bStart < newEndDateTime && bEnd > startDateTime) {
        overlappingCount++;
      }
    }

    if (overlappingCount >= floorDoc.totalSlots) {
      return res.status(400).json({
        message: 'Cannot extend booking: Floor capacity is full for the extended duration.'
      });
    }

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

// @desc    Assign slot shortly before arrival (Phase 2 stub)
// @route   POST /api/v1/bookings/:id/assign-slot
// @access  Private
export const assignSlot = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    // Return mock success for Phase 1
    res.json({ 
      message: 'Slot assignment requested successfully (Phase 2 feature)', 
      booking 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm user arrival 30 mins before booking (Phase 2 stub)
// @route   POST /api/v1/bookings/:id/arrival-confirmation
// @access  Private
export const confirmArrival = async (req, res) => {
  try {
    const { action } = req.body; // 'yes', 'delay', 'cancel'
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (action === 'cancel') {
      booking.status = 'Cancelled';
      await booking.save();
      await updateFloorCounters(booking.parkingHubId, booking.floorId);
      return res.json({ message: 'Booking cancelled successfully', booking });
    }

    booking.arrivalConfirmed = true;
    await booking.save();

    res.json({ 
      message: `Arrival confirmation processed: ${action}`, 
      booking 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

