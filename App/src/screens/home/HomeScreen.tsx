import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  MapPin,
  Car,
  Zap,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { Card, Button, Badge, Input, EmptyState, CoreServicesShowcase, NetworkMapModal } from '../../components/common';
import { useAuth } from '../../store/AuthContext';
import { useBooking } from '../../store/BookingContext';
import { parkingApi } from '../../api/parkingApi';
import { bookingApi } from '../../api/bookingApi';
import { vehicleApi } from '../../api/vehicleApi';
import { ParkingLocation, Booking, Vehicle } from '../../types';

export interface HomeScreenProps {
  onNavigateToDiscovery: () => void;
  onSelectHub?: (hub: ParkingLocation) => void;
  onNavigateToBookingDetail: (booking: Booking) => void;
  onNavigateToActiveParking: (booking: Booking) => void;
  onNavigateToProfile: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToDiscovery,
  onSelectHub,
  onNavigateToBookingDetail,
  onNavigateToActiveParking,
  onNavigateToProfile,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { selectHub, setActiveBooking } = useBooking();

  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [activeBooking, setLocalActiveBooking] = useState<Booking | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const locData = await parkingApi.getLocations();
      setLocations(locData);

      if (isAuthenticated) {
        try {
          const userBookings = await bookingApi.getMyBookings();
          setRecentBookings(userBookings.slice(0, 3));
          
          const active = userBookings.find(
            (b) => b.status === 'Confirmed' || b.status === 'Slot Assigned' || b.status === 'Checked In'
          );
          if (active) {
            setLocalActiveBooking(active);
            setActiveBooking(active);
          } else {
            setLocalActiveBooking(null);
          }
        } catch (_) {}

        try {
          const userVehicles = await vehicleApi.getUserVehicles();
          setVehicles(userVehicles);
        } catch (_) {}
      }
    } catch (err) {
      console.warn('[HomeScreen] Error loading data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primaryYellow]}
            tintColor={Colors.primaryYellow}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Top Header & User Greeting ─── */}
        <View style={styles.headerRow}>
          <View>
            <View style={styles.logoRow}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoText}>DRIVIX</Text>
              </View>
              <Text style={styles.appTitle}>Smart Parking</Text>
            </View>
            <Text style={styles.greetingText}>
              {isAuthenticated && user
                ? `Hello, ${user.name.split(' ')[0]} 👋`
                : 'Welcome to Drivix 👋'}
            </Text>
          </View>

          {isAuthenticated ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onNavigateToProfile}
              style={styles.avatarButton}
            >
              <Text style={styles.avatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Button
              title="Sign In"
              variant="outline"
              size="sm"
              onPress={onNavigateToProfile}
            />
          )}
        </View>

        {/* ─── 2. Search & Primary Action Bar ─── */}
        <View style={styles.searchSection}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onNavigateToDiscovery}
            style={styles.searchBarTouch}
          >
            <Search size={20} color={Colors.textSecondary} />
            <Text style={styles.searchPlaceholder}>
              {searchQuery || 'Where do you want to park?'}
            </Text>
            <View style={styles.searchIconBtn}>
              <ArrowRight size={16} color="#171717" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── 3. Active Booking Banner (If Any) ─── */}
        {activeBooking && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onNavigateToActiveParking(activeBooking)}
          >
            <Card style={styles.activeBookingCard}>
              <View style={styles.activeBookingHeader}>
                <View style={styles.activeTagRow}>
                  <View style={styles.pulsingDot} />
                  <Text style={styles.activeTagText}>ACTIVE RESERVATION</Text>
                </View>
                <Badge
                  label={activeBooking.status}
                  variant={activeBooking.status === 'Checked In' ? 'available' : 'reserved'}
                />
              </View>

              <Text style={styles.activeHubTitle}>
                {typeof activeBooking.parkingHubId === 'object' && activeBooking.parkingHubId !== null
                  ? (activeBooking.parkingHubId as any).parkingName
                  : activeBooking.locationName}
              </Text>

              <View style={styles.activeMetaRow}>
                <View style={styles.activeMetaItem}>
                  <Layers size={14} color={Colors.textSecondary} />
                  <Text style={styles.activeMetaText}>
                    Floor {activeBooking.floor}
                    {activeBooking.slotId ? ` • Slot ${activeBooking.slotId}` : ' • Capacity Reserved'}
                  </Text>
                </View>
                <View style={styles.activeMetaItem}>
                  <Clock size={14} color={Colors.textSecondary} />
                  <Text style={styles.activeMetaText}>
                    {activeBooking.entryTime} ({activeBooking.duration}h)
                  </Text>
                </View>
              </View>

              <Button
                title="View Pass & Navigation"
                variant="primary"
                size="sm"
                onPress={() => onNavigateToActiveParking(activeBooking)}
                style={styles.activeCtaBtn}
              />
            </Card>
          </TouchableOpacity>
        )}

        {/* ─── 4. Quick Vehicle Info Card ─── */}
        {isAuthenticated && vehicles.length > 0 && (
          <Card style={styles.vehicleQuickCard}>
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleIconBadge}>
                <Car size={20} color="#171717" />
              </View>
              <View style={styles.vehicleInfoCol}>
                <Text style={styles.vehiclePlate}>
                  {vehicles[0].plate || vehicles[0].vehicleNumber}
                </Text>
                <Text style={styles.vehicleModel}>
                  {vehicles[0].model || 'Primary Vehicle'}
                  {vehicles[0].isEV ? ' • Electric EV' : ''}
                </Text>
              </View>
              {vehicles[0].isEV && (
                <View style={styles.evBadge}>
                  <Zap size={14} color="#15803D" />
                  <Text style={styles.evText}>EV Ready</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* ─── Core Services Showcase (Webapp Parity) ─── */}
        <CoreServicesShowcase
          onBookParking={onNavigateToDiscovery}
          onViewMap={() => setIsMapModalVisible(true)}
        />

        {/* ─── Recent Bookings Preview ─── */}
        {isAuthenticated && recentBookings.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            {recentBookings.map((b) => (
              <Card key={b._id} style={styles.recentCard}>
                <View style={styles.recentRow}>
                  <View style={styles.recentInfoCol}>
                    <Text style={styles.recentHubName}>{b.locationName}</Text>
                    <Text style={styles.recentTimeText}>
                      {b.entryDate} at {b.entryTime} • {b.duration}h
                    </Text>
                  </View>
                  <Badge
                    label={b.status}
                    variant={
                      b.status === 'Checked In' || b.status === 'completed'
                        ? 'available'
                        : b.status === 'Confirmed'
                        ? 'reserved'
                        : 'neutral'
                    }
                  />
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ─── Interactive Drivix Network Map Modal (Webapp Parity) ─── */}
      <NetworkMapModal
        visible={isMapModalVisible}
        onClose={() => setIsMapModalVisible(false)}
        onProceedToBooking={(hub) => {
          setIsMapModalVisible(false);
          selectHub(hub);
          onNavigateToDetail(hub);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 90,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoBadge: {
    backgroundColor: Colors.primaryYellow,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  logoText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: 1.5,
  },
  appTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#171717',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171717',
  },
  searchSection: {
    marginBottom: Spacing.xl,
  },
  searchBarTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  searchIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBookingCard: {
    backgroundColor: '#FFFDF0',
    borderColor: Colors.primaryYellow,
    borderWidth: 1.5,
    marginBottom: Spacing.lg,
  },
  activeBookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D93025',
    marginRight: 6,
  },
  activeTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  activeHubTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  activeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: Spacing.md,
  },
  activeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeMetaText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  activeCtaBtn: {
    marginTop: 4,
  },
  vehicleQuickCard: {
    marginBottom: Spacing.lg,
    paddingVertical: 12,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.accentYellowLight,
    borderWidth: 1,
    borderColor: Colors.accentYellowMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleInfoCol: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  vehicleModel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  evBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  evText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171717',
    textDecorationLine: 'underline',
  },
  hubCard: {
    marginBottom: Spacing.md,
  },
  hubHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  hubTitleCol: {
    flex: 1,
    marginRight: 12,
  },
  hubName: {
    fontSize: 17,
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
  priceCol: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  pricePeriod: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  capacityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  amenityChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  hubReserveBtn: {
    marginTop: Spacing.sm,
  },
  recentSection: {
    marginTop: Spacing.lg,
  },
  recentCard: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentInfoCol: {
    flex: 1,
  },
  recentHubName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  recentTimeText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
