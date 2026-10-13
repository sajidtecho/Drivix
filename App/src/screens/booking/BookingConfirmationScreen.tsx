import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import {
  CheckCircle2,
  Navigation,
  Calendar,
  Clock,
  Car,
  Layers,
  MapPin,
  Share2,
  Home,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { Card, Button, Badge } from '../../components/common';
import { Booking } from '../../types';

export interface BookingConfirmationScreenProps {
  booking: Booking;
  onNavigateToHub: () => void;
  onGoHome: () => void;
  onViewMyBookings: () => void;
}

export const BookingConfirmationScreen: React.FC<BookingConfirmationScreenProps> = ({
  booking,
  onNavigateToHub,
  onGoHome,
  onViewMyBookings,
}) => {
  const qrPayload = JSON.stringify({
    bookingId: booking.bookingId,
    vehicleNumber: booking.vehicleNumber,
    floor: booking.floor,
    locationName: booking.locationName,
    entryDate: booking.entryDate,
    entryTime: booking.entryTime,
    token: booking.qrToken || `DRIVIX-PASS-${booking.bookingId}`,
  });

  const handleSharePass = async () => {
    try {
      await Share.share({
        message: `🚗 Drivix Parking Pass: ${booking.bookingId}\nLocation: ${booking.locationName}, Floor: ${booking.floor}\nArrival: ${booking.entryDate} at ${booking.entryTime}\nVehicle: ${booking.vehicleNumber}`,
      });
    } catch (_) {}
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Banner Header */}
        <View style={styles.successHeader}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={40} color="#171717" strokeWidth={2.5} />
          </View>
          <Text style={styles.successTitle}>Reservation Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your parking capacity has been securely reserved.
          </Text>
        </View>

        {/* ─── Digital Parking Ticket Pass ─── */}
        <Card style={styles.ticketCard}>
          <View style={styles.ticketTopRow}>
            <View>
              <Text style={styles.ticketLabel}>BOOKING REFERENCE</Text>
              <Text style={styles.bookingIdText}>{booking.bookingId}</Text>
            </View>
            <Badge label={booking.status || 'Confirmed'} variant="available" />
          </View>

          <View style={styles.ticketDivider} />

          {/* QR Code Section */}
          <View style={styles.qrContainer}>
            <View style={styles.qrWhiteWrapper}>
              <QRCode
                value={qrPayload}
                size={160}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            </View>
            <Text style={styles.qrScanHint}>
              Scan at gate entry terminal or ANPR camera
            </Text>
          </View>

          <View style={styles.ticketDivider} />

          {/* Details Table */}
          <View style={styles.ticketDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Parking Hub</Text>
              <Text style={styles.detailValueBold} numberOfLines={1}>
                {booking.locationName}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reserved Floor</Text>
              <Text style={styles.detailValue}>Floor {booking.floor}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vehicle Plate</Text>
              <Text style={styles.detailValueBold}>{booking.vehicleNumber}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Entry Schedule</Text>
              <Text style={styles.detailValue}>
                {booking.entryDate} at {booking.entryTime}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{booking.duration} hours</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Amount</Text>
              <Text style={styles.priceHighlight}>₹{booking.totalCost}</Text>
            </View>
          </View>

          {/* Share Pass Action */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSharePass}
            style={styles.shareBtn}
          >
            <Share2 size={16} color="#171717" />
            <Text style={styles.shareText}>Share Digital Ticket Pass</Text>
          </TouchableOpacity>
        </Card>

        {/* Arrival Slot Automation Note */}
        <View style={styles.arrivalNote}>
          <ShieldCheck size={18} color="#15803D" />
          <Text style={styles.arrivalNoteText}>
            Physical slot allocation occurs on arrival. Tap "Navigate to Parking" when you start driving to receive optimal route directions.
          </Text>
        </View>

        {/* Primary Action Buttons */}
        <View style={styles.actionsColumn}>
          <Button
            title="Navigate to Parking"
            variant="primary"
            size="lg"
            icon={<Navigation size={20} color="#171717" />}
            onPress={onNavigateToHub}
            style={styles.navBtn}
          />

          <Button
            title="View My Bookings"
            variant="outline"
            size="md"
            onPress={onViewMyBookings}
            style={styles.viewBookingsBtn}
          />

          <Button
            title="Return to Home"
            variant="ghost"
            size="sm"
            icon={<Home size={16} color={Colors.textSecondary} />}
            onPress={onGoHome}
          />
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
    padding: Spacing.xl,
    paddingBottom: 60,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: '#171717',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  ticketCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  bookingIdText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  ticketDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  qrWhiteWrapper: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qrScanHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  ticketDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  detailValueBold: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  priceHighlight: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
  },
  shareText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171717',
  },
  arrivalNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 10,
    marginBottom: Spacing.xl,
  },
  arrivalNoteText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  actionsColumn: {
    gap: 12,
  },
  navBtn: {
    width: '100%',
  },
  viewBookingsBtn: {
    width: '100%',
  },
});
