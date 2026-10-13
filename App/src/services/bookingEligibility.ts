import { ParkingLocation } from '../types';

/**
 * Determines whether a parking facility allows online reservations/booking.
 * Returns false for offline/on-site only facilities like metro lots without online gates
 * (e.g. Knowledge Park II Metro Station, inactive authority MLCPs, 0 total slots).
 */
export const checkIsOnlineBookingAllowed = (location?: ParkingLocation | null): boolean => {
  if (!location) return false;

  // 1. Explicit allowOnlineBooking boolean from backend schema or frontend mock
  if ((location as any).allowOnlineBooking === false || (location as any).isOnlineBooking === false) {
    return false;
  }

  // 2. Offline / unverified total slots (0 or null or undefined)
  if (
    location.totalSlots === 0 ||
    location.totalSlots === null ||
    location.totalSlots === undefined
  ) {
    return false;
  }

  // 3. Inactive facility status
  if (location.status === 'Inactive') {
    return false;
  }

  // 4. Name matches known offline / on-site only facilities
  const name = (location.parkingName || (location as any).name || '').toLowerCase();
  if (name.includes('knowledge park ii metro') || name.includes('knowledge park 2 metro')) {
    return false;
  }

  // 5. Offline tags in amenities
  if (
    Array.isArray(location.amenities) &&
    location.amenities.some((a) => typeof a === 'string' && a.toLowerCase().includes('offline'))
  ) {
    return false;
  }

  return true;
};
