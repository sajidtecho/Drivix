import Vehicle from '../models/Vehicle.js';

// @desc    Add a new vehicle
// @route   POST /api/v1/vehicles
// @access  Private
export const addVehicle = async (req, res) => {
  const { vehicleNumber, vehicleType, brand, model, color, fuelType } = req.body;

  try {
    // Check if vehicle is already registered
    const vehicleExists = await Vehicle.findOne({ vehicleNumber });
    if (vehicleExists) {
      return res.status(400).json({ message: 'Vehicle already registered' });
    }

    const vehicle = await Vehicle.create({
      userId: req.user._id,
      vehicleNumber,
      vehicleType,
      brand,
      model,
      color,
      fuelType
    });

    res.status(201).json(vehicle);
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
    res.json(vehicles);
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

    await vehicle.deleteOne();
    res.json({ message: 'Vehicle removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
