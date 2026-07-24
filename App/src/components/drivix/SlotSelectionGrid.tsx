import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/AuthContext';

interface SlotSelectionGridProps {
  slots: any[];
  selectedSlot: any;
  onSelectSlot: (slot: any) => void;
  onBack: () => void;
  locationName: string;
}

export default function SlotSelectionGrid({
  slots,
  selectedSlot,
  onSelectSlot,
  onBack,
  locationName,
}: SlotSelectionGridProps) {
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const colors = useTheme();
  const { user } = useAuth();

  const getFloors = () => {
    const floorsSet = new Set<string>();
    slots.forEach((s) => {
      if (s.floor) floorsSet.add(s.floor);
    });
    return Array.from(floorsSet).sort();
  };

  const floors = getFloors();
  const currentFloor = selectedFloor || floors[0] || '';

  const getGroupedSlots = () => {
    const floorSlots = slots.filter((s) => s.floor === currentFloor);
    const grouped: { [key: string]: any[] } = {};
    floorSlots.forEach((s) => {
      const row = s.row || 'A';
      if (!grouped[row]) grouped[row] = [];
      grouped[row].push(s);
    });
    // Sort slots within each row by number
    Object.keys(grouped).forEach((row) => {
      grouped[row].sort((a, b) => a.number - b.number);
    });
    return grouped;
  };

  const groupedSlots = getGroupedSlots();

  return (
    <View style={styles.flexContainer}>
      {/* Sub Header */}
      <View style={styles.subHeader}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]} onPress={onBack}>
          <ChevronLeft size={20} color="#ffce00" />
        </TouchableOpacity>
        <View style={styles.subHeaderTitles}>
          <Text style={[styles.subHeaderTitle, { color: colors.text }]}>{locationName}</Text>
          <Text style={[styles.subHeaderSubtitle, { color: colors.textSecondary }]}>Select Parking Spot</Text>
        </View>
      </View>

      {/* Floor Selector */}
      {floors.length > 1 && (
        <View style={[styles.floorSwitcher, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          {floors.map((floor) => (
            <TouchableOpacity
              key={floor}
              style={[
                styles.floorBtn,
                currentFloor === floor && styles.activeFloorBtn,
              ]}
              onPress={() => setSelectedFloor(floor)}
            >
              <Text
                style={[
                  styles.floorBtnText,
                  { color: colors.textSecondary },
                  currentFloor === floor && styles.activeFloorBtnText,
                ]}
              >
                {floor}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Slots Layout Grid */}
      <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
        {/* Driveway Lane Marker */}
        <View style={styles.laneMarker}>
          <Text style={styles.laneMarkerText}>◀ DRIVEWAY ENTRY LANE ▶</Text>
        </View>

        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          {Object.keys(groupedSlots).map((row) => (
            <View key={row} style={styles.gridRow}>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{row}</Text>
              <View style={styles.rowSlots}>
                {groupedSlots[row].map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  const isBooked = slot.status === 'booked';
                  const isReserved = slot.status === 'reserved' || slot.status === 'temporarily_reserved';
                  const isReservedBySomeoneElse = slot.status === 'temporarily_reserved' &&
                                                  slot.reservedBy &&
                                                  slot.reservedBy.toString() !== user?._id?.toString();
                  const isAvailable = slot.status === 'available';

                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.slotNode,
                        isAvailable && styles.availableSlot,
                        isBooked && styles.bookedSlot,
                        (isReserved || isSelected) && styles.reservedSlot,
                      ]}
                      onPress={() => onSelectSlot(slot)}
                    >
                      <Text
                        style={[
                          styles.slotText,
                          isAvailable && styles.availableSlotText,
                          isBooked && styles.bookedSlotText,
                          (isReserved || isSelected) && styles.reservedSlotText,
                        ]}
                      >
                        {slot.number}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendIndicator, styles.availableSlot]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendIndicator, styles.bookedSlot]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Occupied</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendIndicator, styles.reservedSlot]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Reserved</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
    backgroundColor: '#15161e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  subHeaderTitles: {
    flex: 1,
  },
  subHeaderTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subHeaderSubtitle: {
    color: '#a0aab2',
    fontSize: 13,
  },
  floorSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(21, 22, 30, 0.75)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 4,
    marginBottom: 16,
  },
  floorBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeFloorBtn: {
    backgroundColor: '#ffce00',
  },
  floorBtnText: {
    color: '#a0aab2',
    fontSize: 13,
    fontWeight: '500',
  },
  activeFloorBtnText: {
    color: '#0b0c10',
    fontWeight: 'bold',
  },
  gridContainer: {
    paddingBottom: 40,
  },
  laneMarker: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 206, 0, 0.03)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 206, 0, 0.2)',
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 24,
  },
  laneMarkerText: {
    color: '#ffce00',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rowLabel: {
    color: '#a0aab2',
    fontSize: 16,
    fontWeight: 'bold',
    width: 24,
    textAlign: 'center',
  },
  rowSlots: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
  },
  slotNode: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availableSlot: {
    backgroundColor: 'rgba(0, 242, 255, 0.03)',
    borderColor: '#00f2ff',
  },
  bookedSlot: {
    backgroundColor: 'rgba(255, 75, 75, 0.03)',
    borderColor: 'rgba(255, 75, 75, 0.4)',
  },
  reservedSlot: {
    backgroundColor: 'rgba(255, 206, 0, 0.05)',
    borderColor: '#ffce00',
  },
  slotText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  availableSlotText: {
    color: '#00f2ff',
  },
  bookedSlotText: {
    color: 'rgba(255, 75, 75, 0.6)',
  },
  reservedSlotText: {
    color: '#ffce00',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
  },
  legendText: {
    color: '#a0aab2',
    fontSize: 12,
  },
});
