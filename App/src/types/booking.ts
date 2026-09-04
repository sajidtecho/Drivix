export type WizardStep = 'MAP' | 'SLOTS' | 'CHECKOUT' | 'PASS' | 'PARKING_HUBS' | 'DRIVER_HUB' | 'CHALLAN';

export interface ParkingSlot {
  id: string;
  _id?: string;
  slotNumber: string;
  floorId: string;
  status: 'available' | 'reserved' | 'occupied' | 'temporarily_reserved';
  isEVCharger?: boolean;
  isAccessible?: boolean;
  pricePerHour: number;
}

export interface ParkingFloor {
  id: string;
  floorNumber: string | number;
  name: string;
  totalSlots: number;
  availableSlots: number;
  slots: ParkingSlot[];
}

export interface ParkingLocation {
  id: string;
  _id?: string;
  name: string;
  address: string;
  city: string;
  rating: number;
  pricePerHour: number;
  totalSlots: number;
  availableSlots: number;
  distance: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  amenities?: string[];
  imageUrl?: string;
  floors?: ParkingFloor[];
}

export interface Booking {
  id: string;
  _id?: string;
  bookingId: string;
  locationId: string;
  parkingHubId?: string;
  locationName: string;
  slotId?: string;
  slotNumber?: string;
  floorId?: string;
  vehicleNumber: string;
  vehicleName?: string;
  entryDate: string; // YYYY-MM-DD
  entryTime: string; // HH:mm
  durationHours: number;
  duration?: number;
  totalAmount: number;
  status: 'booked' | 'Checked In' | 'Checked Out' | 'Expired' | 'Cancelled';
  qrCodeToken?: string;
  createdAt?: string;
  arrivalConfirmed?: boolean;
}
