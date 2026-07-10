import mongoose from 'mongoose';

const ParkingSlotSchema = new mongoose.Schema({
  parkingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLocation',
    required: [true, 'Parking location reference (parkingId) is required'],
    index: true
  },
  floorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingFloor',
    required: [true, 'Floor reference (floorId) is required'],
    index: true
  },
  slotNumber: {
    type: String,
    required: [true, 'Slot number is required'],
    trim: true
  },
  vehicleType: {
    type: String,
    default: 'Car',
    trim: true
  },
  slotStatus: {
    type: String,
    enum: {
      values: ['Available', 'Reserved', 'Occupied', 'Maintenance'],
      message: 'Status must be Available, Reserved, Occupied, or Maintenance'
    },
    default: 'Available'
  },
  isReserved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure a slot number is unique within a specific floor
ParkingSlotSchema.index({ floorId: 1, slotNumber: 1 }, { unique: true });

const ParkingSlot = mongoose.model('ParkingSlot', ParkingSlotSchema);
export default ParkingSlot;
