import mongoose from 'mongoose';

const PartnerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    businessName: {
      type: String,
      required: [true, 'Business/Facility name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true
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
    pin: {
      type: String,
      required: [true, 'PIN code is required'],
      trim: true
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: -180,
      max: 180
    },
    facilityType: {
      type: String,
      required: [true, 'Facility type is required'],
      trim: true
    },
    slotsCount: {
      type: String,
      required: [true, 'Slots count is required'],
      trim: true
    },
    vehicles: {
      type: [String],
      required: [true, 'Supported vehicle types are required']
    },
    operatingHours: {
      type: String,
      required: [true, 'Operating hours are required'],
      trim: true
    },
    documentFile: {
      type: String, // Store base64 data URL representing the uploaded document
      required: [true, 'Document is required']
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

const Partner = mongoose.model('Partner', PartnerSchema);
export default Partner;
