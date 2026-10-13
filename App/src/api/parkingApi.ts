import { apiClient } from './client';
import { ParkingLocation, ParkingFloor, ParkingSlot, DynamicPriceQuote } from '../types';

export const parkingApi = {
  getLocations: async (): Promise<ParkingLocation[]> => {
    const res = await apiClient.get<ParkingLocation[]>('/parking');
    return res.data;
  },

  getLocationById: async (facilityId: string): Promise<ParkingLocation> => {
    const res = await apiClient.get<ParkingLocation>(`/parking`);
    const all = res.data as any;
    const found = Array.isArray(all) ? all.find((l) => l._id === facilityId) : all;
    return found;
  },

  getFloorsForLocation: async (facilityId: string): Promise<ParkingFloor[]> => {
    // The backend stores floors in ParkingFloor model linked by parkingHubId
    const res = await apiClient.get<ParkingFloor[]>('/parking/floor/live-capacity', {
      params: { parkingHubId: facilityId }
    });
    return res.data;
  },

  getFloorAvailability: async (floorId: string): Promise<any> => {
    const res = await apiClient.get(`/parking/floors/${floorId}/availability`);
    return res.data;
  },

  getSlots: async (facilityId: string): Promise<ParkingSlot[]> => {
    const res = await apiClient.get<ParkingSlot[]>(`/parking/${facilityId}/slots`);
    return res.data;
  },

  getPricingRecommendation: async (
    facilityId: string,
    params?: {
      durationHours?: number;
      weather?: string;
      isHoliday?: boolean;
      nearbyEvent?: boolean;
    }
  ): Promise<DynamicPriceQuote> => {
    const res = await apiClient.get<DynamicPriceQuote>(`/parking/${facilityId}/pricing`, { params });
    return res.data;
  },
};
