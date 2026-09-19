import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { Clock, Navigation, AlertTriangle } from 'lucide-react-native';

import { useTheme } from '@/hooks/use-theme';

interface LocationCardProps {
  location: any;
  onSelect: (loc: any) => void;
  isNearest?: boolean;
}

export default function LocationCard({ location, onSelect, isNearest }: LocationCardProps) {
  const freeSlots =
    location.availableSlots !== null && location.availableSlots !== undefined
      ? location.availableSlots
      : (location.totalSlots || 0) - (location.bookedSlots || 0);

  const isSharda =
    (location.parkingName || '').toLowerCase().includes('sharda') ||
    (location.address || '').toLowerCase().includes('sharda');

  const isNoOnlineBooking = !isSharda;

  const priceDisplay =
    location.hourlyPrice !== null && location.hourlyPrice !== undefined && location.hourlyPrice > 0
      ? `Rs. ${location.hourlyPrice}/hr`
      : location.status === 'Pending'
      ? 'Under Review'
      : 'Flat / N/A';

  const colors = useTheme();

  const handleNavigate = () => {
    const lat = location.latitude || 28.4727;
    const lon = location.longitude || 77.4827;
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lon}`,
      android: `google.navigation:q=${lat},${lon}`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
    });
    Linking.openURL(url).catch(() => {
      if (typeof window !== 'undefined') window.open(url, '_blank');
    });
  };

  return (
    <View
      style={[
        styles.locationCard,
        {
          backgroundColor: 'rgba(21, 22, 30, 0.65)',
          borderColor: isNearest ? 'rgba(255, 206, 0, 0.3)' : 'rgba(255, 255, 255, 0.06)',
        },
      ]}
    >
      <View style={styles.locationInfo}>
        <Text style={[styles.locationName, { color: colors.text }]}>{location.parkingName}</Text>
        <Text style={[styles.locationAddress, { color: colors.textSecondary }]}>{location.address}</Text>

        {isNoOnlineBooking && (
          <View style={styles.noticeBanner}>
            <AlertTriangle size={12} color="#ffad00" style={{ marginRight: 4, marginTop: 1 }} />
            <Text style={styles.noticeText}>
              NOT ONLINE BOOKING: On-site entry only. Use Navigate for GPS directions.
            </Text>
          </View>
        )}

        <View style={styles.badgeRow}>
          {isNearest ? (
            <View style={[styles.pillBadge, { backgroundColor: 'rgba(0, 204, 106, 0.05)', borderColor: 'rgba(0, 204, 106, 0.15)' }]}>
              <Text style={[styles.pillText, { color: '#00cc6a' }]}>Nearest ({location.distance !== undefined ? location.distance.toFixed(1) : '0.0'} km)</Text>
            </View>
          ) : (
            location.distance !== undefined && (
              <View style={styles.pillBadge}>
                <Text style={styles.pillText}>{location.distance.toFixed(1)} km away</Text>
              </View>
            )
          )}

          {isNoOnlineBooking ? (
            <View style={[styles.pillBadge, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
              <AlertTriangle size={11} color="#ffad00" />
              <Text style={[styles.pillText, { color: '#ffad00' }]}>Not Online Booking</Text>
            </View>
          ) : (
            <View style={styles.pillBadge}>
              <Clock size={12} color="#ffce00" />
              <Text style={styles.pillText}>{location.availableSlots === null ? 'TBD' : `${freeSlots} Free`}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.locationAction}>
        <Text style={[styles.priceText, isNoOnlineBooking && { color: '#ffad00', fontSize: 13 }]}>
          {isNoOnlineBooking ? 'Not Online Booking' : priceDisplay}
        </Text>
        {isNoOnlineBooking ? (
          <TouchableOpacity
            style={styles.navigateBtn}
            onPress={handleNavigate}
            activeOpacity={0.85}
          >
            <Navigation size={13} color="#0b0c10" />
            <Text style={styles.navigateBtnText}>Navigate</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.selectBtn}
            onPress={() => onSelect(location)}
            activeOpacity={0.85}
          >
            <Text style={styles.selectBtnText}>Book Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  locationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    shadowColor: '#ffce00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  locationInfo: {
    flex: 1,
    marginRight: 12,
  },
  locationName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  locationAddress: {
    color: '#a0aab2',
    fontSize: 12,
    marginTop: 5,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 206, 0, 0.06)',
    borderColor: 'rgba(255, 206, 0, 0.15)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pillText: {
    color: '#ffce00',
    fontSize: 11,
    fontWeight: 'bold',
  },
  locationAction: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  priceText: {
    color: '#ffce00',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  selectBtn: {
    backgroundColor: '#ffce00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#ffce00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  selectBtnText: {
    color: '#0b0c10',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  navigateBtn: {
    backgroundColor: '#ffce00',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#ffce00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  navigateBtnText: {
    color: '#0b0c10',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  noticeText: {
    color: '#ffad00',
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
    lineHeight: 13,
  },
});
