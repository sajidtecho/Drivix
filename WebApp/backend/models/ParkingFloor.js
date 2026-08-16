import mongoose from 'mongoose';

const ParkingFloorSchema = new mongoose.Schema({
  parkingHubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLocation',
    required: [true, 'Parking location reference (parkingHubId) is required'],
    index: true
  },
  floorName: {
    type: String,
    required: [true, 'Floor name is required'],
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
  },
  occupiedSlots: {
    type: Number,
    default: 0,
    min: [0, 'Occupied slots cannot be negative']
  },
  reservedCapacity: {
    type: Number,
    default: 0,
    min: [0, 'Reserved capacity cannot be negative']
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for floorId mapping to _id
ParkingFloorSchema.virtual('floorId').get(function() {
  return this._id.toString();
});

// Virtual for totalCapacity mapping to totalSlots
ParkingFloorSchema.virtual('totalCapacity')
  .get(function() {
    return this.totalSlots;
  })
  .set(function(val) {
    this.totalSlots = val;
  });

// Ensure floor name is unique within a specific parking hub
ParkingFloorSchema.index({ parkingHubId: 1, floorName: 1 }, { unique: true });

const ParkingFloor = mongoose.model('ParkingFloor', ParkingFloorSchema);
export default ParkingFloor;
