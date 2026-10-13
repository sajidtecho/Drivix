import { apiClient } from './client';
import { Vehicle } from '../types';

export const vehicleApi = {
  getUserVehicles: async (): Promise<Vehicle[]> => {
    const res = await apiClient.get<Vehicle[]>('/vehicles');
    return res.data;
  },

  addVehicle: async (data: { plate: string; model: string; type?: string; isEV?: boolean }): Promise<Vehicle> => {
    const res = await apiClient.post<Vehicle>('/vehicles', data);
    return res.data;
  },

  deleteVehicle: async (id: string): Promise<any> => {
    const res = await apiClient.delete(`/vehicles/${id}`);
    return res.data;
  },

  setPrimaryVehicle: async (id: string): Promise<any> => {
    const res = await apiClient.put(`/vehicles/${id}/primary`);
    return res.data;
  },
};
