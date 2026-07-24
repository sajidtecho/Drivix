import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Clock } from 'lucide-react-native';

import { useTheme } from '@/hooks/use-theme';

interface LocationCardProps {
  location: any;
  onSelect: (loc: any) => void;
  isNearest?: boolean;
}

export default function LocationCard({ location, onSelect, isNearest }: LocationCardProps) {
  const freeSlots = location.totalSlots - (location.bookedSlots || 0);
  const colors = useTheme();

  return (
    <View style={[styles.locationCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
      <View style={styles.locationInfo}>
        <Text style={[styles.locationName, { color: colors.text }]}>{location.parkingName}</Text>
        <Text style={[styles.locationAddress, { color: colors.textSecondary }]}>{location.address}</Text>
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
          <View style={styles.pillBadge}>
            <Clock size={12} color="#ffce00" />
            <Text style={styles.pillText}>{freeSlots} Free</Text>
          </View>
        </View>
      </View>
      <View style={styles.locationAction}>
        <Text style={styles.priceText}>Rs. {location.hourlyPrice}/hr</Text>
        <TouchableOpacity style={styles.selectBtn} onPress={() => onSelect(location)}>
          <Text style={styles.selectBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  locationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(21, 22, 30, 0.75)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  locationInfo: {
    flex: 1,
    marginRight: 12,
  },
  locationName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationAddress: {
    color: '#a0aab2',
    fontSize: 12,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 206, 0, 0.05)',
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
    fontSize: 15,
  },
  selectBtn: {
    backgroundColor: '#ffce00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#ffce00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  selectBtnText: {
    color: '#0b0c10',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
