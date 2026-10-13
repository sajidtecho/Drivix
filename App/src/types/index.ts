export type BookingStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Slot Assigned'
  | 'Checked In'
  | 'Checked Out'
  | 'Cancelled'
  | 'Expired'
  | 'completed'
  | 'booked';

export { WizardStep } from './booking';
export { DocumentComplianceStatus } from './user';

export interface User {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  phone?: string;
  role?: string;
  walletBalance?: number;
  documents?: Array<{
    type: string;
    documentNumber?: string;
    expiryDate?: string;
    verified?: boolean;
  }>;
}

export interface Vehicle {
  _id: string;
  userId?: string;
  plate?: string;
  vehicleNumber?: string;
  model?: string;
  vehicleName?: string;
  type?: 'Car' | 'Bike' | 'SUV' | 'EV';
  isPrimary?: boolean;
  isEV?: boolean;
}

export interface ParkingLocation {
  _id: string;
  parkingName: string;
  parkingCode?: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  totalFloors?: number;
  totalSlots: number;
  availableSlots: number;
  hourlyPrice: number;
  openingTime?: string;
  closingTime?: string;
  amenities?: string[];
  images?: string[];
  floors?: string[];
  status?: 'Active' | 'Inactive' | 'Pending';
  distanceKm?: number;
}

export interface ParkingFloor {
  _id: string;
  parkingHubId: string;
  floorName: string;
  totalSlots: number;
  availableSlots: number;
  evSlots?: number;
  accessibilitySlots?: number;
  active?: boolean;
}

export interface ParkingSlot {
  _id: string;
  facilityId: string;
  floorId?: string;
  id: string;
  slotNumber?: string;
  floor: string;
  status: 'available' | 'occupied' | 'temporarily_reserved' | 'reserved' | 'maintenance';
  CurrentStatus: 'Available' | 'Occupied' | 'Reserved';
  vehicleType?: string;
  EVSupported?: boolean;
  Accessibility?: boolean;
}

export interface DynamicPriceQuote {
  basePrice: number;
  recommendedPrice: number;
  multiplier: number;
  pricingAlert: string;
  discountSuggestion?: string;
  peakHourAlert?: boolean;
  isSurgeActive: boolean;
  currentOccupancy: number;
  predictedOccupancy: number;
  demandScore: number;
  mlPowered: boolean;
  modelVersion?: string;
}

export interface Booking {
  _id: string;
  bookingId?: string;
  userId?: string;
  name?: string;
  mobile?: string;
  vehicleNumber?: string;
  vehicleName?: string;
  parkingHubId?: string | { _id: string; parkingName: string; address: string; latitude?: number; longitude?: number };
  facilityId?: any;
  hubName?: string;
  floorId?: string | { _id: string; floorName: string };
  floor?: string;
  floorName?: string;
  floorNumber?: number;
  locationId?: string | { _id: string; parkingName: string; address: string };
  locationName?: string;
  bookingDate?: string;
  entryDate?: string;
  startTime?: string;
  endTime?: string;
  entryTime?: string;
  duration?: number;
  totalCost?: number;
  totalAmount?: number;
  basePrice?: number;
  finalCost?: number;
  status: BookingStatus | string;
  slotId?: any;
  slotRefId?: string | null;
  slotNumber?: string;
  qrToken?: string | null;
  paymentMode?: 'PAY_NOW' | 'PAY_AFTER_CHECKOUT' | string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | string;
  prepaidAmount?: number;
  actualEntryTime?: string | null;
  actualExitTime?: string | null;
  additionalServices?: string[];
  servicesCost?: number;
  createdAt?: string;
}

export interface SlotAllocationResult {
  success: boolean;
  bookingId: string;
  slotId: string;
  slotNumber: string;
  floorName: string;
  status: string;
  assignedAt: string;
  qrToken?: string;
  booking?: Booking;
  message?: string;
}

export type RootScreen =
  | 'Home'
  | 'ParkingDiscovery'
  | 'ParkingDetail'
  | 'FloorSelection'
  | 'DurationSelection'
  | 'VehicleSelection'
  | 'BookingReview'
  | 'BookingConfirmation'
  | 'Navigation'
  | 'ActiveParking'
  | 'BookingHistory'
  | 'Profile'
  | 'Login'
  | 'Register';
