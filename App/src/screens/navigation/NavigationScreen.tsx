import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Navigation,
  MapPin,
  CheckCircle2,
  Car,
  Layers,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  QrCode,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { Header, Card, Button, Badge } from '../../components/common';
import { bookingApi } from '../../api/bookingApi';
import { Booking, SlotAllocationResult } from '../../types';

export interface NavigationScreenProps {
  booking: Booking;
  onBack: () => void;
  onProceedToActiveParking: (updatedBooking: Booking) => void;
}

export const NavigationScreen: React.FC<NavigationScreenProps> = ({
  booking,
  onBack,
  onProceedToActiveParking,
}) => {
  const [currentBooking, setCurrentBooking] = useState<Booking>(booking);
  const [isAllocating, setIsAllocating] = useState<boolean>(false);
  const [allocationResult, setAllocationResult] = useState<SlotAllocationResult | null>(null);

  const hubName = currentBooking.locationName || (typeof currentBooking.parkingHubId === 'object' && currentBooking.parkingHubId?.parkingName) || 'Drivix Parking Hub';
  const address = typeof currentBooking.parkingHubId === 'object' && currentBooking.parkingHubId !== null
    ? (currentBooking.parkingHubId as any).address || ''
    : '';
  const lat = typeof currentBooking.parkingHubId === 'object' && currentBooking.parkingHubId !== null
    ? (currentBooking.parkingHubId as any).latitude || 28.4727
    : 28.4727;
  const lng = typeof currentBooking.parkingHubId === 'object' && currentBooking.parkingHubId !== null
    ? (currentBooking.parkingHubId as any).longitude || 77.4820
    : 77.4820;

  const handleLaunchExternalGps = () => {
    const label = encodeURIComponent(hubName);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    if (url) {
      Linking.openURL(url).catch((err) => console.warn('Could not launch GPS navigation:', err));
    }
  };

  const handleConfirmArrival = async () => {
    setIsAllocating(true);
    try {
      const res = await bookingApi.assignSlot(currentBooking._id);
      if (res.success) {
        setAllocationResult(res);
        const updated: Booking = {
          ...currentBooking,
          slotId: res.slotNumber || res.booking?.slotId,
          status: 'Slot Assigned',
          qrToken: res.qrToken,
        };
        setCurrentBooking(updated);
        Alert.alert(
          'Slot Assigned Successfully!',
          `You have been allocated Slot ${res.slotNumber} on Floor ${res.floorName}. Boom gate will open upon reading your plate.`
        );
      } else {
        Alert.alert('Allocation Notice', res.message || 'No slots available on this floor. Approaching supervisor assistance.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error communicating with parking barrier system.';
      Alert.alert('Arrival Error', msg);
    } finally {
      setIsAllocating(false);
    }
  };

  const isSlotAlreadyAssigned = Boolean(currentBooking.slotId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Navigation & Arrival"
        subtitle={hubName}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── Destination Card ─── */}
        <Card style={styles.hubCard}>
          <View style={styles.hubHeader}>
            <View style={styles.hubTitleCol}>
              <Text style={styles.hubTitle}>{hubName}</Text>
              <View style={styles.addressRow}>
                <MapPin size={14} color={Colors.textSecondary} />
                <Text style={styles.addressText}>{address || 'Live Parking Hub'}</Text>
              </View>
            </View>
            <Badge
              label={currentBooking.status}
              variant={isSlotAlreadyAssigned ? 'available' : 'reserved'}
            />
          </View>

          <Button
            title="Launch Turn-by-Turn GPS"
            variant="primary"
            icon={<Navigation size={18} color="#171717" />}
            onPress={handleLaunchExternalGps}
            style={styles.gpsBtn}
          />
        </Card>

        {/* ─── Arrival Slot Allocation Box ─── */}
        <Card style={[styles.allocationCard, isSlotAlreadyAssigned && styles.allocatedCardBorder]}>
          <View style={styles.allocationHeaderRow}>
            <Text style={styles.allocationTitle}>Physical Slot Allocation</Text>
            <Badge
              label={isSlotAlreadyAssigned ? 'Slot Assigned' : 'Arrival Required'}
              variant={isSlotAlreadyAssigned ? 'available' : 'neutral'}
            />
          </View>

          {isSlotAlreadyAssigned ? (
            <View style={styles.assignedContainer}>
              <View style={styles.slotHeroBadge}>
                <Text style={styles.slotHeroLabel}>YOUR ASSIGNED SLOT</Text>
                <Text style={styles.slotHeroNumber}>{currentBooking.slotId}</Text>
                <Text style={styles.slotHeroFloor}>Floor {currentBooking.floor}</Text>
              </View>

              <View style={styles.gateInstructions}>
                <ShieldCheck size={18} color="#15803D" />
                <Text style={styles.gateInstructionsText}>
                  Proceed to Floor {currentBooking.floor}. ANPR cameras at barrier entry will automatically verify plate {currentBooking.vehicleNumber} and open the boom gate.
                </Text>
              </View>

              <Button
                title="Go to Active Parking Dashboard"
                variant="primary"
                icon={<ArrowRight size={18} color="#171717" />}
                iconPosition="right"
                onPress={() => onProceedToActiveParking(currentBooking)}
                style={styles.dashboardBtn}
              />
            </View>
          ) : (
            <View style={styles.pendingContainer}>
              <Text style={styles.pendingDescription}>
                You have reserved capacity on Floor {currentBooking.floor}. When you arrive at the parking facility gates, tap below to allocate your exact physical bay.
              </Text>

              <Button
                title={isAllocating ? 'Allocating Bay...' : 'Confirm Arrival & Assign Slot'}
                variant="primary"
                loading={isAllocating}
                icon={<CheckCircle2 size={18} color="#171717" />}
                onPress={handleConfirmArrival}
                style={styles.assignSlotBtn}
              />
            </View>
          )}
        </Card>

        {/* ─── Safety & Navigation Advisory ─── */}
        <View style={styles.safetyBox}>
          <AlertTriangle size={18} color="#B45309" />
          <Text style={styles.safetyText}>
            Drive safely. Keep your vehicle registration number visible for rapid optical camera recognition at the entry barrier.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  hubCard: {
    marginBottom: Spacing.lg,
  },
  hubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  hubTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  hubTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  gpsBtn: {
    marginTop: 4,
  },
  allocationCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  allocatedCardBorder: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1.5,
  },
  allocationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  allocationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  pendingContainer: {
    gap: 12,
  },
  pendingDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  assignSlotBtn: {
    marginTop: 4,
  },
  assignedContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  slotHeroBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.primaryYellow,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    width: '100%',
  },
  slotHeroLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: 1,
  },
  slotHeroNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginVertical: 4,
  },
  slotHeroFloor: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  gateInstructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 10,
    marginBottom: Spacing.lg,
  },
  gateInstructionsText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  dashboardBtn: {
    width: '100%',
  },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 10,
  },
  safetyText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
});
