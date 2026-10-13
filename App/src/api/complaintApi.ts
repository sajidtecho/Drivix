import { apiClient } from './client';

export interface Complaint {
  _id: string;
  userId?: string;
  bookingId?: string;
  title: string;
  description: string;
  contact?: string;
  email?: string;
  slotLocation?: string;
  complaintStatus: 'pending' | 'resolved' | 'in_progress';
  createdAt: string;
  updatedAt?: string;
}

export interface CreateComplaintPayload {
  title: string;
  description: string;
  bookingId?: string;
  contact?: string;
  email?: string;
  slotLocation?: string;
}

export const complaintApi = {
  createComplaint: async (payload: CreateComplaintPayload): Promise<Complaint> => {
    const res = await apiClient.post<Complaint>('/complaints', payload);
    return res.data;
  },

  getMyComplaints: async (): Promise<Complaint[]> => {
    const res = await apiClient.get<Complaint[]>('/complaints/my');
    return res.data;
  },
};
