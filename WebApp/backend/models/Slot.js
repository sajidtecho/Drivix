import mongoose from 'mongoose';

const SlotSchema = new mongoose.Schema({
  // New Schema Fields
  slotId: { type: String, required: true }, // e.g. 'L1-A1' or unique identifier
  floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingFloor', required: true },
  slotNumber: { type: String, required: true }, // e.g. 'A1'
  vehicleType: { type: String, default: 'Car', enum: ['Car', 'Bike', 'EV'] },
  EVSupported: { type: Boolean, default: false },
  NearElevator: { type: Boolean, default: false },
  NearExit: { type: Boolean, default: false },
  Accessibility: { type: Boolean, default: false },
  CurrentStatus: { 
    type: String, 
    enum: ['Available', 'Reserved', 'Occupied', 'Maintenance'], 
    default: 'Available' 
  },
  LastOccupiedAt: { type: Date, default: null },

  // Backward Compatibility Fields
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingLocation', required: true },
  id: { type: String, required: true }, // e.g. 'L1-A1' (legacy slotId representation)
  floor: { type: String, required: true }, // e.g. 'L1' (legacy floor representation)
  row: { type: String, required: true }, // e.g. 'A'
  number: { type: Number, required: true }, // e.g. 1
  status: { 
    type: String, 
    default: 'available', 
    enum: ['available', 'temporarily_reserved', 'booked', 'occupied', 'maintenance'] 
  },
  reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reservationExpiresAt: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now }
});

// Set a compound index to ensure slot ID is unique per facility
SlotSchema.index({ facilityId: 1, id: 1 }, { unique: true });
SlotSchema.index({ floorId: 1, slotNumber: 1 }, { unique: true });

// Pre-validate hook to synchronize status, slotId, and slotNumber before validation
SlotSchema.pre('validate', function() {
  // Keep slotId and id synchronized
  if (this.id && !this.slotId) {
    this.slotId = this.id;
  } else if (this.slotId && !this.id) {
    this.id = this.slotId;
  }

  // Ensure slotNumber has a fallback
  if (!this.slotNumber) {
    this.slotNumber = this.id || this.slotId || 'A1';
  }

  // Sync CurrentStatus to status
  if (this.isModified('CurrentStatus')) {
    if (this.CurrentStatus === 'Available') this.status = 'available';
    else if (this.CurrentStatus === 'Reserved') this.status = 'booked';
    else if (this.CurrentStatus === 'Occupied') this.status = 'occupied';
    else if (this.CurrentStatus === 'Maintenance') this.status = 'maintenance';
  } 
  // Sync status to CurrentStatus
  else if (this.isModified('status')) {
    if (this.status === 'available') this.CurrentStatus = 'Available';
    else if (this.status === 'booked' || this.status === 'temporarily_reserved') this.CurrentStatus = 'Reserved';
    else if (this.status === 'occupied') this.CurrentStatus = 'Occupied';
    else if (this.status === 'maintenance') this.CurrentStatus = 'Maintenance';
  }

  this.updatedAt = Date.now();
});

const Slot = mongoose.model('Slot', SlotSchema);
export default Slot;
