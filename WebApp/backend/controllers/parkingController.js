import ParkingLocation from '../models/ParkingLocation.js';
import Slot from '../models/Slot.js';
import ParkingFloor from '../models/ParkingFloor.js';
import Booking from '../models/Booking.js';
import mongoose from 'mongoose';
import { calculateDynamicPrice } from '../utils/pricingEngine.js';
import { getOverlappingCount } from './bookingController.js';
import { getCache, setCache } from '../config/redis.js';


// ==========================================
// PARKING LOCATION CONTROLLERS
// ==========================================

// @desc    Create a new parking location
// @route   POST /api/v1/parking
// @access  Private/Admin
export const createLocation = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized as an admin' });
  }

  const {
    parkingName,
    parkingCode,
    address,
    city,
    state,
    pincode,
    latitude,
    longitude,
    openingTime,
    closingTime,
    totalFloors,
    totalSlots,
    availableSlots,
    hourlyPrice,
    amenities,
    images,
    status
  } = req.body;

  try {
    const codeExists = await ParkingLocation.findOne({ parkingCode });
    if (codeExists) {
      return res.status(400).json({ message: 'Parking code must be unique' });
    }

    const location = await ParkingLocation.create({
      parkingName,
      parkingCode,
      address,
      city,
      state,
      pincode,
      latitude: Number(latitude),
      longitude: Number(longitude),
      openingTime,
      closingTime,
      totalFloors: Number(totalFloors),
      totalSlots: Number(totalSlots || 0),
      availableSlots: Number(availableSlots || 0),
      hourlyPrice: Number(hourlyPrice),
      amenities: amenities || [],
      images: images || [],
      status: status || 'Active'
    });

    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all parking locations (with optional filters)
// @route   GET /api/v1/parking
// @access  Private
export const getLocations = async (req, res) => {
  try {
    const { city, status, search } = req.query;
    let filterQuery = {};

    if (city && city !== 'ALL') {
      filterQuery.city = new RegExp(city, 'i');
    }

    if (status && status !== 'ALL') {
      filterQuery.status = status;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filterQuery.$or = [
        { parkingName: searchRegex },
        { address: searchRegex },
        { city: searchRegex },
        { parkingCode: searchRegex }
      ];
    }

    const locations = await ParkingLocation.find(filterQuery);
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a parking location
// @route   DELETE /api/v1/parking/:id
// @access  Private/Admin
export const deleteLocation = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized as an admin' });
  }

  try {
    const location = await ParkingLocation.findById(req.params.id);

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Delete associated slots
    await Slot.deleteMany({ facilityId: location._id });

    // Delete location
    await location.deleteOne();

    res.json({ message: 'Location and associated slots deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a parking location properties (e.g. floors, pricing, name)
// @route   PUT /api/v1/parking/:id
// @access  Private/Admin
export const updateLocation = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized as an admin' });
  }

  try {
    const location = await ParkingLocation.findById(req.params.id);

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Update passed fields
    location.parkingName = req.body.parkingName || location.parkingName;
    location.address = req.body.address || location.address;
    location.city = req.body.city || location.city;
    location.state = req.body.state || location.state;
    location.pincode = req.body.pincode || location.pincode;
    if (req.body.latitude !== undefined) location.latitude = Number(req.body.latitude);
    if (req.body.longitude !== undefined) location.longitude = Number(req.body.longitude);
    location.openingTime = req.body.openingTime || location.openingTime;
    location.closingTime = req.body.closingTime || location.closingTime;
    if (req.body.totalFloors !== undefined) location.totalFloors = Number(req.body.totalFloors);
    if (req.body.hourlyPrice !== undefined) location.hourlyPrice = Number(req.body.hourlyPrice);
    if (req.body.amenities) location.amenities = req.body.amenities;
    if (req.body.images) location.images = req.body.images;
    if (req.body.floors) location.floors = req.body.floors;
    location.status = req.body.status || location.status;

    const updated = await location.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// SLOT CONTROLLERS
// ==========================================

// @desc    Get slots for a facility
// @route   GET /api/v1/parking/:facilityId/slots
// @access  Private
export const getSlots = async (req, res) => {
  try {
    const now = new Date();
    // Clean up expired slot reservations for this facility dynamically
    await Slot.updateMany(
      {
        facilityId: req.params.facilityId,
        status: 'temporarily_reserved',
        reservationExpiresAt: { $lt: now }
      },
      {
        $set: {
          status: 'available',
          reservedBy: null,
          reservationExpiresAt: null
        }
      }
    );

    const slots = await Slot.find({ facilityId: req.params.facilityId });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk add slots to a floor
// @route   POST /api/v1/parking/:facilityId/slots/bulk
// @access  Private/Admin
export const bulkAddSlots = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized as an admin' });
  }

  const { facilityId } = req.params;
  const { selectedFloor, newSlotPrefix, newSlotCount } = req.body;

  try {
    const location = await ParkingLocation.findById(facilityId);
    if (!location) {
      return res.status(404).json({ message: 'Parking location not found' });
    }

    let added = 0;
    const existingSlots = await Slot.find({ facilityId });

    for (let i = 1; i <= newSlotCount; i++) {
      const slotId = `${selectedFloor}-${newSlotPrefix}${i}`;

      // Check if slot ID already exists for this facility
      const slotExists = existingSlots.some(s => s.id === slotId);
      if (slotExists) continue;

      await Slot.create({
        facilityId,
        id: slotId,
        floor: selectedFloor,
        row: newSlotPrefix,
        number: i,
        status: 'available'
      });

      added++;
    }

    // Update parent total & available slots
    location.totalSlots += added;
    location.availableSlots += added;
    await location.save();

    res.status(201).json({ added, message: `Successfully added ${added} slots` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a slot
// @route   DELETE /api/v1/parking/:facilityId/slots/:slotId
// @access  Private/Admin
export const deleteSlot = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized as an admin' });
  }

  const { facilityId, slotId } = req.params;

  try {
    const slot = await Slot.findOne({ facilityId, id: slotId });
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    const wasAvailable = slot.status === 'available';

    await slot.deleteOne();

    // Decrement parent location counts
    await ParkingLocation.findByIdAndUpdate(facilityId, {
      $inc: {
        totalSlots: -1,
        availableSlots: wasAvailable ? -1 : 0
      }
    });

    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle slot status (available <-> booked)
// @route   PUT /api/v1/parking/:facilityId/slots/:slotId/toggle
// @access  Private
export const toggleSlot = async (req, res) => {
  const { facilityId, slotId } = req.params;

  try {
    const slot = await Slot.findOne({ facilityId, id: slotId });
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    const oldStatus = slot.status;
    const newStatus = oldStatus === 'available' ? 'booked' : 'available';
    slot.status = newStatus;
    await slot.save();

    // Adjust availability counter on parent location
    const availableInc = (oldStatus === 'available' && newStatus === 'booked') 
      ? -1 
      : (oldStatus === 'booked' && newStatus === 'available') 
        ? 1 
        : 0;

    if (availableInc !== 0) {
      await ParkingLocation.findByIdAndUpdate(facilityId, {
        $inc: { availableSlots: availableInc }
      });
    }

    res.json(slot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Temporarily reserve a slot (Soft lock for 5 minutes)
// @route   POST /api/v1/parking/:facilityId/slots/:slotId/reserve
// @access  Private
export const reserveSlot = async (req, res) => {
  const { facilityId, slotId } = req.params;
  const userId = req.user._id;

  try {
    const now = new Date();
    // Try to update the slot atomically only if it is available or has an expired reservation
    const slot = await Slot.findOneAndUpdate(
      {
        facilityId,
        id: slotId,
        $or: [
          { status: 'available' },
          { status: 'temporarily_reserved', reservationExpiresAt: { $lt: now } }
        ]
      },
      {
        $set: {
          status: 'temporarily_reserved',
          reservedBy: userId,
          reservationExpiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes lock
        }
      },
      { new: true }
    );

    if (!slot) {
      return res.status(409).json({ message: 'This slot is currently being booked by another user. Please choose another available slot.' });
    }

    // Emit Socket.io update to all connected clients!
    const io = req.app.get('socketio');
    if (io) {
      io.emit('slotStatusUpdated', {
        facilityId,
        id: slotId,
        status: 'temporarily_reserved',
        reservationExpiresAt: slot.reservationExpiresAt,
        reservedBy: userId.toString()
      });
    }

    res.json(slot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Release a temporarily reserved slot
// @route   POST /api/v1/parking/:facilityId/slots/:slotId/release
// @access  Private
export const releaseSlot = async (req, res) => {
  const { facilityId, slotId } = req.params;
  const userId = req.user._id;

  try {
    // Only release if reserved by the current user
    const slot = await Slot.findOneAndUpdate(
      {
        facilityId,
        id: slotId,
        status: 'temporarily_reserved',
        reservedBy: userId
      },
      {
        $set: {
          status: 'available',
          reservedBy: null,
          reservationExpiresAt: null
        }
      },
      { new: true }
    );

    if (!slot) {
      return res.status(400).json({ message: 'Slot was not reserved by you or is already released.' });
    }

    const io = req.app.get('socketio');
    if (io) {
      io.emit('slotStatusUpdated', {
        facilityId,
        id: slotId,
        status: 'available',
        reservationExpiresAt: null,
        reservedBy: null
      });
    }

    res.json(slot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dynamic price recommendation for a parking location
// @route   GET /api/v1/parking/:facilityId/pricing
// @access  Private
export const getPricingRecommendation = async (req, res) => {
  const { facilityId } = req.params;
  const { weather, isHoliday, nearbyEvent } = req.query;

  try {
    const location = await ParkingLocation.findById(facilityId);
    if (!location) {
      return res.status(404).json({ message: 'Parking location not found' });
    }

    const recommendation = calculateDynamicPrice({
      basePrice: location.hourlyPrice,
      totalSlots: location.totalSlots,
      availableSlots: location.availableSlots,
      weather: weather || 'clear',
      isHoliday: isHoliday === 'true',
      nearbyEvent: nearbyEvent === 'true'
    });

    res.json({
      locationName: location.parkingName,
      ...recommendation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get floor live capacity
// @route   GET /api/v1/parking/floor/live-capacity
// @access  Private
export const getFloorLiveCapacity = async (req, res) => {
  const { parkingHubId, floorId, floorName } = req.query;

  const hubId = parkingHubId || req.query.locationId || req.query.facilityId;

  if (!hubId) {
    return res.status(400).json({ message: 'parkingHubId is required' });
  }

  try {
    let query = { parkingHubId: hubId };
    
    if (floorId && mongoose.Types.ObjectId.isValid(floorId)) {
      query._id = floorId;
    } else if (floorName) {
      query.floorName = floorName;
    } else if (floorId) {
      // Treat floorId as name if not a valid ObjectId
      query.floorName = floorId;
    } else {
      const firstFloor = await ParkingFloor.findOne({ parkingHubId: hubId });
      if (!firstFloor) {
        return res.status(404).json({ message: 'No floors found for this parking location' });
      }
      query._id = firstFloor._id;
    }

    const floorDoc = await ParkingFloor.findOne(query);
    if (!floorDoc) {
      return res.status(404).json({ message: 'Floor not found' });
    }

    // Dynamic verification of capacities to ensure real-time consistency
    const activeBookings = await Booking.find({
      parkingHubId: hubId,
      floorId: floorDoc._id,
      status: { $in: ['Confirmed', 'Slot Assigned', 'Checked In', 'booked'] }
    });

    const occupied = activeBookings.filter(b => b.status === 'Checked In' || b.status === 'occupied').length;
    const reserved = activeBookings.filter(b => b.status === 'Confirmed' || b.status === 'booked' || b.status === 'Slot Assigned').length;
    const totalCapacity = floorDoc.totalSlots;
    const available = Math.max(0, totalCapacity - occupied - reserved);

    res.json({
      totalCapacity,
      occupied,
      reserved,
      available,
      floorName: floorDoc.floorName,
      floorId: floorDoc._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get floor availability details for a requested time interval
// @route   GET /api/parking/floors/:floorId/availability
// @route   GET /api/v1/parking/floors/:floorId/availability
// @access  Public
export const getFloorAvailability = async (req, res) => {
  const { floorId } = req.params;
  const { date, startTime, duration } = req.query;

  if (!date || !startTime || !duration) {
    return res.status(400).json({ message: 'date, startTime, and duration are required parameters' });
  }

  const hubId = req.query.parkingHubId || req.query.locationId || req.query.facilityId;
  const cacheKey = `availability:${floorId}:${hubId || 'no-hub'}:${date}:${startTime}:${duration}`;

  try {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    let floorDoc = null;
    if (mongoose.Types.ObjectId.isValid(floorId)) {
      floorDoc = await ParkingFloor.findById(floorId);
    } else {
      if (!hubId) {
        return res.status(400).json({ message: 'parkingHubId is required when querying floor by name' });
      }
      floorDoc = await ParkingFloor.findOne({ parkingHubId: hubId, floorName: floorId });
    }

    if (!floorDoc) {
      return res.status(404).json({ message: 'Floor not found' });
    }

    const totalCapacity = floorDoc.totalSlots;
    const reservedCapacity = await getOverlappingCount(floorDoc.parkingHubId, floorDoc._id, date, startTime, Number(duration));
    const availableCapacity = Math.max(0, totalCapacity - reservedCapacity);
    const isAvailable = availableCapacity > 0;

    const responseData = {
      floorId: floorDoc._id,
      floorName: floorDoc.floorName,
      totalCapacity,
      reservedCapacity,
      availableCapacity,
      isAvailable
    };

    await setCache(cacheKey, responseData, 60);

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

