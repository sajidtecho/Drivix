import mongoose from 'mongoose';

const SlotSchema = new mongoose.Schema({
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingLocation', required: true },
  id: { type: String, required: true }, // e.g. 'L1-A1'
  floor: { type: String, required: true }, // e.g. 'L1'
  row: { type: String, required: true }, // e.g. 'A'
  number: { type: Number, required: true }, // e.g. 1
  status: { type: String, default: 'available', enum: ['available', 'booked', 'reserved'] },
  updatedAt: { type: Date, default: Date.now }
});

// Set a compound index to ensure slot ID is unique per facility
SlotSchema.index({ facilityId: 1, id: 1 }, { unique: true });

const Slot = mongoose.model('Slot', SlotSchema);
export default Slot;
