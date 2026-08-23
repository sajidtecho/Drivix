import { create } from 'zustand';

export interface BookingDetails {
  location?: {
    id: string;
    name: string;
    address: string;
    floors?: string[];
    pricePerHr?: number;
    [key: string]: any;
  } | null;
  floor?: string;
  bookingDate?: string;
  startTime?: string;
  duration?: number;
  usageType?: string;
}

interface BookingStoreState {
  selectedSlot: string | null;
  bookingDetails: BookingDetails;
  setSelectedSlot: (slot: string | null) => void;
  updateBookingDetails: (details: BookingDetails) => void;
  clearBooking: () => void;
}

export const useBookingStore = create<BookingStoreState>((set) => ({
  selectedSlot: null,
  bookingDetails: {},
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  updateBookingDetails: (details) => 
    set((state) => ({ bookingDetails: { ...state.bookingDetails, ...details } })),
  clearBooking: () => set({ selectedSlot: null, bookingDetails: {} })
}));
