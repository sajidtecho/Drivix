import mongoose from 'mongoose';

const EntryLogSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null,
    index: true
  },
  parkingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLocation',
    required: [true, 'Parking location reference is required'],
    index: true
  },
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    trim: true,
    uppercase: true,
    index: true
  },
  numberPlateImage: {
    type: String,
    default: '' // URL or Base64 of captured plate image
  },
  driverFaceImage: {
    type: String,
    default: '' // URL or Base64 of captured driver face image
  },
  entryTime: {
    type: Date,
    default: Date.now
  },
  exitTime: {
    type: Date,
    default: null
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'flagged'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const EntryLog = mongoose.model('EntryLog', EntryLogSchema);
export default EntryLog;
