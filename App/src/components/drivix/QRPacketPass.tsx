import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ShieldCheck, WifiOff } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '@/hooks/use-theme';
import { offlineStorage } from '@/services/offlineStorage';

interface QRPacketPassProps {
  booking: any;
  selectedLocation: any;
  selectedSlot: any;
  duration: string;
  vehicleNumber: string;
  onDone: () => void;
}

export default function QRPacketPass({
  booking: propBooking,
  selectedLocation: propLocation,
  selectedSlot: propSlot,
  duration: propDuration,
  vehicleNumber: propVehicleNumber,
  onDone,
}: QRPacketPassProps) {
  const colors = useTheme();
  const [offlinePassData, setOfflinePassData] = useState<any>(null);
  const [isOfflineLoaded, setIsOfflineLoaded] = useState(false);

  // Automatically cache pass details when available
  useEffect(() => {
    if (propBooking) {
      const qrToken = JSON.stringify({
        bookingId: propBooking?._id || propBooking?.bookingId,
        vehicleNumber: propVehicleNumber || propBooking?.vehicleNumber,
        slotId: propSlot?.id || propBooking?.slotId,
      });

      offlineStorage.saveActivePass({
        booking: propBooking,
        selectedLocationName: propLocation?.parkingName || propBooking?.locationName,
        selectedSlotNumber: propSlot?.label || propSlot?.number || propBooking?.slotId,
        qrCodeToken: qrToken,
        cachedAt: new Date().toISOString(),
      });
    } else {
      // Offline fallback: load cached pass token
      (async () => {
        const cached = await offlineStorage.getActivePass();
        if (cached) {
          setOfflinePassData(cached);
          setIsOfflineLoaded(true);
        }
      })();
    }
  }, [propBooking, propLocation, propSlot, propVehicleNumber]);

  const booking = propBooking || offlinePassData?.booking;
  const locationName = propLocation?.parkingName || offlinePassData?.selectedLocationName || booking?.locationName || 'Drivix Facility';
  const slotText = propSlot?.label || propSlot?.number || offlinePassData?.selectedSlotNumber || booking?.slotId || 'Assigned';
  const vehicle = propVehicleNumber || booking?.vehicleNumber || 'Registered Vehicle';
  const durationText = propDuration || booking?.durationHours || booking?.duration || '1';

  const displayId = booking?._id
    ? `#${booking._id.substring(Math.max(0, booking._id.length - 6)).toUpperCase()}`
    : booking?.bookingId
      ? `#${booking.bookingId}`
      : '#PASS';

  const qrValue = offlinePassData?.qrCodeToken || JSON.stringify({
    bookingId: booking?._id || booking?.bookingId,
    vehicleNumber: vehicle,
    slotId: propSlot?.id || booking?.slotId,
  });

  return (
    <ScrollView contentContainerStyle={styles.passScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.successHeader}>
        <ShieldCheck size={48} color="#00cc6a" />
        <Text style={[styles.successTitle, { color: colors.text }]}>Booking Confirmed!</Text>
        <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>ANPR Gate Pass generated</Text>
      </View>

      <View style={[styles.passCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
        {isOfflineLoaded && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255, 107, 53, 0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8, alignSelf: 'flex-start' }}>
            <WifiOff size={12} color="#ff6b35" />
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#ff6b35' }}>OFFLINE CACHED PASS</Text>
          </View>
        )}
        <Text style={styles.passBookingId}>{displayId}</Text>
        <Text style={[styles.passLocationName, { color: colors.text }]}>{locationName}</Text>
        
        <View style={styles.qrContainer}>
          <QRCode
            value={qrValue}
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
            <Text style={[styles.passDetailValue, { color: colors.text }]}>{vehicle}</Text>
          </View>
          <View style={styles.passDetailBlock}>
            <Text style={[styles.passDetailLabel, { color: colors.textSecondary }]}>PARKING SLOT</Text>
            <Text style={[styles.passDetailValue, { color: colors.text }]}>Slot {slotText}</Text>
          </View>
          <View style={styles.passDetailBlock}>
            <Text style={[styles.passDetailLabel, { color: colors.textSecondary }]}>FLOOR</Text>
            <Text style={[styles.passDetailValue, { color: colors.text }]}>Floor {propSlot?.floor || booking?.floor || '1'}</Text>
          </View>
          <View style={styles.passDetailBlock}>
            <Text style={[styles.passDetailLabel, { color: colors.textSecondary }]}>DURATION</Text>
            <Text style={[styles.passDetailValue, { color: colors.text }]}>{durationText} Hours</Text>
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
