import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MapPin, ArrowRight } from 'lucide-react-native';
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

  return (
    <View style={[styles.activeBookingCard, { backgroundColor: colors.surface, borderColor: 'rgba(0, 204, 106, 0.3)' }]}>
      <View style={styles.activeHeaderRow}>
        <View style={styles.activeBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.activeBadgeText}>ACTIVE RESERVATION</Text>
        </View>
        <Text style={styles.timerText}>
          {timeLeft === 'EXPIRED' ? 'Expired' : `Time Remaining: ${timeLeft}`}
        </Text>
      </View>

      <View style={styles.activeDetailsRow}>
        <MapPin size={20} color="#00cc6a" />
        <View style={styles.activeInfo}>
          <Text style={[styles.activeLocationName, { color: colors.text }]}>
            {activeBooking.locationName}
          </Text>
          <Text style={[styles.activeSubText, { color: colors.subtext }]}>
            Vehicle: {activeBooking.vehicleNumber} {activeBooking.slotNumber ? `• Slot: ${activeBooking.slotNumber}` : ''}
          </Text>
        </View>

        <TouchableOpacity style={styles.passButton} onPress={onPressPass}>
          <Text style={styles.passButtonText}>View QR</Text>
          <ArrowRight size={14} color="#000" />
        </TouchableOpacity>
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
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 204, 106, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00cc6a',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00cc6a',
    letterSpacing: 0.5,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00cc6a',
  },
  activeDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  passButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00cc6a',
    paddingHorizontal: 14,
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
