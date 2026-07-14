import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';

// @desc    Add a new vehicle
// @route   POST /api/v1/vehicles
// @access  Private
export const addVehicle = async (req, res) => {
  const { vehicleNumber, vehicleType, brand, model, color, fuelType, plate, type } = req.body;

  const resolvedNumber = (vehicleNumber || plate || '').trim().toUpperCase();
  const resolvedType = (vehicleType || type || 'Car').trim();
  let resolvedFuel = (fuelType || type || 'Petrol').trim();
  if (resolvedFuel === 'Electric') resolvedFuel = 'EV';

  if (!resolvedNumber) {
    return res.status(400).json({ message: 'Vehicle number/plate is required' });
  }

  try {
    // Check if vehicle is already registered in standalone collection
    const vehicleExists = await Vehicle.findOne({ vehicleNumber: resolvedNumber });
    if (vehicleExists) {
      return res.status(400).json({ message: 'Vehicle already registered' });
    }

    // Default to primary if this is the user's first registered vehicle
    const existingCount = await Vehicle.countDocuments({ userId: req.user._id });
    const isPrimary = existingCount === 0;

    const vehicle = await Vehicle.create({
      userId: req.user._id,
      vehicleNumber: resolvedNumber,
      vehicleType: resolvedType,
      brand: brand || 'Generic',
      model: model || 'Generic',
      color: color || 'Generic',
      fuelType: resolvedFuel,
      isPrimary
    });

    // Sync with User's embedded vehicles array
    const user = await User.findById(req.user._id);
    if (user) {
      const alreadyEmbedded = user.vehicles.some(v => v.plate === resolvedNumber);
      if (!alreadyEmbedded) {
        user.vehicles.push({
          plate: resolvedNumber,
          model: model || brand || 'Vehicle',
          isPrimary: isPrimary
        });
        await user.save();
      }
    }

    const responseObj = vehicle.toObject();
    responseObj.plate = resolvedNumber;
    responseObj.type = resolvedFuel;
    responseObj.isPrimary = vehicle.isPrimary;

    res.status(201).json(responseObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's registered vehicles
// @route   GET /api/v1/vehicles
// @access  Private
export const getUserVehicles = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const standaloneVehicles = await Vehicle.find({ userId: req.user._id });
    
    // Auto-sync missing standalone vehicles from embedded array
    const syncedVehicles = [...standaloneVehicles];
    if (user.vehicles && user.vehicles.length > 0) {
      for (const embedded of user.vehicles) {
        const plateUpper = embedded.plate.trim().toUpperCase();
        const exists = standaloneVehicles.some(v => v.vehicleNumber === plateUpper);
        if (!exists) {
          try {
            const newVehicle = await Vehicle.create({
              userId: req.user._id,
              vehicleNumber: plateUpper,
              vehicleType: 'Car',
              brand: 'Generic',
              model: embedded.model || 'Generic',
              color: 'Generic',
              fuelType: 'Petrol', // fallback default
              isPrimary: embedded.isPrimary || false
            });
            syncedVehicles.push(newVehicle);
            console.log(`Synced missing standalone vehicle ${plateUpper} for user ${user.email}`);
          } catch (createErr) {
            console.warn(`Failed to auto-sync vehicle ${plateUpper}:`, createErr.message);
          }
        }
      }
    }

    // Map to include both fields for compatibility with different mobile/web clients
    const mapped = syncedVehicles.map(v => {
      const obj = v.toObject();
      obj.plate = obj.vehicleNumber;
      obj.type = obj.fuelType || obj.vehicleType;
      obj.isPrimary = obj.isPrimary || false;
      return obj;
    });

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a registered vehicle
// @route   DELETE /api/v1/vehicles/:id
// @access  Private
export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Ensure the vehicle belongs to the logged-in user
    if (vehicle.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this vehicle' });
    }

    const resolvedNumber = vehicle.vehicleNumber;
    const wasPrimary = vehicle.isPrimary;
    await vehicle.deleteOne();

    // Sync with User's embedded vehicles array
    const user = await User.findById(req.user._id);
    if (user) {
      user.vehicles = user.vehicles.filter(v => v.plate !== resolvedNumber);
      
      // If we deleted the primary vehicle, elect a new primary if there are other vehicles
      if (wasPrimary && user.vehicles.length > 0) {
        user.vehicles[0].isPrimary = true;
        const nextPlate = user.vehicles[0].plate.trim().toUpperCase();
        await Vehicle.findOneAndUpdate({ userId: req.user._id, vehicleNumber: nextPlate }, { isPrimary: true });
      }
      
      await user.save();
    }

    res.json({ message: 'Vehicle removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Set a vehicle as primary
// @route   PUT /api/v1/vehicles/:id/primary
// @access  Private
export const setPrimaryVehicle = async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const userId = req.user._id;

    // 1. Find the vehicle to set as primary
    const primaryVehicle = await Vehicle.findOne({ _id: vehicleId, userId });
    if (!primaryVehicle) {
      return res.status(404).json({ message: 'Vehicle not found or not owned by you' });
    }

    // 2. Set all other user vehicles to non-primary in standalone collection
    await Vehicle.updateMany(
      { userId, _id: { $ne: vehicleId } },
      { $set: { isPrimary: false } }
    );

    // 3. Mark this one as primary
    primaryVehicle.isPrimary = true;
    await primaryVehicle.save();

    // 4. Update the User's embedded vehicles list
    const user = await User.findById(userId);
    if (user) {
      const targetPlate = primaryVehicle.vehicleNumber.trim().toUpperCase();
      user.vehicles = user.vehicles.map(v => {
        const isTarget = v.plate.trim().toUpperCase() === targetPlate;
        return {
          _id: v._id,
          plate: v.plate,
          model: v.model,
          isPrimary: isTarget
        };
      });
      await user.save();
    }

    res.json({ message: 'Vehicle set as primary successfully', vehicle: primaryVehicle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

