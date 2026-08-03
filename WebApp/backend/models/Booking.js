import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true }, // e.g. DRX-XXXXXX
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  vehicleName: { type: String, required: true },
  
  // New Architecture Fields
  parkingHubId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingLocation', required: true },
  floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingFloor', required: true },
  bookingDate: { type: String, required: true }, // e.g. '2026-07-11'
  startTime: { type: String, required: true }, // e.g. '12:30'
  endTime: { type: String, required: true }, // e.g. '14:30'
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
  assignedAt: { type: Date, default: null },
  arrivalConfirmed: { type: Boolean, default: false },
  ETA: { type: Number, default: null }, // Estimated Time of Arrival in minutes

  // Legacy/Compatibility Fields
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingLocation', required: true },
  locationName: { type: String, required: true },
  slotId: { type: String, default: null }, // Nullable now!
  floor: { type: String, required: true }, // e.g. 'L1'
  entryDate: { type: String, required: true }, // e.g. '2026-07-11'
  entryTime: { type: String, required: true }, // e.g. '12:30'
  duration: { type: Number, required: true }, // duration in hours
  totalCost: { type: Number, required: true },
  paymentMode: { type: String, enum: ['PAY_NOW', 'PAY_AFTER_CHECKOUT'], default: 'PAY_AFTER_CHECKOUT' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  prepaidAmount: { type: Number, default: 0 },
  actualEntryTime: { type: Date, default: null },
  actualExitTime: { type: Date, default: null },
  finalCost: { type: Number, default: 0 },
  
  // Updated Booking Status
  status: { 
    type: String, 
    default: 'Confirmed', 
    enum: [
      'booked', 'completed', 'cancelled', // Legacy statuses
      'Pending', 'Confirmed', 'Slot Assigned', 'Checked In', 'Checked Out', 'Cancelled', 'Expired' // New statuses
    ] 
  },
  
  additionalServices: { type: [String], default: [] },
  servicesCost: { type: Number, default: 0 },
  slotRefId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', default: null },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },
  createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to synchronize new and legacy field values
BookingSchema.pre('validate', function(next) {
  // Sync locationId and parkingHubId
  if (this.parkingHubId && !this.locationId) {
    this.locationId = this.parkingHubId;
  } else if (this.locationId && !this.parkingHubId) {
    this.parkingHubId = this.locationId;
  }

  // Sync date fields
  if (this.bookingDate && !this.entryDate) {
    this.entryDate = this.bookingDate;
  } else if (this.entryDate && !this.bookingDate) {
    this.bookingDate = this.entryDate;
  }

  // Sync time fields
  if (this.startTime && !this.entryTime) {
    this.entryTime = this.startTime;
  } else if (this.entryTime && !this.startTime) {
    this.startTime = this.entryTime;
  }

  // Calculate endTime if not set
  if (this.startTime && this.bookingDate && this.duration && !this.endTime) {
    try {
      const startDateTime = new Date(`${this.bookingDate}T${this.startTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + this.duration * 60 * 60 * 1000);
      const hours = String(endDateTime.getHours()).padStart(2, '0');
      const minutes = String(endDateTime.getMinutes()).padStart(2, '0');
      this.endTime = `${hours}:${minutes}`;
    } catch (e) {
      // Fallback
      this.endTime = this.startTime;
    }
  }

  next();
});

const Booking = mongoose.model('Booking', BookingSchema);
export default Booking;
