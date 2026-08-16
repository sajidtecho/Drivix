/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { StyleSheet, View, Platform, Animated, Text, Easing } from 'react-native';
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

  // Animation values for the radar sweep and pulsing target pins
  const sweepAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(0.5)).current;

  React.useEffect(() => {
    // Infinite radar sweep rotation (4 seconds per loop)
    Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation for HUD target marks (blinks between 0.3 and 1 opacity/scale)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 1000,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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

  const rotate = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Dynamically map real coordinates/locations to percentage offsets on our radar grid
  const hudTargets = React.useMemo(() => {
    if (locations.length === 0) {
      return [
        { top: '35%', left: '42%', label: 'SHARDA_UNIV // D01', free: true },
        { top: '60%', left: '65%', label: 'GALGOTIA // D02', free: true },
      ];
    }
    return locations.map((loc, idx) => {
      // Deterministically place targets in different angles/radii for a simulated grid spread
      const angles = [0.65, 2.15, 3.85, 5.15];
      const radii = [45, 70, 90, 55];
      const angle = angles[idx % angles.length];
      const r = radii[idx % radii.length];
      
      const x = 50 + (r * Math.cos(angle)) / 2.6; // Center is 50%
      const y = 50 + (r * Math.sin(angle)) / 2.0;
      const freeSlots = loc.totalSlots - (loc.bookedSlots || 0);

      return {
        top: `${y}%`,
        left: `${x}%`,
        label: `${loc.parkingName.split(' ')[0].toUpperCase()} // ${freeSlots}F`,
        free: freeSlots > 0,
      };
    });
  }, [locations]);

  // Render the high-tech sci-fi dashboard HUD overlay
  const renderHUDOverlay = (showTargets = false) => {
    return (
      <View style={styles.hudContainer} pointerEvents="none">
        {/* Coordinate Grid lines */}
        <View style={[styles.gridLineV, { left: '25%' }]} />
        <View style={[styles.gridLineV, { left: '50%' }]} />
        <View style={[styles.gridLineV, { left: '75%' }]} />
        <View style={[styles.gridLineH, { top: '25%' }]} />
        <View style={[styles.gridLineH, { top: '50%' }]} />
        <View style={[styles.gridLineH, { top: '75%' }]} />

        {/* Concentric radar range lines */}
        <View style={styles.radarRing1} />
        <View style={styles.radarRing2} />
        <View style={styles.radarRing3} />

        {/* Glowing Center reticle */}
        <View style={styles.crosshair} />
        <View style={styles.crosshairGlow} />

        {/* Rotating Radar Scanner Sweep */}
        <Animated.View style={[styles.radarSweep, { transform: [{ rotate }] }]}>
          <View style={styles.radarSweepLine} />
          <View style={styles.radarSweepGlow} />
        </Animated.View>

        {/* Monospace telemetry displays */}
        <Text style={styles.hudTextTopLeft}>
          {`SYS_OK // RADAR_ONLINE\nLAT: ${locations[0]?.latitude.toFixed(4) || '28.4727'} | LON: ${locations[0]?.longitude.toFixed(4) || '77.4827'}`}
        </Text>

        <Text style={styles.hudTextBottomRight}>
          {`SCANNING: ACTIVE\nRANGE: 5.0 KM // HUD_MARKS: ${locations.length}`}
        </Text>

        {/* Dynamic scanning targets (only shown in fallback mock view to avoid overlapping native map UI) */}
        {showTargets && hudTargets.map((target, idx) => (
          <View key={idx} style={[styles.targetMarker, { top: target.top as any, left: target.left as any }]}>
            <Animated.View
              style={[
                styles.targetDot,
                {
                  backgroundColor: target.free ? '#00cc6a' : '#ff4b4b',
                  transform: [{ scale: pulseAnim }],
                  shadowColor: target.free ? '#00cc6a' : '#ff4b4b',
                  shadowOpacity: 0.8,
                  shadowRadius: 5,
                }
              ]}
            />
            <Text style={styles.targetLabel}>{target.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (!isWeb && MapView && Marker) {
    return (
      <View style={{ flex: 1 }}>
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
        {/* Subtle, non-obtrusive radar HUD overlay on top of active native maps */}
        {renderHUDOverlay(false)}
      </View>
    );
  }

  // Web & Offline Fallback (Renders animated simulation radar screen)
  return (
    <View style={styles.webMapContainer}>
      {renderHUDOverlay(true)}
    </View>
  );
}

const styles = StyleSheet.create({
  webMapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#07080c',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hudContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLineV: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 206, 0, 0.04)',
  },
  gridLineH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 206, 0, 0.04)',
  },
  radarRing1: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 206, 0, 0.08)',
    borderStyle: 'dashed',
  },
  radarRing2: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: 'rgba(255, 206, 0, 0.06)',
  },
  radarRing3: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: 'rgba(255, 206, 0, 0.04)',
  },
  radarSweep: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarSweepLine: {
    position: 'absolute',
    width: 100,
    height: 1.5,
    backgroundColor: 'rgba(255, 206, 0, 0.35)',
    left: '50%',
    top: '50%',
  },
  radarSweepGlow: {
    position: 'absolute',
    width: 100,
    height: 25,
    backgroundColor: 'rgba(255, 206, 0, 0.035)',
    left: '50%',
    top: '50%',
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    transform: [{ translateY: -12.5 }],
  },
  crosshair: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderColor: 'rgba(255, 206, 0, 0.3)',
    borderWidth: 1,
    borderRadius: 4,
  },
  crosshairGlow: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 206, 0, 0.08)',
  },
  hudTextTopLeft: {
    position: 'absolute',
    top: 12,
    left: 14,
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#ffce00',
    opacity: 0.75,
    fontWeight: 'bold',
    lineHeight: 12,
  },
  hudTextBottomRight: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#00f2ff',
    opacity: 0.75,
    fontWeight: 'bold',
    textAlign: 'right',
    lineHeight: 12,
  },
  targetMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    elevation: 4,
  },
  targetLabel: {
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: 3,
    backgroundColor: 'rgba(11, 12, 16, 0.88)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 206, 0, 0.15)',
    overflow: 'hidden',
  },
});

