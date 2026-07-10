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
    required: [true, 'Pincode is required'],
    match: [/^\d{6}$/, 'Pincode must be exactly 6 digits']
  },
  latitude: {
    type: Number,
    required: [true, 'Latitude is required'],
    min: [-90, 'Latitude must be between -90 and 90'],
    max: [90, 'Latitude must be between -90 and 90']
  },
  longitude: {
    type: Number,
    required: [true, 'Longitude is required'],
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180']
  },
  openingTime: {
    type: String,
    required: [true, 'Opening time is required']
  },
  closingTime: {
    type: String,
    required: [true, 'Closing time is required']
  },
  totalFloors: {
    type: Number,
    required: [true, 'Total floors is required'],
    min: [1, 'Must have at least 1 floor']
  },
  totalSlots: {
    type: Number,
    required: [true, 'Total slots is required'],
    min: [0, 'Slots cannot be negative']
  },
  availableSlots: {
    type: Number,
    required: [true, 'Available slots is required'],
    min: [0, 'Slots cannot be negative']
  },
  hourlyPrice: {
    type: Number,
    required: [true, 'Hourly price is required'],
    min: [0, 'Price cannot be negative']
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
    default: ['L1']
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive'],
      message: 'Status must be either Active or Inactive'
    },
    default: 'Active'
  }
}, {
  timestamps: true
});

const ParkingLocation = mongoose.model('ParkingLocation', ParkingLocationSchema);
export default ParkingLocation;
