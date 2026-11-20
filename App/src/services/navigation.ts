import { Platform, Linking } from 'react-native';
import * as Location from 'expo-location';
import { resolveHubCoordinates } from './locationService';

interface NavigationParams {
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string;
  address?: string;
}

/**
 * Universal, fail-safe function to launch Google Maps with turn-by-turn driving directions
 * directly to the target parking facility.
 * Works seamlessly across Android (native Google Maps app or browser), iOS, and Web.
 */
export const launchMobileLiveGpsNavigation = async ({
  latitude,
  longitude,
  locationName,
}: NavigationParams) => {
  const resolved = resolveHubCoordinates({
    latitude: latitude || undefined,
    longitude: longitude || undefined,
    parkingName: locationName,
  });
  const lat = resolved.latitude;
  const lon = resolved.longitude;

  // Attempt to retrieve user's real GPS coordinates
  let originParam = '';
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (pos?.coords?.latitude && pos?.coords?.longitude) {
        originParam = `&origin=${pos.coords.latitude},${pos.coords.longitude}`;
      }
    }
  } catch (err) {
    console.log('Location permission or GPS lookup skipped:', err);
  }

  // Universal Google Maps Direction URL (omitting origin lets Google Maps use live device GPS)
  const universalGoogleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}${originParam}&travelmode=driving`;

  // iOS-specific Google Maps app URL scheme
  const iosGoogleMapsAppUrl = `comgooglemaps://?daddr=${lat},${lon}&directionsmode=driving`;

  // Apple Maps fallback for iOS
  const appleMapsUrl = `maps://app?daddr=${lat},${lon}&dirflg=d`;

  try {
    if (Platform.OS === 'ios') {
      const canOpenGoogleMaps = await Linking.canOpenURL(iosGoogleMapsAppUrl);
      if (canOpenGoogleMaps) {
        await Linking.openURL(iosGoogleMapsAppUrl);
        return;
      }
      // Fallback to universal Google Maps web/app link
      await Linking.openURL(universalGoogleMapsUrl);
      return;
    }

    if (Platform.OS === 'android') {
      // Android App Link: Android OS automatically routes google.com/maps to the Google Maps native app
      const canOpen = await Linking.canOpenURL(universalGoogleMapsUrl);
      if (canOpen) {
        await Linking.openURL(universalGoogleMapsUrl);
        return;
      }

      // Geo intent fallback
      const geoIntentUrl = `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(locationName || 'Drivix Parking')})`;
      await Linking.openURL(geoIntentUrl);
      return;
    }

    // Default / Web
    await Linking.openURL(universalGoogleMapsUrl);
  } catch (error) {
    console.warn('Navigation launch error, falling back to browser:', error);
    // Ultimate fallback: open in browser
    try {
      await Linking.openURL(universalGoogleMapsUrl);
    } catch {
      if (typeof window !== 'undefined') {
        window.open(universalGoogleMapsUrl, '_blank');
      }
    }
  }
};

/**
 * Opens Google Maps centered on a specific area or facility pin
 */
export const openGoogleMapsLocation = async (latitude: number, longitude: number, label?: string) => {
  const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  try {
    await Linking.openURL(url);
  } catch (e) {
    console.warn('Could not open Google Maps location:', e);
  }
};
