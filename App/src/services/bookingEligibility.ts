import { ParkingLocation } from '../types';

/**
 * Determines whether a parking facility allows online reservations/booking.
 * Returns false for offline/on-site only facilities like metro lots without online gates
 * (e.g. Knowledge Park II Metro Station, inactive authority MLCPs, 0 total slots).
 */
export const checkIsOnlineBookingAllowed = (location?: ParkingLocation | null): boolean => {
  if (!location) return false;

  // 1. Explicit allowOnlineBooking permission denial from DB schema or frontend
  if ((location as any).allowOnlineBooking === false || (location as any).isOnlineBooking === false) {
    return false;
  }

  // 2. Inactive, Pending, or Restricted facility status
  if (location.status && location.status !== 'Active') {
    return false;
  }

  // 3. Offline / unverified total slots (0 or null or undefined)
  if (
    location.totalSlots === 0 ||
    location.totalSlots === null ||
    location.totalSlots === undefined
  ) {
    return false;
  }

  // 4. Offline tags in amenities
  if (
    Array.isArray(location.amenities) &&
    location.amenities.some((a) => typeof a === 'string' && a.toLowerCase().includes('offline'))
  ) {
    return false;
  }

  // 5. Name matches known offline / on-site only transit lots
  const name = (location.parkingName || (location as any).name || '').toLowerCase();
  if (name.includes('knowledge park ii metro') || name.includes('knowledge park 2 metro') || name.includes('gnida circular')) {
    return false;
  }

  // 6. Explicit allowOnlineBooking permission from database schema
  if ((location as any).allowOnlineBooking === true) {
    return true;
  }

  // 7. Verified university / online demo facility fallback
  if (name.includes('sharda')) {
    return true;
  }

  // 8. Facilities without explicit online booking permissions default to on-site entry
  return false;
};
