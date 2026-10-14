import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MapPin,
  Clock,
  Shield,
  Zap,
  Navigation,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { Header, Card, Button, Badge } from '../../components/common';
import { parkingApi } from '../../api/parkingApi';
import { useBooking } from '../../store/BookingContext';
import { checkIsOnlineBookingAllowed } from '../../services/bookingEligibility';
import { launchMobileLiveGpsNavigation } from '../../services/navigation';
import {
  getUserLiveLocation,
  calculateAccurateDistance,
  UserCoordinates,
} from '../../services/locationService';

export interface ParkingDetailScreenProps {
  hub: ParkingLocation;
  onBack: () => void;
  onProceedToFloorSelection: () => void;
}

export const ParkingDetailScreen: React.FC<ParkingDetailScreenProps> = ({
  hub,
  onBack,
  onProceedToFloorSelection,
}) => {
  const { selectHub, selectFloor } = useBooking();
  const [floors, setFloors] = useState<ParkingFloor[]>([]);
  const [loadingFloors, setLoadingFloors] = useState<boolean>(true);
  const [userCoords, setUserCoords] = useState<UserCoordinates | null>(null);

  useEffect(() => {
    selectHub(hub);

    getUserLiveLocation().then((coords) => {
      if (coords) setUserCoords(coords);
    }).catch(() => {});

    const fetchFloors = async () => {
      try {
        const floorData = await parkingApi.getFloorsForLocation(hub._id);
        const validFloors = Array.isArray(floorData) ? floorData : [];
        setFloors(validFloors);
        // Pre-select first floor if available
        if (validFloors.length > 0) {
          selectFloor(validFloors[0]);
        }
      } catch (err) {
        console.warn('[ParkingDetailScreen] Error fetching floors:', err);
        setFloors([]);
      } finally {
        setLoadingFloors(false);
      }
    };
    fetchFloors();
  }, [hub._id]);

  const distInfo = calculateAccurateDistance(userCoords, hub);

  const openInMaps = () => {
    launchMobileLiveGpsNavigation({
      latitude: hub.latitude,
      longitude: hub.longitude,
      locationName: hub.parkingName,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={hub.parkingName}
        subtitle={hub.city ? `${hub.city}, ${hub.state || ''}` : hub.address}
        onBack={onBack}
        rightAction={
          <TouchableOpacity activeOpacity={0.8} onPress={openInMaps} style={styles.mapIconBtn}>
            <Navigation size={18} color="#171717" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── Hero Overview Card ─── */}
        <Card style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.heroHubName}>{hub.parkingName}</Text>
              <View style={styles.addressRow}>
                <MapPin size={14} color={Colors.textSecondary} />
                <Text style={styles.heroAddressText}>
                  {hub.address} • {distInfo.distanceText} (~{distInfo.etaText})
                </Text>
              </View>
            </View>
            {checkIsOnlineBookingAllowed(hub) ? (
              <Badge
                label={hub.availableSlots > 0 ? `${hub.availableSlots} Slots Free` : 'Lot Full'}
                variant={hub.availableSlots > 0 ? 'available' : 'occupied'}
              />
            ) : (
              <View style={styles.noBookingBadgeDetail}>
                <AlertTriangle size={11} color="#FFAD00" style={{ marginRight: 4 }} />
                <Text style={styles.noBookingBadgeDetailText}>NOT ONLINE BOOKING</Text>
              </View>
            )}
          </View>

          {!checkIsOnlineBookingAllowed(hub) && (
            <View style={styles.noBookingBanner}>
              <AlertTriangle size={15} color="#FFAD00" style={{ marginRight: 6, flexShrink: 0 }} />
              <Text style={styles.noBookingBannerText}>
                <Text style={{ fontWeight: '800' }}>NOT ONLINE BOOKING: </Text>
                On-site entry only. Use Navigate for GPS directions.
              </Text>
            </View>
          )}

          {/* Pricing Highlight Box */}
          <View style={styles.pricingBox}>
            <View>
              <Text style={styles.pricingLabel}>Base Parking Rate</Text>
              <Text style={styles.pricingSublabel}>AI Dynamic Pricing applied at checkout</Text>
            </View>
            <View style={styles.pricingAmountCol}>
              <Text style={styles.pricingAmount}>₹{hub.hourlyPrice}</Text>
              <Text style={styles.pricingUnit}>/ hour</Text>
            </View>
          </View>

          {/* Operating hours & monitoring */}
          <View style={styles.hoursRow}>
            <Clock size={16} color={Colors.textSecondary} />
            <Text style={styles.hoursText}>
              {hub.openingTime && hub.closingTime
                ? `Operational Hours: ${hub.openingTime} - ${hub.closingTime}`
                : 'Operational Hours: Open 24/7 Monitored'}
            </Text>
          </View>
        </Card>

        {/* ─── Supported Facilities ─── */}
        <Text style={styles.sectionTitle}>Facilities & Features</Text>
        <View style={styles.amenitiesGrid}>
          <View style={styles.amenityCard}>
            <Zap size={22} color="#15803D" />
            <Text style={styles.amenityName}>EV Fast Charger</Text>
            <Text style={styles.amenitySub}>Dedicated bays</Text>
          </View>

          <View style={styles.amenityCard}>
            <Shield size={22} color="#171717" />
            <Text style={styles.amenityName}>24/7 Security</Text>
            <Text style={styles.amenitySub}>CCTV + ANPR</Text>
          </View>

          <View style={styles.amenityCard}>
            <Layers size={22} color="#D97706" />
            <Text style={styles.amenityName}>Multi-Level</Text>
            <Text style={styles.amenitySub}>Underground & covered</Text>
          </View>
        </View>

        {/* ─── Available Parking Floors ─── */}
        <View style={styles.floorSectionHeader}>
          <Text style={styles.sectionTitle}>Available Parking Floors</Text>
          <Text style={styles.floorCountText}>
            {(Array.isArray(floors) ? floors : []).length} Floors Configured
          </Text>
        </View>

        {loadingFloors ? (
          <ActivityIndicator size="small" color={Colors.primaryYellow} style={{ marginVertical: 24 }} />
        ) : (Array.isArray(floors) ? floors : []).length === 0 ? (
          <Card style={styles.noFloorsCard}>
            <Info size={20} color={Colors.textSecondary} />
            <Text style={styles.noFloorsText}>
              Default Ground Floor allocation active. Full floor capacity available.
            </Text>
          </Card>
        ) : (
          (Array.isArray(floors) ? floors : []).map((fl) => (
            <Card key={fl._id} style={styles.floorCard}>
              <View style={styles.floorRow}>
                <View style={styles.floorBadge}>
                  <Text style={styles.floorBadgeText}>{fl.floorName}</Text>
                </View>
                <View style={styles.floorInfoCol}>
                  <Text style={styles.floorNameTitle}>Floor {fl.floorName}</Text>
                  <Text style={styles.floorCapacityText}>
                    {fl.availableSlots} slots free of {fl.totalSlots} capacity
                  </Text>
                </View>
                <Badge
                  label={fl.availableSlots > 0 ? 'Reserve Ready' : 'Floor Full'}
                  variant={fl.availableSlots > 0 ? 'available' : 'occupied'}
                />
              </View>
            </Card>
          ))
        )}

        {/* Notice on Drivix Booking Policy */}
        <View style={styles.policyNotice}>
          <CheckCircle2
            size={16}
            color={checkIsOnlineBookingAllowed(hub) ? Colors.available : '#FFAD00'}
          />
          <Text style={styles.policyText}>
            {checkIsOnlineBookingAllowed(hub)
              ? 'Reserve floor capacity instantly now. Your optimal physical slot is automatically assigned upon arrival via smart ANPR gate logic.'
              : 'This facility operates on physical on-site entry. Tap Navigate below to open GPS maps directly for live turn-by-turn directions.'}
          </Text>
        </View>
      </ScrollView>

      {/* ─── Bottom CTA Bar ─── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceText}>
            {hub.hourlyPrice > 0 ? `₹${hub.hourlyPrice}` : 'On-Site'}
          </Text>
          <Text style={styles.bottomSubtext}>
            {checkIsOnlineBookingAllowed(hub) ? 'base hourly rate' : 'entry on-site'}
          </Text>
        </View>
        {checkIsOnlineBookingAllowed(hub) ? (
          <Button
            title="Select Floor & Reserve"
            variant="primary"
            icon={<ArrowRight size={18} color="#171717" />}
            iconPosition="right"
            onPress={onProceedToFloorSelection}
            style={styles.proceedBtn}
          />
        ) : (
          <Button
            title="Navigate to Location"
            variant="primary"
            icon={<Navigation size={18} color="#171717" />}
            iconPosition="right"
            onPress={openInMaps}
            style={styles.proceedBtn}
          />
        )}
      </View>
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
    paddingBottom: 110,
  },
  mapIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    marginBottom: Spacing.xl,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  heroHubName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 220,
  },
  heroAddressText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  pricingBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.accentYellowLight,
    borderWidth: 1.5,
    borderColor: Colors.accentYellowMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
  },
  pricingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pricingSublabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pricingAmountCol: {
    alignItems: 'flex-end',
  },
  pricingAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  pricingUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  hoursText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.xl,
  },
  amenityCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    textAlign: 'center',
  },
  amenityName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 6,
    textAlign: 'center',
  },
  amenitySub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  floorSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  floorCountText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  floorCard: {
    marginBottom: 8,
    paddingVertical: 12,
  },
  floorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floorBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accentYellowLight,
    borderWidth: 1.5,
    borderColor: Colors.accentYellowMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  floorBadgeText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171717',
  },
  floorInfoCol: {
    flex: 1,
  },
  floorNameTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  floorCapacityText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  noFloorsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    marginBottom: Spacing.md,
  },
  noFloorsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  policyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(33, 136, 56, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(33, 136, 56, 0.2)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 10,
    marginTop: Spacing.lg,
  },
  policyText: {
    fontSize: 12,
    color: '#14532D',
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  bottomPriceCol: {
    marginRight: Spacing.md,
  },
  bottomPriceText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  bottomSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  proceedBtn: {
    flex: 1,
    maxWidth: 240,
  },
  noBookingBadgeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  noBookingBadgeDetailText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFAD00',
    letterSpacing: 0.5,
  },
  noBookingBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noBookingBannerText: {
    fontSize: 12,
    color: '#FFAD00',
    flex: 1,
    lineHeight: 16,
  },
});
