import mongoose from 'mongoose';

const ParkingFloorSchema = new mongoose.Schema({
  parkingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLocation',
    required: [true, 'Parking location reference (parkingId) is required'],
    index: true
  },
  floorNumber: {
    type: String,
    required: [true, 'Floor number/label is required'],
    trim: true
  },
  totalSlots: {
    type: Number,
    default: 0,
    min: [0, 'Total slots cannot be negative']
  },
  availableSlots: {
    type: Number,
    default: 0,
    min: [0, 'Available slots cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ParkingFloor → Slots (One to Many Virtual)
ParkingFloorSchema.virtual('slotsList', {
  ref: 'ParkingSlot',
  localField: '_id',
  foreignField: 'floorId'
});

// Ensure a floor number is unique within a specific parking location
ParkingFloorSchema.index({ parkingId: 1, floorNumber: 1 }, { unique: true });

const ParkingFloor = mongoose.model('ParkingFloor', ParkingFloorSchema);
export default ParkingFloor;
