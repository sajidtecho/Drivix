import Booking from '../models/Booking.js';
import Slot from '../models/Slot.js';
import ParkingFloor from '../models/ParkingFloor.js';
import { updateFloorCounters } from './bookingController.js';

/**
 * Simulates entry gate check-in upon plate recognition.
 * @desc    Simulate ANPR Entry Check-In
 * @route   POST /api/v1/gate/simulate-entry
 * @access  Public
 */
export const simulateEntry = async (req, res) => {
  const { vehicleNumber, parkingHubId } = req.body;

  if (!vehicleNumber || !parkingHubId) {
    return res.status(400).json({ message: 'vehicleNumber and parkingHubId are required' });
  }

  try {
    // Standardize license plate string (remove spaces, uppercase)
    const cleanPlate = vehicleNumber.replace(/\s+/g, '').toUpperCase();
    const queryReg = new RegExp('^' + cleanPlate.split('').join('\\s*') + '$', 'i');

    // 1. Find a slot-assigned booking for this vehicle at this parking hub
    let booking = await Booking.findOne({
      parkingHubId,
      vehicleNumber: { $regex: queryReg },
      status: 'Slot Assigned'
    });

    // 2. If no pre-assigned booking, check if there is a Confirmed booking without slotId yet.
    // If found, auto-allocate a slot reactively at the gate!
    if (!booking) {
      const confirmedBooking = await Booking.findOne({
        parkingHubId,
        vehicleNumber: { $regex: queryReg },
        status: 'Confirmed',
        slotId: null
      });

      if (confirmedBooking) {
        console.log(`[Gate ANPR] Found Confirmed booking ${confirmedBooking.bookingId} without slot. Running auto-allocation...`);
        const { SlotAllocationService } = await import('../services/SlotAllocationService.js');
        try {
          const result = await SlotAllocationService.allocateSlot(confirmedBooking._id);
          booking = result.booking;
        } catch (allocErr) {
          console.error('[Gate ANPR] Reactive slot allocation failed:', allocErr.message);
          return res.status(400).json({
            message: `Auto-allocation failed: ${allocErr.message}. Gate entry denied.`
          });
        }
      }
    }

    if (!booking) {
      return res.status(404).json({
        message: `Access Denied: No active booking found for vehicle plate ${vehicleNumber} at this location.`
      });
    }

    // 3. Validate Entry Time Window
    const now = new Date();
    const startDateTime = new Date(`${booking.bookingDate}T${booking.startTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + booking.duration * 60 * 60 * 1000);
    const earlyLimit = new Date(startDateTime.getTime() - 45 * 60 * 1000); // 45-min early grace period

    if (now < earlyLimit) {
      return res.status(400).json({
        message: `Access Denied: Arrived too early. Booking starts at ${booking.startTime}.`
      });
    }

    if (now > endDateTime) {
      // Auto-expire booking
      booking.status = 'Expired';
      await booking.save();
      await updateFloorCounters(booking.parkingHubId, booking.floorId);
      return res.status(400).json({
        message: `Access Denied: Booking has expired. Expiry was at ${booking.endTime}.`
      });
    }

    // 4. Open Gate and Check In
    booking.status = 'Checked In';
    booking.arrivalConfirmed = true;
    booking.entryTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    await booking.save();

    // Mark slot as Occupied
    if (booking.slotId) {
      const slot = await Slot.findOne({ facilityId: booking.locationId, id: booking.slotId });
      if (slot) {
        slot.CurrentStatus = 'Occupied';
        slot.status = 'occupied';
        slot.LastOccupiedAt = new Date();
        await slot.save();
      }
    }

    // Recalculate capacity counts
    await updateFloorCounters(booking.parkingHubId, booking.floorId);

    // Emit live status updates
    const io = global.io;
    if (io) {
      io.emit('slotStatusUpdated', {
        facilityId: booking.locationId.toString(),
        id: booking.slotId,
        status: 'occupied',
        reservationExpiresAt: null,
        reservedBy: booking.userId
      });

      io.emit('gateStateChanged', {
        gateType: 'entry',
        parkingHubId: booking.parkingHubId.toString(),
        status: 'Open',
        vehicleNumber: booking.vehicleNumber,
        message: `Access Granted! Vehicle ${booking.vehicleNumber} checked in. Slot ${booking.slotId} occupied.`,
        bookingId: booking._id.toString()
      });
    }

    res.json({
      message: `Access Granted. Entry Gate opened! Proceed to Floor ${booking.floor}, Slot ${booking.slotId}.`,
      booking
    });

  } catch (error) {
    console.error('[Gate ANPR] Entry simulation error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Simulates exit gate check-out upon plate recognition.
 * @desc    Simulate ANPR Exit Check-Out
 * @route   POST /api/v1/gate/simulate-exit
 * @access  Public
 */
export const simulateExit = async (req, res) => {
  const { vehicleNumber, parkingHubId } = req.body;

  if (!vehicleNumber || !parkingHubId) {
    return res.status(400).json({ message: 'vehicleNumber and parkingHubId are required' });
  }

  try {
    const cleanPlate = vehicleNumber.replace(/\s+/g, '').toUpperCase();
    const queryReg = new RegExp('^' + cleanPlate.split('').join('\\s*') + '$', 'i');

    // Find the checked-in booking
    const booking = await Booking.findOne({
      parkingHubId,
      vehicleNumber: { $regex: queryReg },
      status: 'Checked In'
    });

    if (!booking) {
      return res.status(404).json({
        message: `Access Denied: No checked-in vehicle found with plate ${vehicleNumber} at this location.`
      });
    }

    const now = new Date();

    // 1. Perform Check Out
    booking.status = 'Checked Out';
    booking.exitTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    await booking.save();

    // 2. Release slot back to Available
    if (booking.slotId) {
      const slot = await Slot.findOne({ facilityId: booking.locationId, id: booking.slotId });
      if (slot) {
        slot.CurrentStatus = 'Available';
        slot.status = 'available';
        slot.reservedBy = null;
        slot.reservationExpiresAt = null;
        await slot.save();

        const io = global.io;
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
    }

    // 3. Update floor capacity counters
    await updateFloorCounters(booking.parkingHubId, booking.floorId);

    // Emit live exit status
    const io = global.io;
    if (io) {
      io.emit('gateStateChanged', {
        gateType: 'exit',
        parkingHubId: booking.parkingHubId.toString(),
        status: 'Open',
        vehicleNumber: booking.vehicleNumber,
        message: `Access Granted! Vehicle ${booking.vehicleNumber} checked out. Exit Gate opened.`,
        bookingId: booking._id.toString()
      });
    }

    res.json({
      message: 'Access Granted. Exit Gate opened! Thank you for using Drivix.',
      booking
    });

  } catch (error) {
    console.error('[Gate ANPR] Exit simulation error:', error);
    res.status(500).json({ message: error.message });
  }
};
