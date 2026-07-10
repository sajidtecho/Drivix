import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true }, // e.g. DRX-XXXXXX
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  vehicleName: { type: String, required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingLocation', required: true },
  locationName: { type: String, required: true },
  slotId: { type: String, required: true }, // e.g. 'A1'
  floor: { type: String, required: true }, // e.g. 'L1'
  entryDate: { type: String, required: true }, // e.g. '2026-07-11'
  entryTime: { type: String, required: true }, // e.g. '12:30'
  duration: { type: Number, required: true }, // duration in hours
  totalCost: { type: Number, required: true },
  status: { type: String, default: 'booked', enum: ['booked', 'completed', 'cancelled'] },
  createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', BookingSchema);
export default Booking;
