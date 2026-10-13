import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import {
  Clock,
  Car,
  Layers,
  MapPin,
  PlusCircle,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { Header, Card, Button, Badge, BottomSheet } from '../../components/common';
import { bookingApi } from '../../api/bookingApi';
import { Booking } from '../../types';

export interface ActiveParkingScreenProps {
  booking?: Booking;
  bookingId?: string;
  onBack: () => void;
  onCheckoutSuccess: () => void;
}

const getCleanBookingId = (b: any, idParam?: string): string => {
  if (typeof idParam === 'string' && idParam && idParam !== '[object Object]') {
    return idParam;
  }
  if (!b) return '';
  if (typeof b === 'string' && b !== '[object Object]') return b;
  if (typeof b._id === 'string' && b._id !== '[object Object]') return b._id;
  if (typeof b.id === 'string' && b.id !== '[object Object]') return b.id;
  if (typeof b._id === 'object' && b._id !== null) {
    return b._id._id || b._id.id || '';
  }
  if (typeof b.bookingId === 'string' && b.bookingId !== '[object Object]') return b.bookingId;
  return '';
};

export const ActiveParkingScreen: React.FC<ActiveParkingScreenProps> = ({
  booking,
  bookingId,
  onBack,
  onCheckoutSuccess,
}) => {
  const initialBooking = React.useMemo(() => {
    let b: any = booking;
    if (b && typeof b._id === 'object' && b._id !== null) {
      b = { ...b._id, ...b, _id: b._id._id || b._id.id };
    }
    return (b || {}) as Booking;
  }, [booking]);

  const [currentBooking, setCurrentBooking] = useState<Booking>(initialBooking);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    return Math.max(0, (currentBooking.duration || 2) * 3600);
  });
  const [extendModalVisible, setExtendModalVisible] = useState<boolean>(false);
  const [extensionHours, setExtensionHours] = useState<number>(1);
  const [isExtending, setIsExtending] = useState<boolean>(false);
  const [isVacating, setIsVacating] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Live countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync fresh booking data from backend API on mount
  useEffect(() => {
    const targetId = getCleanBookingId(currentBooking, bookingId);
    if (!targetId) return;

    const fetchLatestDetails = async () => {
      try {
        const myBookings = await bookingApi.getMyBookings();
        if (Array.isArray(myBookings)) {
          const match = myBookings.find(
            (b) => b._id === targetId || b.bookingId === targetId || (b as any).id === targetId
          );
          if (match) {
            setCurrentBooking(match);
            if (match.duration) {
              setSecondsRemaining(Math.max(0, match.duration * 3600));
            }
          }
        }
      } catch (err) {
        console.warn('ActiveParkingScreen: Could not refresh fresh booking data:', err);
      }
    };

    fetchLatestDetails();
  }, [bookingId]);

  const handleCancelBooking = async () => {
    const targetId = getCleanBookingId(currentBooking, bookingId);
    if (!targetId || targetId === '[object Object]') {
      Alert.alert('Cancellation Error', 'Invalid booking reference ID.');
      return;
    }

    Alert.alert(
      'Cancel Reservation',
      'Are you sure you want to cancel this booking? Reserved parking capacity will be immediately released.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              await bookingApi.cancelBooking(targetId, 'User cancelled active pass');
              Alert.alert(
                'Reservation Cancelled',
                'Your booking has been cancelled and capacity released.',
                [{ text: 'OK', onPress: onCheckoutSuccess }]
              );
            } catch (err: any) {
              const msg = err.response?.data?.message || err.message || 'Error cancelling reservation.';
              Alert.alert('Cancellation Error', msg);
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const formatTimer = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleExtendBooking = async () => {
    const targetId = getCleanBookingId(currentBooking, bookingId);
    if (!targetId || targetId === '[object Object]') {
      Alert.alert('Extension Error', 'Invalid booking reference ID.');
      return;
    }

    setIsExtending(true);
    try {
      const updated = await bookingApi.extendBooking(targetId, extensionHours);
      setCurrentBooking(updated);
      setSecondsRemaining((prev) => prev + extensionHours * 3600);
      setExtendModalVisible(false);
      Alert.alert(
        'Booking Extended',
        `Successfully extended parking reservation by ${extensionHours} hour(s).`
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Could not extend booking. Slot may have conflicting reservation.';
      Alert.alert('Extension Error', msg);
    } finally {
      setIsExtending(false);
    }
  };

  const handleVacateAndCheckout = async () => {
    const targetId = getCleanBookingId(currentBooking, bookingId);
    if (!targetId || targetId === '[object Object]') {
      Alert.alert('Checkout Error', 'Invalid booking reference ID.');
      return;
    }

    Alert.alert(
      'Confirm Exit & Checkout',
      'Are you vacating your parking slot now? Gate exit barrier will be prepared.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Exit',
          style: 'destructive',
          onPress: async () => {
            setIsVacating(true);
            try {
              const res = await bookingApi.vacateBooking(targetId, 'online');
              Alert.alert(
                'Checkout Complete',
                `Successfully checked out. Slot ${currentBooking.slotId || ''} vacated. Exit gate opened.`,
                [{ text: 'OK', onPress: onCheckoutSuccess }]
              );
            } catch (err: any) {
              const msg = err.response?.data?.message || err.message || 'Error processing checkout.';
              Alert.alert('Checkout Error', msg);
            } finally {
              setIsVacating(false);
            }
          },
        },
      ]
    );
  };

  const qrPayload = JSON.stringify({
    bookingId: currentBooking.bookingId || getCleanBookingId(currentBooking, bookingId),
    vehicleNumber: currentBooking.vehicleNumber || 'VEHICLE',
    slotId: currentBooking.slotId || 'GATE_ASSIGNMENT',
    floor: currentBooking.floor || 'L1',
    locationName: currentBooking.locationName || 'Drivix Facility',
    action: 'GATE_EXIT',
  });

  const displayRef = currentBooking.bookingId || getCleanBookingId(currentBooking, bookingId) || 'Active Pass';

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Active Parking Pass"
        subtitle={`Booking Ref: ${displayRef}`}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── Hero Countdown Timer Card ─── */}
        <Card style={styles.timerCard}>
          <View style={styles.timerHeader}>
            <View style={styles.pulsingRow}>
              <View style={styles.pulsingDot} />
              <Text style={styles.timerHeaderLabel}>PARKING SESSION IN PROGRESS</Text>
            </View>
            <Badge
              label={currentBooking.status}
              variant={currentBooking.status === 'Checked In' ? 'available' : 'reserved'}
            />
          </View>

          <View style={styles.countdownBox}>
            <Text style={styles.countdownNumber}>{formatTimer(secondsRemaining)}</Text>
            <Text style={styles.countdownSub}>HOURS : MINUTES : SECONDS REMAINING</Text>
          </View>

          {/* Location & Slot Info Row */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>LOCATION</Text>
              <Text style={styles.infoVal} numberOfLines={1}>
                {currentBooking.locationName || (currentBooking as any).hubName || 'Drivix Smart Facility'}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>FLOOR</Text>
              <Text style={styles.infoVal}>
                {currentBooking.floor ? `Floor ${currentBooking.floor}` : 'Level Reserved'}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>BAY / SLOT</Text>
              <Text style={styles.slotHeroText}>{currentBooking.slotId || 'Assigned on Gate'}</Text>
            </View>
          </View>
        </Card>

        {/* ─── Gate QR Ticket Pass ─── */}
        <Card style={styles.qrCard}>
          <Text style={styles.qrCardTitle}>Boom Gate Scanner Pass</Text>
          <Text style={styles.qrCardSubtitle}>
            Scan at entry or exit barrier terminal if plate camera requires backup
          </Text>

          <View style={styles.qrWrapper}>
            <QRCode
              value={qrPayload}
              size={150}
              color="#000000"
              backgroundColor="#FFFFFF"
            />
          </View>
          <Text style={styles.plateTag}>{currentBooking.vehicleNumber}</Text>
        </Card>

        {/* ─── Action Controls ─── */}
        <View style={styles.actionsContainer}>
          <Button
            title="Extend Parking Duration"
            variant="outline"
            icon={<PlusCircle size={18} color="#171717" />}
            onPress={() => setExtendModalVisible(true)}
            style={styles.extendBtn}
          />

          <Button
            title={isVacating ? 'Processing Checkout...' : 'End Parking & Exit Gate'}
            variant="primary"
            loading={isVacating}
            icon={<LogOut size={18} color="#171717" />}
            onPress={handleVacateAndCheckout}
            style={styles.vacateBtn}
          />

          {(currentBooking.status === 'Confirmed' || currentBooking.status === 'Slot Assigned') && (
            <Button
              title={isCancelling ? 'Cancelling...' : 'Cancel Reservation'}
              variant="secondary"
              loading={isCancelling}
              icon={<AlertTriangle size={18} color="#E53935" />}
              onPress={handleCancelBooking}
              style={{ marginTop: Spacing.sm }}
            />
          )}
        </View>
      </ScrollView>

      {/* ─── Extend Booking Bottom Sheet ─── */}
      <BottomSheet
        visible={extendModalVisible}
        onClose={() => setExtendModalVisible(false)}
      >
        <Text style={styles.extendModalTitle}>Extend Parking Session</Text>
        <Text style={styles.extendModalSub}>
          Subject to real-time slot availability. Additional hours are added immediately.
        </Text>

        <View style={styles.extendOptionsRow}>
          {[1, 2, 3].map((hrs) => {
            const isSelected = extensionHours === hrs;
            return (
              <TouchableOpacity
                key={hrs}
                activeOpacity={0.85}
                onPress={() => setExtensionHours(hrs)}
                style={[
                  styles.extendChip,
                  isSelected && styles.extendChipSelected,
                ]}
              >
                <Text style={[styles.extendChipNum, isSelected && styles.extendChipNumSelected]}>
                  +{hrs}
                </Text>
                <Text style={[styles.extendChipUnit, isSelected && styles.extendChipUnitSelected]}>
                  {hrs === 1 ? 'hour' : 'hours'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          title={isExtending ? 'Extending...' : `Confirm +${extensionHours}h Extension`}
          variant="primary"
          loading={isExtending}
          onPress={handleExtendBooking}
          style={{ marginTop: Spacing.md }}
        />
      </BottomSheet>
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
  timerCard: {
    backgroundColor: '#FFFDF5',
    borderColor: Colors.primaryYellow,
    borderWidth: 2,
    marginBottom: Spacing.lg,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  pulsingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#15803D',
  },
  timerHeaderLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  countdownBox: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  countdownNumber: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  countdownSub: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginTop: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#FEF08A',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  infoCol: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  slotHeroText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#B45309',
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#FEF08A',
  },
  qrCard: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  qrCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  qrCardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  plateTag: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  actionsContainer: {
    gap: 12,
  },
  extendBtn: {
    width: '100%',
  },
  vacateBtn: {
    width: '100%',
  },
  extendModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  extendModalSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  extendOptionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  extendChip: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  extendChipSelected: {
    backgroundColor: Colors.accentYellowLight,
    borderColor: Colors.primaryYellow,
    borderWidth: 2,
  },
  extendChipNum: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  extendChipNumSelected: {
    color: '#171717',
  },
  extendChipUnit: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  extendChipUnitSelected: {
    color: '#171717',
    fontWeight: '700',
  },
});
