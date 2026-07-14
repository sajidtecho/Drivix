import Booking from '../models/Booking.js';
import Slot from '../models/Slot.js';
import ParkingLocation from '../models/ParkingLocation.js';
import { calculateDynamicPrice } from '../utils/pricingEngine.js';

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
    const resolvedSlotId = slotId;
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

    // 1. Verify Slot is available (or reserved by the current user)
    const slot = await Slot.findOne({ facilityId: resolvedLocationId, id: resolvedSlotId });
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    const now = new Date();
    const isReservedByMe = slot.status === 'temporarily_reserved' &&
                           slot.reservedBy &&
                           slot.reservedBy.toString() === req.user._id.toString() &&
                           slot.reservationExpiresAt > now;

    if (slot.status !== 'available' && !isReservedByMe) {
      return res.status(400).json({ message: 'This slot is currently occupied or reserved by another user.' });
    }

    // Resolve details from Slot and Location if missing (common in mobile app requests)
    const resolvedFloor = floor || slot.floor;
    const location = await ParkingLocation.findById(resolvedLocationId);
    if (!location) {
      return res.status(404).json({ message: 'Parking location not found' });
    }
    const resolvedLocationName = locationName || location.parkingName;

    // Resolve user details if missing
    const resolvedName = name || req.user.fullName || req.user.name || 'Drivix User';
    const resolvedMobile = mobile || req.user.mobile || '0000000000';

    // Resolve date and time
    const resolvedEntryDate = entryDate || now.toISOString().split('T')[0];
    const resolvedEntryTime = entryTime || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

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
      locationId: resolvedLocationId,
      locationName: resolvedLocationName,
      slotId: resolvedSlotId,
      floor: resolvedFloor,
      entryDate: resolvedEntryDate,
      entryTime: resolvedEntryTime,
      duration: Number(resolvedDuration),
      totalCost: Number(resolvedTotalCost),
      paymentMode: finalPaymentMode,
      paymentStatus: isPayNow ? 'paid' : 'pending',
      prepaidAmount: isPayNow ? Number(resolvedTotalCost) : 0,
      finalCost: isPayNow ? Number(resolvedTotalCost) : 0,
      status: 'booked',
      additionalServices: resolvedServices,
      servicesCost: resolvedServicesCost
    });

    // 3. Mark the slot as booked and clear reservation details
    slot.status = 'booked';
    slot.reservedBy = null;
    slot.reservationExpiresAt = null;
    await slot.save();

    // Emit Socket.io update to all connected clients!
    const io = req.app.get('socketio');
    if (io) {
      io.emit('slotStatusUpdated', {
        facilityId: resolvedLocationId.toString(),
        id: resolvedSlotId,
        status: 'booked',
        reservationExpiresAt: null,
        reservedBy: null
      });
    }

    // 4. Decrement available slots on the parent location
    await ParkingLocation.findByIdAndUpdate(resolvedLocationId, {
      $inc: { availableSlots: -1 }
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
    const bookings = await Booking.find({ userId: req.user._id }).sort({ createdAt: -1 });
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

// @desc    Vacate/release a booking slot
// @route   PUT /api/v1/bookings/:id/vacate
// @access  Private
export const vacateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify ownership (unless admin)
    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Booking is already completed' });
    }

    // 1. Update booking status
    booking.status = 'completed';
    await booking.save();

    // 2. Mark the slot as available again
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

    // 3. Increment available slots on the parent location
    await ParkingLocation.findByIdAndUpdate(booking.locationId, {
      $inc: { availableSlots: 1 }
    });

    res.json({ message: 'Slot vacated successfully', booking });
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

    booking.duration += Number(additionalHours);
    booking.totalCost += Number(additionalCost);
    await booking.save();

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

    // Notify all affected users via Socket.IO
    const io = req.app.get('socketio');
    if (io) {
      for (const booking of bookings) {
        io.emit('bookingRemoved', {
          userId: booking.userId.toString(),
          bookingId: booking.bookingId,
          message: 'Your booking has been removed by the admin.'
        });
      }
    }

    res.json({ message: 'All bookings removed successfully by Admin' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
