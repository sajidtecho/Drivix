/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import * as Location from 'expo-location';

// Safely require react-native-maps conditionally to prevent web crashes
let MapView: any;
let Marker: any;
let UrlTile: any;
try {
  if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    UrlTile = Maps.UrlTile;
  }
} catch {
  console.warn('react-native-maps not available, falling back');
}

interface RadarMapProps {
  locations: any[];
  onSelectLocation: (loc: any) => void;
}

export default function RadarMap({ locations, onSelectLocation }: RadarMapProps) {
  const isWeb = Platform.OS === 'web';
  const [permissionStatus, setPermissionStatus] = React.useState<string | null>(null);
  const mapRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (isWeb) return;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status);
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.03,
              longitudeDelta: 0.03,
            }, 1000);
          }
        }
      } catch (err) {
        console.warn('Error fetching location:', err);
      }
    })();
  }, [isWeb]);

  if (!isWeb && MapView && Marker) {
    return (
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        mapType={Platform.OS === 'android' ? 'none' : 'standard'}
        initialRegion={{
          latitude: locations[0]?.latitude || 28.4727,
          longitude: locations[0]?.longitude || 77.4827,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={permissionStatus === 'granted'}
        showsMyLocationButton={permissionStatus === 'granted'}
      >
        {UrlTile && (
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            tileSize={256}
          />
        )}
        {locations.map((loc) => (
          <Marker
            key={loc._id}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            title={loc.parkingName}
            description={`Rs. ${loc.hourlyPrice}/hr`}
            onPress={() => onSelectLocation(loc)}
            pinColor="#ffce00"
          />
        ))}
      </MapView>
    );
  }

  // Web Google Maps iframe fallback
  const lat = locations[0]?.latitude || 28.4727;
  const lon = locations[0]?.longitude || 77.4827;
  const iframeUrl = `https://maps.google.com/maps?q=${lat},${lon}&z=14&output=embed`;

  return (
    <View style={styles.webMapContainer}>
      {React.createElement('iframe', {
        src: iframeUrl,
        style: { width: '100%', height: '100%', border: 'none' },
        title: "Google Map"
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  webMapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#15161e',
    overflow: 'hidden',
  },
});
