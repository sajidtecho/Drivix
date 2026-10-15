import { apiClient } from './client';
import { CarWashCenter } from '../types';

export const washApi = {
  getWashCenters: async (params?: { vehicleType?: string; city?: string; search?: string }): Promise<CarWashCenter[]> => {
    try {
      const res = await apiClient.get<any>('/wash-centers', { params });
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      if (Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } catch (e) {
      // Return empty array when no data exists or API is unreachable (no mock data)
      return [];
    }
  },
};
