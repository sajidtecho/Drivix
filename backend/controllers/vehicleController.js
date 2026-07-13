import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';

// @desc    Add a new vehicle
// @route   POST /api/v1/vehicles
// @access  Private
export const addVehicle = async (req, res) => {
  const { vehicleNumber, vehicleType, brand, model, color, fuelType, plate, type } = req.body;

  const resolvedNumber = (vehicleNumber || plate || '').trim().toUpperCase();
  const resolvedType = (vehicleType || type || 'Car').trim();
  const resolvedFuel = (fuelType || type || 'Petrol').trim();

  if (!resolvedNumber) {
    return res.status(400).json({ message: 'Vehicle number/plate is required' });
  }

  try {
    // Check if vehicle is already registered in standalone collection
    const vehicleExists = await Vehicle.findOne({ vehicleNumber: resolvedNumber });
    if (vehicleExists) {
      return res.status(400).json({ message: 'Vehicle already registered' });
    }

    const vehicle = await Vehicle.create({
      userId: req.user._id,
      vehicleNumber: resolvedNumber,
      vehicleType: resolvedType,
      brand: brand || 'Generic',
      model: model || 'Generic',
      color: color || 'Generic',
      fuelType: resolvedFuel
    });

    // Sync with User's embedded vehicles array
    const user = await User.findById(req.user._id);
    if (user) {
      const alreadyEmbedded = user.vehicles.some(v => v.plate === resolvedNumber);
      if (!alreadyEmbedded) {
        user.vehicles.push({
          plate: resolvedNumber,
          model: model || brand || 'Vehicle',
          isPrimary: user.vehicles.length === 0
        });
        await user.save();
      }
    }

    const responseObj = vehicle.toObject();
    responseObj.plate = resolvedNumber;
    responseObj.type = resolvedFuel;

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
    const vehicles = await Vehicle.find({ userId: req.user._id });
    
    // Map to include both fields for compatibility with different mobile/web clients
    const mapped = vehicles.map(v => {
      const obj = v.toObject();
      obj.plate = obj.vehicleNumber;
      obj.type = obj.fuelType || obj.vehicleType;
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
    await vehicle.deleteOne();

    // Sync with User's embedded vehicles array
    const user = await User.findById(req.user._id);
    if (user) {
      user.vehicles = user.vehicles.filter(v => v.plate !== resolvedNumber);
      await user.save();
    }

    res.json({ message: 'Vehicle removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

