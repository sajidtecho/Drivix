import { apiClient } from './client';
import { Booking, SlotAllocationResult } from '../types';

export interface CreateBookingPayload {
  bookingId?: string;
  name: string;
  mobile: string;
  vehicleNumber: string;
  vehicleName: string;
  vehicleId?: string;
  parkingHubId: string;
  floorId: string;
  bookingDate: string;
  startTime: string;
  duration: number;
  totalCost: number;
  paymentMode: 'PAY_NOW' | 'PAY_AFTER_CHECKOUT';
  locationId?: string;
  locationName?: string;
  floor?: string;
  entryDate?: string;
  entryTime?: string;
  additionalServices?: string[];
  servicesCost?: number;
}

export const bookingApi = {
  createBooking: async (payload: CreateBookingPayload): Promise<Booking> => {
    const res = await apiClient.post<Booking>('/bookings', payload);
    return res.data;
  },

  getMyBookings: async (): Promise<Booking[]> => {
    const res = await apiClient.get<Booking[]>('/bookings/my');
    return res.data;
  },

  getBookingById: async (id: string): Promise<Booking> => {
    const all = await bookingApi.getMyBookings();
    const found = all.find((b) => b._id === id || b.bookingId === id);
    if (!found) {
      throw new Error('Booking not found');
    }
    return found;
  },

  assignSlot: async (bookingId: string): Promise<SlotAllocationResult> => {
    const res = await apiClient.post<SlotAllocationResult>(`/bookings/${bookingId}/assign-slot`);
    return res.data;
  },

  confirmArrival: async (bookingId: string, action: 'yes' | 'delay' | 'cancel' = 'yes'): Promise<any> => {
    const res = await apiClient.post(`/bookings/${bookingId}/arrival-confirmation`, { action });
    return res.data;
  },

  extendBooking: async (bookingId: string, additionalHours: number, additionalCost?: number): Promise<Booking> => {
    const res = await apiClient.put<Booking>(`/bookings/${bookingId}/extend`, {
      additionalHours,
      additionalCost: additionalCost || 0,
    });
    return res.data;
  },

  vacateBooking: async (bookingId: string, paymentMethod: 'wallet' | 'cash' | 'card' | 'online' = 'online'): Promise<any> => {
    const res = await apiClient.put(`/bookings/${bookingId}/vacate`, { paymentMethod });
    return res.data;
  },

  calculateBill: async (bookingId: string): Promise<any> => {
    const res = await apiClient.get(`/bookings/${bookingId}/calculate-bill`);
    return res.data;
  },

  cancelBooking: async (bookingId: string, reason?: string): Promise<any> => {
    const res = await apiClient.put(`/bookings/${bookingId}/cancel`, { reason });
    return res.data;
  },
};
