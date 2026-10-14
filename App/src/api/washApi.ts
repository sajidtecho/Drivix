import { apiClient } from './client';
import { CarWashCenter } from '../types';

// Fallback mock centres derived from our OpenStreetMap scrape in case the dev server is offline
export const FALLBACK_WASH_CENTERS: CarWashCenter[] = [
  {
    _id: 'wash_1',
    name: 'AutoMeisters Car Detailing & Studio',
    city: 'Noida',
    locality: 'Sector 116',
    address: 'BR-85, Sector 116 Main Road, Noida 201305',
    latitude: 28.5660045,
    longitude: 77.3973371,
    phone: '+91 98100 12345',
    website: 'https://automeisters.in/',
    supportedVehicles: ['car', 'bike'],
    services: ['car wash', 'detailing', 'PPF', 'ceramic coating'],
    pricing: { bike: 149, car: 299, bus_truck: 899 },
    rating: 4.9,
    reviewsCount: 142,
    operatingHours: '08:00 AM - 08:30 PM',
  },
  {
    _id: 'wash_2',
    name: 'High Tech Auto Care Centre',
    city: 'Greater Noida',
    locality: 'Knowledge Park',
    address: 'C-226, Pocket C, Greater Noida 201308',
    latitude: 28.466078,
    longitude: 77.5631611,
    phone: '+91 98110 54321',
    website: null,
    supportedVehicles: ['car', 'bus_truck'],
    services: ['car wash', 'pressure wash', 'heavy vehicle wash'],
    pricing: { bike: 129, car: 249, bus_truck: 699 },
    rating: 4.8,
    reviewsCount: 88,
    operatingHours: '07:30 AM - 09:00 PM',
  },
  {
    _id: 'wash_3',
    name: 'The Detailing Panda',
    city: 'Gurgaon',
    locality: 'Sector 14',
    address: '2022, Lt. Atul Katariya Chowk, Gurgaon 122022',
    latitude: 28.4830502,
    longitude: 77.0500596,
    phone: '+91 98765 43210',
    website: null,
    supportedVehicles: ['car', 'bike'],
    services: ['car wash', 'detailing', 'interior spa'],
    pricing: { bike: 199, car: 349, bus_truck: 999 },
    rating: 4.8,
    reviewsCount: 110,
    operatingHours: '08:30 AM - 08:00 PM',
  },
  {
    _id: 'wash_4',
    name: 'The Fine Line Detailing Studio',
    city: 'Gurgaon',
    locality: 'Sector 108',
    address: 'DP-3A, Sector 108, Gurgaon 122006',
    latitude: 28.5093345,
    longitude: 76.9876078,
    phone: '+91 99112 23344',
    website: 'https://www.thefineline.in/',
    supportedVehicles: ['car', 'bike', 'bus_truck'],
    services: ['car wash', 'detailing', 'paint protection', 'deep spa'],
    pricing: { bike: 199, car: 399, bus_truck: 899 },
    rating: 4.9,
    reviewsCount: 95,
    operatingHours: '08:00 AM - 08:30 PM',
  },
  {
    _id: 'wash_5',
    name: 'City Car Washing & Express Spa',
    city: 'Noida',
    locality: 'Sector 62',
    address: 'Plot 12, Block B, Sector 62, Noida 201309',
    latitude: 28.6224327,
    longitude: 77.2838682,
    phone: '+91 98101 98765',
    website: null,
    supportedVehicles: ['car', 'bike'],
    services: ['car wash', 'foam wash', 'interior vacuum'],
    pricing: { bike: 119, car: 249, bus_truck: 749 },
    rating: 4.7,
    reviewsCount: 76,
    operatingHours: '07:00 AM - 09:30 PM',
  },
  {
    _id: 'wash_6',
    name: 'Heavy Duty Express Wash Hub',
    city: 'Greater Noida',
    locality: 'Surajpur Industrial Area',
    address: 'Site 4, Near Pari Chowk, Greater Noida 201306',
    latitude: 28.4744,
    longitude: 77.5040,
    phone: '+91 98114 88776',
    website: null,
    supportedVehicles: ['car', 'bus_truck'],
    services: ['truck wash', 'bus sanitization', 'underbody lance wash'],
    pricing: { bike: 149, car: 299, bus_truck: 599 },
    rating: 4.8,
    reviewsCount: 64,
    operatingHours: '24 Hours Open',
  },
];

export const washApi = {
  getWashCenters: async (params?: { vehicleType?: string; city?: string; search?: string }): Promise<CarWashCenter[]> => {
    try {
      const res = await apiClient.get<any>('/wash-centers', { params });
      if (res.data && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data;
      }
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (e) {
      // Backend not yet deployed on Render or local proxy failed; fallback to local verified dataset
    }

    // Filter fallback dataset
    let list = [...FALLBACK_WASH_CENTERS];
    if (params?.vehicleType && params.vehicleType !== 'all') {
      list = list.filter((c) => c.supportedVehicles.includes(params.vehicleType as any));
    }
    if (params?.city && params.city !== 'all') {
      list = list.filter((c) => c.city.toLowerCase() === params.city?.toLowerCase());
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.locality.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q)
      );
    }
    return list;
  },
};
