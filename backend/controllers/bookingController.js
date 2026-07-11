import Booking from '../models/Booking.js';
import Slot from '../models/Slot.js';
import ParkingLocation from '../models/ParkingLocation.js';

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
    paymentMode
  } = req.body;

  try {
    // 1. Verify Slot is available (or reserved by the current user)
    const slot = await Slot.findOne({ facilityId: locationId, id: slotId });
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

    // 2. Create the booking document linked to logged-in user
    const finalPaymentMode = paymentMode || 'PAY_AFTER_CHECKOUT';
    const isPayNow = finalPaymentMode === 'PAY_NOW';

    const booking = await Booking.create({
      bookingId: bookingId || `DRX-${Date.now().toString(36).toUpperCase()}`,
      userId: req.user._id,
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
      duration: Number(duration),
      totalCost: Number(totalCost),
      paymentMode: finalPaymentMode,
      paymentStatus: isPayNow ? 'paid' : 'pending',
      prepaidAmount: isPayNow ? Number(totalCost) : 0,
      finalCost: isPayNow ? Number(totalCost) : 0,
      status: 'booked'
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
        facilityId: locationId,
        id: slotId,
        status: 'booked',
        reservationExpiresAt: null
      });
    }

    // 4. Decrement available slots on the parent location
    await ParkingLocation.findByIdAndUpdate(locationId, {
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
