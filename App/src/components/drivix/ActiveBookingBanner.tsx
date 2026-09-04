import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Linking, Alert } from 'react-native';
import { MapPin, ArrowRight, Navigation, Camera } from 'lucide-react-native';
import { Booking } from '@/types/booking';

interface ActiveBookingBannerProps {
  activeBooking: Booking;
  timeLeft: string;
  onPressPass: () => void;
  colors: any;
}

export const ActiveBookingBanner: React.FC<ActiveBookingBannerProps> = ({
  activeBooking,
  timeLeft,
  onPressPass,
  colors,
}) => {
  if (!activeBooking) return null;

  const handleNavigateToGate = () => {
    const lat = (activeBooking as any).locationId?.latitude;
    const lon = (activeBooking as any).locationId?.longitude;
    if (lat !== undefined && lon !== undefined) {
      const url = Platform.select({
        ios: `maps://app?daddr=${lat},${lon}`,
        android: `google.navigation:q=${lat},${lon}`,
        default: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
      });
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Unable to launch maps application.');
      });
    } else {
      Alert.alert('Navigation Info', `Navigating to ${activeBooking.locationName} ANPR Gate...`);
    }
  };

  const slotBadgeText = activeBooking.slotNumber || (activeBooking as any).slotId ? `Slot ${(activeBooking as any).slotNumber || (activeBooking as any).slotId}` : 'Slot Assigned';
  const floorText = (activeBooking as any).floor ? `Floor ${(activeBooking as any).floor}` : 'Floor 1';

  return (
    <View style={[styles.activeBookingCard, { backgroundColor: colors.surface, borderColor: 'rgba(0, 204, 106, 0.3)' }]}>
      <View style={styles.activeHeaderRow}>
        <View style={styles.badgeRow}>
          <View style={styles.activeBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.activeBadgeText}>ACTIVE RESERVATION</Text>
          </View>
          <View style={styles.anprBadge}>
            <Camera size={11} color="#38bdf8" />
            <Text style={styles.anprBadgeText}>ANPR GATE READY</Text>
          </View>
        </View>
        <Text style={styles.timerText}>
          {timeLeft === 'EXPIRED' ? 'Expired' : `Time Remaining: ${timeLeft}`}
        </Text>
      </View>

      <View style={styles.activeDetailsRow}>
        <MapPin size={22} color="#00cc6a" />
        <View style={styles.activeInfo}>
          <Text style={[styles.activeLocationName, { color: colors.text }]}>
            {activeBooking.locationName}
          </Text>
          <Text style={[styles.activeSubText, { color: colors.subtext }]}>
            {activeBooking.vehicleNumber} • {floorText} • {slotBadgeText}
          </Text>
        </View>

        <View style={styles.actionsGroup}>
          <TouchableOpacity style={styles.navButton} onPress={handleNavigateToGate}>
            <Navigation size={13} color="#00cc6a" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.passButton} onPress={onPressPass}>
            <Text style={styles.passButtonText}>Pass</Text>
            <ArrowRight size={13} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  activeBookingCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#00cc6a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 204, 106, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00cc6a',
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00cc6a',
    letterSpacing: 0.4,
  },
  anprBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  anprBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.4,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00cc6a',
  },
  activeDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeInfo: {
    flex: 1,
  },
  activeLocationName: {
    fontSize: 15,
    fontWeight: '700',
  },
  activeSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 204, 106, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00cc6a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  passButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
});

export default ActiveBookingBanner;
