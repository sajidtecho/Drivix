import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '@/hooks/use-theme';

interface QRPacketPassProps {
  booking: any;
  selectedLocation: any;
  selectedSlot: any;
  duration: string;
  vehicleNumber: string;
  onDone: () => void;
}

export default function QRPacketPass({
  booking,
  selectedLocation,
  selectedSlot,
  duration,
  vehicleNumber,
  onDone,
}: QRPacketPassProps) {
  const displayId = booking?._id ? `#${booking._id.substring(Math.max(0, booking._id.length - 6)).toUpperCase()}` : '#PASS';
  const colors = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.passScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.successHeader}>
        <ShieldCheck size={48} color="#00cc6a" />
        <Text style={[styles.successTitle, { color: colors.text }]}>Booking Confirmed!</Text>
        <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>ANPR Gate Pass generated</Text>
      </View>

      <View style={[styles.passCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
        <Text style={styles.passBookingId}>{displayId}</Text>
        <Text style={[styles.passLocationName, { color: colors.text }]}>{selectedLocation?.parkingName || 'Drivix Facility'}</Text>
        
        <View style={styles.qrContainer}>
          <QRCode
            value={JSON.stringify({
              bookingId: booking?._id,
              vehicleNumber,
              slotId: selectedSlot?.id,
            })}
            size={150}
            color="#0b0c10"
            backgroundColor="#ffffff"
          />
        </View>

        <Text style={[styles.qrHint, { color: colors.textSecondary }]}>
          Scan this QR code at the entry/exit barrier reader for automatic gate opening.
        </Text>

        <View style={[styles.passDetailsGrid, { borderColor: colors.borderGlass }]}>
          <View style={styles.passDetailBlock}>
            <Text style={[styles.passDetailLabel, { color: colors.textSecondary }]}>VEHICLE</Text>
            <Text style={[styles.passDetailValue, { color: colors.text }]}>{vehicleNumber}</Text>
          </View>
          <View style={styles.passDetailBlock}>
            <Text style={[styles.passDetailLabel, { color: colors.textSecondary }]}>PARKING SLOT</Text>
            <Text style={[styles.passDetailValue, { color: colors.text }]}>Slot {selectedSlot?.label || selectedSlot?.number}</Text>
          </View>
          <View style={styles.passDetailBlock}>
            <Text style={[styles.passDetailLabel, { color: colors.textSecondary }]}>FLOOR</Text>
            <Text style={[styles.passDetailValue, { color: colors.text }]}>Floor {selectedSlot?.floor || '1'}</Text>
          </View>
          <View style={styles.passDetailBlock}>
            <Text style={[styles.passDetailLabel, { color: colors.textSecondary }]}>DURATION</Text>
            <Text style={[styles.passDetailValue, { color: colors.text }]}>{duration} Hours</Text>
          </View>
        </View>

        {/* Selected Services list */}
        {booking?.additionalServices && booking.additionalServices.length > 0 && (
          <View style={[styles.servicesGrid, { borderColor: colors.borderGlass }]}>
            <Text style={[styles.passDetailLabel, { color: colors.textSecondary, marginBottom: 8, letterSpacing: 0.5 }]}>
              ADDITIONAL SERVICES
            </Text>
            <View style={styles.servicesPillsContainer}>
              {booking.additionalServices.map((srv: string) => {
                let icon = '⚙️';
                if (srv === 'Rest Area') icon = '🛋️';
                if (srv === 'EV Charging') icon = '⚡';
                if (srv === 'Car Wash') icon = '🧼';
                if (srv === 'Food & Beverages') icon = '🍔';
                return (
                  <View key={srv} style={[styles.servicePill, { backgroundColor: 'rgba(255, 206, 0, 0.08)', borderColor: 'rgba(255, 206, 0, 0.25)' }]}>
                    <Text style={[styles.servicePillText, { color: colors.primary }]}>{icon} {srv}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity style={[styles.dashboardBtn, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]} onPress={onDone}>
        <Text style={styles.dashboardBtnText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  passScroll: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 40,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  successSubtitle: {
    color: '#a0aab2',
    fontSize: 13,
    marginTop: 4,
  },
  passCard: {
    backgroundColor: 'rgba(21, 22, 30, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  passBookingId: {
    color: '#ffce00',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  passLocationName: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 6,
    fontWeight: 'bold',
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginVertical: 20,
    borderWidth: 4,
    borderColor: '#ffce00',
  },
  qrHint: {
    color: '#a0aab2',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  passDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  passDetailBlock: {
    width: '50%',
    padding: 8,
  },
  passDetailLabel: {
    color: '#a0aab2',
    fontSize: 10,
  },
  passDetailValue: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 2,
  },
  servicesGrid: {
    width: '100%',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  servicesPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  servicePillText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dashboardBtn: {
    backgroundColor: '#15161e',
    borderColor: '#ffce00',
    borderWidth: 1,
    height: 52,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  dashboardBtnText: {
    color: '#ffce00',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
