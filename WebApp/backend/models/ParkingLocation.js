import mongoose from 'mongoose';

const ParkingLocationSchema = new mongoose.Schema({
  parkingName: {
    type: String,
    required: [true, 'Parking name is required'],
    trim: true
  },
  parkingCode: {
    type: String,
    required: [true, 'Parking code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  pincode: {
    type: String,
    default: null,
    trim: true
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  openingTime: {
    type: String,
    default: null
  },
  closingTime: {
    type: String,
    default: null
  },
  totalFloors: {
    type: Number,
    default: null
  },
  totalSlots: {
    type: Number,
    default: null
  },
  availableSlots: {
    type: Number,
    default: null
  },
  hourlyPrice: {
    type: Number,
    default: null
  },
  amenities: {
    type: [String],
    default: []
  },
  images: {
    type: [String],
    default: []
  },
  floors: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive', 'Pending'],
      message: 'Status must be Active, Inactive, or Pending'
    },
    default: 'Active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ParkingLocationSchema.virtual('floorsList', {
  ref: 'ParkingFloor',
  localField: '_id',
  foreignField: 'parkingId'
});

const ParkingLocation = mongoose.models.ParkingLocation || mongoose.model('ParkingLocation', ParkingLocationSchema, 'parkinglocations');
export default ParkingLocation;
