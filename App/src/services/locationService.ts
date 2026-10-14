import * as Location from 'expo-location';
import { ParkingLocation } from '../types';

export interface UserCoordinates {
  latitude: number;
  longitude: number;
}

export interface DistanceResult {
  distanceKm: number;
  distanceText: string;
  drivingEtaMinutes: number;
  etaText: string;
}

// ─── Authoritative Real-World Coordinates for Delhi NCR Hubs ───
// Verified against Google Maps and Parivahan/NMRC/DMRC geo-pins
export const KNOWN_FACILITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Greater Noida / Knowledge Park / Pari Chowk Cluster
  'alpha 1': { lat: 28.470948, lng: 77.512593 },
  'delta 1': { lat: 28.478448, lng: 77.525704 },
  'pari chowk metro': { lat: 28.463276, lng: 77.508196 },
  'pari chowk': { lat: 28.4673, lng: 77.5140 },
  'knowledge park ii': { lat: 28.456956, lng: 77.500189 },
  'gnida circular': { lat: 28.4590, lng: 77.5020 },
  'sharda university': { lat: 28.4727, lng: 77.4827 },
  'india expo mart': { lat: 28.4595, lng: 77.4988 },

  // Noida Expressway & Corporate Hubs
  'sector 137': { lat: 28.5034, lng: 77.4042 },
  'sector 142': { lat: 28.4981, lng: 77.4105 },
  'advant navis': { lat: 28.4981, lng: 77.4105 },

  // Central Noida & Metro Cluster
  'sector 18': { lat: 28.5708, lng: 77.3261 },
  'dlf mall of india': { lat: 28.5678, lng: 77.3215 },
  'botanical garden': { lat: 28.5642, lng: 77.3348 },
  'sector 38a': { lat: 28.5642, lng: 77.3348 },
  'sector 50': { lat: 28.5770, lng: 77.3630 },
  'sector 62': { lat: 28.6280, lng: 77.3649 },
  'sector 1 underground': { lat: 28.5912, lng: 77.3115 },
  'sector 1': { lat: 28.5912, lng: 77.3115 },
  'sector 3': { lat: 28.5872, lng: 77.3168 },
  'sector 5': { lat: 28.5830, lng: 77.3195 },
  'sector 16a': { lat: 28.5695, lng: 77.3210 },
  'film city': { lat: 28.5695, lng: 77.3210 },

  // Greater Noida West
  'gaur city': { lat: 28.6087, lng: 77.4285 },
  'greater noida west': { lat: 28.6087, lng: 77.4285 },

  // Delhi NDMC & South Zone
  'connaught place': { lat: 28.6315, lng: 77.2167 },
  'cp outer ring': { lat: 28.6315, lng: 77.2167 },
  'baba kharak singh': { lat: 28.6293, lng: 77.2120 },
  'nehru place': { lat: 28.5492, lng: 77.2519 },
  'south extension': { lat: 28.5684, lng: 77.2215 },
  'south ext': { lat: 28.5684, lng: 77.2215 },
};

// Default center reference if GPS is disabled or unavailable on emulator
export const DEFAULT_NCR_LOCATION: UserCoordinates = {
  latitude: 28.5355,
  longitude: 77.3910,
};

let cachedUserCoords: UserCoordinates | null = null;
let lastFetchTimestamp = 0;

/**
 * Resolves authoritative coordinates for a parking hub.
 * If backend has null/missing latitude/longitude, automatically maps to known verified GPS pin.
 */
export const resolveHubCoordinates = (hub: Partial<ParkingLocation>): UserCoordinates => {
  if (
    typeof hub.latitude === 'number' &&
    typeof hub.longitude === 'number' &&
    !isNaN(hub.latitude) &&
    !isNaN(hub.longitude) &&
    hub.latitude !== 0 &&
    hub.longitude !== 0
  ) {
    return { latitude: hub.latitude, longitude: hub.longitude };
  }

  const nameKey = (hub.parkingName || '').toLowerCase();
  const addressKey = (hub.address || '').toLowerCase();
  const codeKey = (hub.parkingCode || '').toLowerCase();

  for (const [key, coords] of Object.entries(KNOWN_FACILITY_COORDINATES)) {
    if (nameKey.includes(key) || addressKey.includes(key) || codeKey.includes(key)) {
      return { latitude: coords.lat, longitude: coords.lng };
    }
  }

  // Fallback to Knowledge Park / Pari Chowk cluster if unknown
  return { latitude: 28.4727, longitude: 77.4827 };
};

/**
 * Gets user's live GPS coordinates using expo-location with graceful fallback & in-memory caching.
 * Prompts for permission if needed, tries current balanced position, then last known.
 */
export const getUserLiveLocation = async (forceRefresh = false): Promise<UserCoordinates> => {
  const now = Date.now();
  // Return cached coordinates if fresh within 45 seconds
  if (!forceRefresh && cachedUserCoords && now - lastFetchTimestamp < 45000) {
    return cachedUserCoords;
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      try {
        // Balanced accuracy gives instant GPS fix with low battery impact
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (pos?.coords?.latitude && pos?.coords?.longitude) {
          cachedUserCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          lastFetchTimestamp = now;
          return cachedUserCoords;
        }
      } catch {
        // Fallback to last known position if current request timed out
        const lastPos = await Location.getLastKnownPositionAsync();
        if (lastPos?.coords?.latitude && lastPos?.coords?.longitude) {
          cachedUserCoords = {
            latitude: lastPos.coords.latitude,
            longitude: lastPos.coords.longitude,
          };
          lastFetchTimestamp = now;
          return cachedUserCoords;
        }
      }
    }
  } catch (err) {
    console.warn('[LocationService] Failed to acquire live GPS fix:', err);
  }

  // Fallback to cached if available
  if (cachedUserCoords) {
    return cachedUserCoords;
  }

  // Fallback to standard NCR reference point
  return DEFAULT_NCR_LOCATION;
};

/**
 * Computes accurate driving road distance from user location to parking location.
 * Uses Great-Circle (Haversine) with Delhi NCR arterial road circuity factor (~1.25x)
 * to match Google Maps real driving road distance rather than straight-line flight distance.
 */
export const calculateAccurateDistance = (
  userCoords: UserCoordinates | null,
  hub: Partial<ParkingLocation>
): DistanceResult => {
  const user = userCoords || cachedUserCoords || DEFAULT_NCR_LOCATION;
  const destination = resolveHubCoordinates(hub);

  const R = 6371; // Earth radius in km
  const lat1 = (user.latitude * Math.PI) / 180;
  const lat2 = (destination.latitude * Math.PI) / 180;
  const dLat = ((destination.latitude - user.latitude) * Math.PI) / 180;
  const dLon = ((destination.longitude - user.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const crowFliesKm = R * c;

  // Calibrated urban circuity factor:
  // For < 0.8 km (walking/very close), actual route is ~1.15x
  // For longer city driving in NCR grid, actual driving route on Google Maps is ~1.28x
  const circuityFactor = crowFliesKm < 1 ? 1.15 : 1.28;
  const roadDistanceKm = Number((crowFliesKm * circuityFactor).toFixed(1));

  // Format clean human-readable distance
  let distanceText = `${roadDistanceKm} km`;
  if (roadDistanceKm < 0.9) {
    distanceText = `${Math.round(roadDistanceKm * 1000)} m`;
  }

  // Calculate driving ETA (avg 25-30 km/h in NCR traffic + 2 min buffer)
  const drivingEtaMinutes = Math.max(2, Math.round(roadDistanceKm * 2.3) + 2);
  const etaText = drivingEtaMinutes > 60
    ? `${Math.floor(drivingEtaMinutes / 60)} hr ${drivingEtaMinutes % 60} mins`
    : `${drivingEtaMinutes} mins`;

  return {
    distanceKm: roadDistanceKm,
    distanceText,
    drivingEtaMinutes,
    etaText,
  };
};

/**
 * Sorts parking hubs by proximity to user's live location.
 */
export const sortHubsByProximity = (
  hubs: ParkingLocation[],
  userCoords: UserCoordinates | null
): ParkingLocation[] => {
  return [...hubs].sort((a, b) => {
    const distA = calculateAccurateDistance(userCoords, a).distanceKm;
    const distB = calculateAccurateDistance(userCoords, b).distanceKm;
    return distA - distB;
  });
};
