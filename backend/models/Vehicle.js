import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  vehicleType: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: ''
  },
  fuelType: {
    type: String,
    enum: ['Petrol', 'Diesel', 'CNG', 'EV'],
    required: true
  }
}, {
  timestamps: true
});

const Vehicle = mongoose.model('Vehicle', VehicleSchema);
export default Vehicle;
