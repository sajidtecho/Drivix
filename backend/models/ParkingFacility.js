import mongoose from 'mongoose';

const ParkingFacilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  distance: { type: String, default: '0.0 km' },
  totalSlots: { type: Number, default: 0 },
  availableSlots: { type: Number, default: 0 },
  pricePerHr: { type: Number, default: 20 },
  rating: { type: Number, default: 5.0 },
  floors: [{ type: String }],
  features: [{ type: String }],
  color: { type: String, default: '#FFCE00' },
  badge: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const ParkingFacility = mongoose.model('ParkingFacility', ParkingFacilitySchema);
export default ParkingFacility;
