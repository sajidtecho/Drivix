import ParkingLocation from '../models/ParkingLocation.js';
import Slot from '../models/Slot.js';
import { calculateDynamicPrice } from '../utils/pricingEngine.js';

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

// @desc    Get all parking locations
// @route   GET /api/v1/parking
// @access  Private
export const getLocations = async (req, res) => {
  try {
    const locations = await ParkingLocation.find({});
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
