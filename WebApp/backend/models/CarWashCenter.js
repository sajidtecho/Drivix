import mongoose from 'mongoose';

const CarWashCenterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    enum: ['Noida', 'Greater Noida', 'Delhi', 'Gurgaon', 'Faridabad', 'Ghaziabad'],
    default: 'Noida',
  },
  locality: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  phone: {
    type: String,
    default: '+91 98100 12345',
  },
  website: {
    type: String,
    default: null,
  },
  supportedVehicles: {
    type: [String],
    enum: ['car', 'bike', 'bus_truck'],
    default: ['car', 'bike'],
  },
  services: {
    type: [String],
    default: ['car wash'],
  },
  pricing: {
    bike: { type: Number, default: 149 },
    car: { type: Number, default: 299 },
    bus_truck: { type: Number, default: 799 },
  },
  rating: {
    type: Number,
    default: 4.8,
  },
  reviewsCount: {
    type: Number,
    default: 84,
  },
  operatingHours: {
    type: String,
    default: '08:00 AM - 08:30 PM',
  },
  external_id: {
    type: String,
    unique: true,
    sparse: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

CarWashCenterSchema.index({ latitude: 1, longitude: 1 });
CarWashCenterSchema.index({ city: 1, supportedVehicles: 1 });

const CarWashCenter = mongoose.model('CarWashCenter', CarWashCenterSchema);
export default CarWashCenter;
