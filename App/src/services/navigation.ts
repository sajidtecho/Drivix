import { Platform, Linking, Alert } from 'react-native';
import * as Location from 'expo-location';

interface NavigationParams {
  latitude: number;
  longitude: number;
  locationName?: string;
}

/**
 * Launches live GPS turn-by-turn navigation directly from the user's current live location
 * to the destination parking facility on mobile, eliminating location search prompts.
 */
export const launchMobileLiveGpsNavigation = async ({ latitude, longitude, locationName }: NavigationParams) => {
  const lat = latitude || 28.4727;
  const lon = longitude || 77.4827;

  let originStr = 'Current+Location';

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (pos?.coords?.latitude && pos?.coords?.longitude) {
        originStr = `${pos.coords.latitude},${pos.coords.longitude}`;
      }
    }
  } catch (err) {
    console.warn('Expo location fetch fallback to Current Location:', err);
  }

  const googleMapsDirUrl = `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${lat},${lon}&travelmode=driving`;

  const url = Platform.select({
    ios: `maps://app?saddr=${originStr}&daddr=${lat},${lon}&dirflg=d`,
    android: `google.navigation:q=${lat},${lon}&mode=d`,
    default: googleMapsDirUrl,
  });

  Linking.openURL(url || googleMapsDirUrl).catch(() => {
    Linking.openURL(googleMapsDirUrl).catch(() => {
      if (typeof window !== 'undefined') window.open(googleMapsDirUrl, '_blank');
    });
  });
};
