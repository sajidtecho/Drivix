import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  TextInput,
  Linking,
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
  AlertTriangle,
  FileText,
  CheckCircle2,
  PhoneCall,
  X,
  ChevronRight,
  Wrench,
  Compass,
  Ticket,
  Tag,
  Check,
  Award,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import {
  Card,
  Button,
  Badge,
  NetworkMapModal,
} from '../../components/common';
import { useAuth } from '../../store/AuthContext';
import { useBooking } from '../../store/BookingContext';
import { parkingApi } from '../../api/parkingApi';
import { bookingApi } from '../../api/bookingApi';
import { vehicleApi } from '../../api/vehicleApi';
import { ParkingLocation, Booking, Vehicle } from '../../types';
import {
  fetchChallansForPlate,
  ROADSIDE_SERVICES,
  ChallanItem,
} from '../../services/vehicleUtilities';
import { IN_HUB_VEHICLE_SERVICES } from '../../services/vehicleCareServices';
import { getUserLiveLocation, UserCoordinates } from '../../services/locationService';

export interface HomeScreenProps {
  onNavigateToDiscovery: () => void;
  onNavigateToCarWash?: () => void;
  onSelectHub?: (hub: ParkingLocation) => void;
  onNavigateToBookingDetail: (booking: Booking) => void;
  onNavigateToActiveParking: (booking: Booking) => void;
  onNavigateToProfile: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToDiscovery,
  onNavigateToCarWash,
  onSelectHub,
  onNavigateToBookingDetail,
  onNavigateToActiveParking,
  onNavigateToProfile,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { selectHub, setActiveBooking } = useBooking();

  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [activeBooking, setLocalActiveBooking] = useState<Booking | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState(0);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // E-Challan State
  const [challanModalVisible, setChallanModalVisible] = useState(false);
  const [challanPlate, setChallanPlate] = useState('UP16AB1234');
  const [challanResults, setChallanResults] = useState<ChallanItem[]>([]);
  const [hasCheckedChallans, setHasCheckedChallans] = useState(false);
  const [isCheckingChallan, setIsCheckingChallan] = useState(false);

  // SOS & Car Care Modals
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [carCareModalVisible, setCarCareModalVisible] = useState(false);
  const [insuranceModalVisible, setInsuranceModalVisible] = useState(false);
  const [commuterPassModalVisible, setCommuterPassModalVisible] = useState(false);
  const [selectedPassPlan, setSelectedPassPlan] = useState<'10_days' | 'monthly' | 'fleet'>('monthly');
  const [userCoords, setUserCoords] = useState<UserCoordinates | null>(null);

  const activeVehicle = vehicles[selectedVehicleIdx] || null;
  const currentPlate = activeVehicle?.plate || activeVehicle?.vehicleNumber || 'DL01AB1234';

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      getUserLiveLocation()
        .then((coords) => {
          if (coords) setUserCoords(coords);
        })
        .catch(() => {});

      const locData = await parkingApi.getLocations();
      setLocations(locData);

      if (isAuthenticated) {
        try {
          const userBookings = await bookingApi.getMyBookings();
          setRecentBookings(userBookings.slice(0, 3));

          const active = userBookings.find(
            (b) =>
              b.status === 'Confirmed' ||
              b.status === 'Slot Assigned' ||
              b.status === 'Checked In'
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
          if (userVehicles.length > 0) {
            const p = userVehicles[0].plate || userVehicles[0].vehicleNumber || 'DL01AB1234';
            setChallanPlate(p);
          }
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

  const handleCheckChallans = () => {
    setIsCheckingChallan(true);
    setTimeout(() => {
      const results = fetchChallansForPlate(challanPlate);
      setChallanResults(results);
      setHasCheckedChallans(true);
      setIsCheckingChallan(false);
    }, 800);
  };

  const handlePayChallan = (challan: ChallanItem) => {
    Alert.alert(
      'Pay E-Challan',
      `Clear violation "${challan.violation}" for ₹${challan.amount}?\n\nChallan ID: ${challan.challanNumber}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay via UPI',
          onPress: () => {
            setChallanResults((prev) =>
              prev.map((c) => (c.id === challan.id ? { ...c, status: 'settled' } : c))
            );
            Alert.alert(
              'Challan Settled! ✓',
              `Payment of ₹${challan.amount} confirmed with RTO Traffic Police. Official disposal receipt generated.`
            );
          },
        },
      ]
    );
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
        {/* ─── 1. Header & Greeting ─── */}
        <View style={styles.headerRow}>
          <View>
            <View style={styles.logoRow}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoText}>DRIVIX</Text>
              </View>
              <View style={styles.cityPill}>
                <MapPin size={11} color="#15803D" />
                <Text style={styles.cityPillText}>Delhi NCR • Noida</Text>
              </View>
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

        {/* ─── 2. Search Bar ─── */}
        <View style={styles.searchSection}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onNavigateToDiscovery}
            style={styles.searchBarTouch}
          >
            <Search size={20} color={Colors.textSecondary} />
            <Text style={styles.searchPlaceholder}>
              Search smart hubs, metro, malls...
            </Text>
            <View style={styles.searchIconBtn}>
              <ArrowRight size={16} color="#171717" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── 3. My Vehicle Status Card ─── */}
        <Card style={styles.commandCenterCard}>
          <View style={styles.commandCenterHeader}>
            <View style={styles.carPlateRow}>
              <View style={styles.plateNumberTag}>
                <Text style={styles.plateNumberText}>{currentPlate}</Text>
              </View>
              <Text style={styles.carModelText} numberOfLines={1}>
                {activeVehicle?.model || 'Primary Car'}
                {activeVehicle?.isEV ? ' • EV' : ''}
              </Text>
            </View>

            {vehicles.length > 1 && (
              <TouchableOpacity
                onPress={() =>
                  setSelectedVehicleIdx((prev) => (prev + 1) % vehicles.length)
                }
                style={styles.switchCarBtn}
              >
                <Text style={styles.switchCarText}>Switch</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Clean 3 Status Modules Row */}
          <View style={styles.commandModulesRow}>
            {/* Module 1: E-Challan Radar */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setChallanPlate(currentPlate);
                setChallanModalVisible(true);
                handleCheckChallans();
              }}
              style={styles.commandModuleItem}
            >
              <View style={styles.moduleTopRow}>
                <AlertTriangle size={14} color="#F59E0B" />
                <Text style={styles.moduleLabel}>Challans</Text>
              </View>
              <Text style={[styles.moduleValue, { color: '#15803D' }]}>0 Fines</Text>
              <Text style={styles.moduleSubText}>Check RTO</Text>
            </TouchableOpacity>

            <View style={styles.moduleDivider} />

            {/* Module 2: Document Vault */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onNavigateToProfile}
              style={styles.commandModuleItem}
            >
              <View style={styles.moduleTopRow}>
                <ShieldCheck size={14} color="#10B981" />
                <Text style={styles.moduleLabel}>Doc Vault</Text>
              </View>
              <Text style={styles.moduleValue}>Protected</Text>
              <Text style={styles.moduleSubText}>RC • PUC • Ins</Text>
            </TouchableOpacity>

            <View style={styles.moduleDivider} />

            {/* Module 3: In-Bay Care */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (onNavigateToCarWash) {
                  onNavigateToCarWash();
                } else {
                  setCarCareModalVisible(true);
                }
              }}
              style={styles.commandModuleItem}
            >
              <View style={styles.moduleTopRow}>
                <Wrench size={14} color={Colors.primaryYellow} />
                <Text style={styles.moduleLabel}>Car Care</Text>
              </View>
              <Text style={styles.moduleValue}>In-Bay</Text>
              <Text style={styles.moduleSubText}>Find Studios</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* ─── 4. Quick Mobility Services (Fresh 2x3 Grid) ─── */}
        <View style={styles.quickGridContainer}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeaderTitle}>QUICK MOBILITY SERVICES</Text>
            <View style={styles.parkPlusBadge}>
              <Sparkles size={11} color="#171717" />
              <Text style={styles.parkPlusBadgeText}>ALL-IN-ONE</Text>
            </View>
          </View>

          {/* Row 1 */}
          <View style={styles.iconGridRow}>
            {/* 1. Book Parking */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onNavigateToDiscovery}
              style={styles.gridActionItem}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: '#FEF08A' }]}>
                <Text style={styles.gridEmoji}>🅿️</Text>
              </View>
              <Text style={styles.gridLabel}>Book Spot</Text>
            </TouchableOpacity>

            {/* 2. E-Challans */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setChallanPlate(currentPlate);
                setChallanModalVisible(true);
                handleCheckChallans();
              }}
              style={styles.gridActionItem}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Text style={styles.gridEmoji}>🚨</Text>
              </View>
              <Text style={styles.gridLabel}>Challans</Text>
            </TouchableOpacity>

            {/* 3. In-Bay Wash & Car Spa (Navigates directly to Car Wash Discovery) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (onNavigateToCarWash) {
                  onNavigateToCarWash();
                } else {
                  setCarCareModalVisible(true);
                }
              }}
              style={styles.gridActionItem}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: '#EDE9FE' }]}>
                <Text style={styles.gridEmoji}>🧼</Text>
              </View>
              <Text style={styles.gridLabel}>In-Bay Wash</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={[styles.iconGridRow, { marginTop: 14 }]}>
            {/* 4. Document Vault */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onNavigateToProfile}
              style={styles.gridActionItem}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Text style={styles.gridEmoji}>🛡️</Text>
              </View>
              <Text style={styles.gridLabel}>Doc Vault</Text>
            </TouchableOpacity>

            {/* 5. EV Hubs */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onNavigateToDiscovery}
              style={styles.gridActionItem}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: '#ECFCCB' }]}>
                <Text style={styles.gridEmoji}>🔌</Text>
              </View>
              <Text style={styles.gridLabel}>EV Hubs</Text>
            </TouchableOpacity>

            {/* 6. Roadside SOS */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSosModalVisible(true)}
              style={styles.gridActionItem}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: '#FFE4E6' }]}>
                <Text style={styles.gridEmoji}>🆘</Text>
              </View>
              <Text style={styles.gridLabel}>24/7 SOS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── 5. Active Booking Banner (If Any) ─── */}
        {activeBooking && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onNavigateToActiveParking(activeBooking)}
          >
            <Card style={styles.activeBookingCard}>
              <View style={styles.activeBookingHeader}>
                <View style={styles.activeTagRow}>
                  <View style={styles.pulsingDot} />
                  <Text style={styles.activeTagText}>ACTIVE PARKING SESSION</Text>
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
                    {activeBooking.slotId ? ` • Slot ${activeBooking.slotId}` : ' • Level Reserved'}
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
                title="Open Gate Pass & Scanner"
                variant="primary"
                size="sm"
                onPress={() => onNavigateToActiveParking(activeBooking)}
                style={styles.activeCtaBtn}
              />
            </Card>
          </TouchableOpacity>
        )}

        {/* ─── 6. Compact Live Parking Network Map Launcher ─── */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setIsMapModalVisible(true)}
          style={styles.networkMapBanner}
        >
          <View style={styles.networkMapIconWrap}>
            <Compass size={18} color="#171717" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.networkMapTitle}>Live Parking Network Map</Text>
            <Text style={styles.networkMapSub}>
              Explore 28+ verified Delhi NCR smart hubs & real-time capacity
            </Text>
          </View>
          <View style={styles.networkMapBadge}>
            <Text style={styles.networkMapBadgeText}>MAP</Text>
          </View>
        </TouchableOpacity>

        {/* ─── 7. Recent Bookings Preview ─── */}
        {isAuthenticated && recentBookings.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionHeaderTitle}>RECENT BOOKINGS</Text>
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

      {/* ─── MODAL 1: E-CHALLAN LOOKUP & SETTLEMENT ─── */}
      <Modal
        visible={challanModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setChallanModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>E-Challan Radar</Text>
                <Text style={styles.modalSub}>Check & settle traffic fines across India</Text>
              </View>
              <TouchableOpacity onPress={() => setChallanModalVisible(false)}>
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.challanSearchRow}>
              <TextInput
                style={styles.challanInput}
                placeholder="Enter Plate (e.g. UP16AB1234)"
                value={challanPlate}
                onChangeText={(t) => setChallanPlate(t.toUpperCase())}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                onPress={handleCheckChallans}
                style={styles.challanSearchBtn}
              >
                <Text style={styles.challanSearchBtnText}>
                  {isCheckingChallan ? '...' : 'Check'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
              {hasCheckedChallans && challanResults.length === 0 ? (
                <View style={styles.cleanRecordBox}>
                  <CheckCircle2 size={36} color="#15803D" />
                  <Text style={styles.cleanRecordTitle}>No Pending Challans!</Text>
                  <Text style={styles.cleanRecordSub}>
                    Zero outstanding traffic fines detected for {challanPlate}. Your driving record is completely clean.
                  </Text>
                </View>
              ) : (
                challanResults.map((ch) => (
                  <Card key={ch.id} style={styles.challanItemCard}>
                    <View style={styles.challanItemTop}>
                      <Text style={styles.challanNum}>{ch.challanNumber}</Text>
                      <Badge
                        label={ch.status === 'settled' ? 'Settled ✓' : 'Pending Fine'}
                        variant={ch.status === 'settled' ? 'available' : 'surge'}
                      />
                    </View>
                    <Text style={styles.challanViolation}>{ch.violation}</Text>
                    <Text style={styles.challanLocation}>📍 {ch.location}</Text>
                    <Text style={styles.challanDate}>Issued: {ch.date}</Text>

                    <View style={styles.challanPayRow}>
                      <Text style={styles.challanAmount}>Fine: ₹{ch.amount}</Text>
                      {ch.status === 'pending' && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handlePayChallan(ch)}
                          style={styles.payChallanBtn}
                        >
                          <Text style={styles.payChallanBtnText}>Clear Fine Now</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </Card>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 2: 24/7 ROADSIDE SOS ─── */}
      <Modal
        visible={sosModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSosModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>24/7 Roadside Assistance</Text>
                <Text style={styles.modalSub}>Emergency patrol dispatched to your GPS location</Text>
              </View>
              <TouchableOpacity onPress={() => setSosModalVisible(false)}>
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => Linking.openURL('tel:18002004848').catch(() => {})}
              style={styles.sosCallBanner}
            >
              <PhoneCall size={22} color="#FFFFFF" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.sosCallTitle}>Instant SOS Dispatch Hotline</Text>
                <Text style={styles.sosCallSub}>Toll-Free: 1800-200-4848 (24x7 Priority)</Text>
              </View>
              <Text style={styles.sosCallBtnTag}>CALL</Text>
            </TouchableOpacity>

            <Text style={[styles.chipHeaderLabel, { marginTop: 16 }]}>Assistance Services</Text>
            <View style={{ gap: 10 }}>
              {ROADSIDE_SERVICES.map((srv) => (
                <View key={srv.id} style={styles.sosServiceRow}>
                  <View style={styles.sosIconBox}>
                    <Wrench size={16} color={Colors.primaryYellow} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sosServiceName}>{srv.title}</Text>
                    <Text style={styles.sosServiceSub}>{srv.subtitle}</Text>
                  </View>
                  <Text style={styles.sosEtaBadge}>ETA: {srv.eta}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 3: IN-BAY CAR CARE DETAIL ─── */}
      <Modal
        visible={carCareModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCarCareModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>While-You-Park Car Care</Text>
                <Text style={styles.modalSub}>Professional detailing done while your car is parked</Text>
              </View>
              <TouchableOpacity onPress={() => setCarCareModalVisible(false)}>
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {IN_HUB_VEHICLE_SERVICES.map((srv) => (
                <Card key={srv.id} style={styles.carCareItemCard}>
                  <View style={styles.carCareItemRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.carCareItemTitle}>{srv.name}</Text>
                        {srv.popular && (
                          <View style={styles.popularTag}>
                            <Text style={styles.popularTagText}>POPULAR</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.carCareItemTagline}>{srv.tagline}</Text>
                      <Text style={styles.carCareDuration}>⏱️ Approx {srv.durationMinutes} mins in-bay</Text>
                    </View>
                    <View style={styles.carCarePriceCol}>
                      <Text style={styles.carCarePriceText}>₹{srv.price}</Text>
                    </View>
                  </View>
                </Card>
              ))}
            </ScrollView>

            <Button
              title="Book Spot with Car Care"
              variant="primary"
              onPress={() => {
                setCarCareModalVisible(false);
                onNavigateToDiscovery();
              }}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 4: INSTANT INSURANCE RENEWAL & QUOTE ─── */}
      <Modal
        visible={insuranceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInsuranceModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Instant Insurance Renewal</Text>
                <Text style={styles.modalSub}>Policy #{currentPlate} • Due in 14 days</Text>
              </View>
              <TouchableOpacity onPress={() => setInsuranceModalVisible(false)}>
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Savings Highlight */}
              <View style={styles.insQuoteHero}>
                <View style={styles.insQuoteHeroTag}>
                  <Award size={13} color="#15803D" />
                  <Text style={styles.insQuoteHeroTagText}>50% No-Claim Bonus (NCB) Applied</Text>
                </View>
                <Text style={styles.insQuoteHeroTitle}>Comprehensive Motor Cover</Text>
                <Text style={styles.insQuoteHeroSub}>
                  Includes Zero-Depreciation, Engine Gearbox Protect & 24x7 Roadside Assistance
                </Text>
              </View>

              <Text style={[styles.chipHeaderLabel, { marginTop: 14 }]}>Compare Verified Quotes</Text>

              {/* Quote 1: HDFC ERGO */}
              <Card style={styles.insurancePlanCard}>
                <View style={styles.insRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.insProviderName}>HDFC ERGO General</Text>
                    <Text style={styles.insCoverageText}>Zero-Dep • 98.4% Settlement Rate</Text>
                    <Text style={styles.insCashlessText}>✓ 7,800+ Cashless Garages</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.insPriceText}>₹2,099</Text>
                    <Text style={styles.insYearText}>/year + GST</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.insSelectBtn}
                  onPress={() => {
                    setInsuranceModalVisible(false);
                    Alert.alert(
                      'Policy Renewed! ✓',
                      `HDFC ERGO Comprehensive Policy for ${currentPlate} has been renewed. Policy document has been synced to your Doc Vault.`
                    );
                  }}
                >
                  <Text style={styles.insSelectBtnText}>Renew in 1-Click with UPI</Text>
                </TouchableOpacity>
              </Card>

              {/* Quote 2: GoDigit */}
              <Card style={styles.insurancePlanCard}>
                <View style={styles.insRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.insProviderName}>Digit Smart Cover</Text>
                    <Text style={styles.insCoverageText}>Engine Protect + Consumables included</Text>
                    <Text style={styles.insCashlessText}>✓ Paperless claim approval in 15 mins</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.insPriceText}>₹2,349</Text>
                    <Text style={styles.insYearText}>/year + GST</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.insSelectBtn}
                  onPress={() => {
                    setInsuranceModalVisible(false);
                    Alert.alert(
                      'Policy Renewed! ✓',
                      `Digit Policy for ${currentPlate} has been renewed. Document saved to Doc Vault.`
                    );
                  }}
                >
                  <Text style={styles.insSelectBtnText}>Renew in 1-Click with UPI</Text>
                </TouchableOpacity>
              </Card>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 5: COMMUTER PASS ACTIVATION ─── */}
      <Modal
        visible={commuterPassModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCommuterPassModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Daily Commuter Smart Pass</Text>
                <Text style={styles.modalSub}>Seamless multi-entry parking at tech parks & hubs</Text>
              </View>
              <TouchableOpacity onPress={() => setCommuterPassModalVisible(false)}>
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.passSelectRow}>
                {/* 10-Entry Pass */}
                <TouchableOpacity
                  style={[
                    styles.passOptionCard,
                    selectedPassPlan === '10_days' && styles.passOptionCardActive,
                  ]}
                  onPress={() => setSelectedPassPlan('10_days')}
                >
                  <Text style={styles.passOptionTitle}>10-Entry Flexi</Text>
                  <Text style={styles.passOptionSubtitle}>Valid 30 Days • Any Hub</Text>
                  <Text style={styles.passOptionPrice}>₹799</Text>
                  <Text style={styles.passOptionSubtext}>₹79.90 / visit</Text>
                </TouchableOpacity>

                {/* 1-Month Unlimited Pass */}
                <TouchableOpacity
                  style={[
                    styles.passOptionCard,
                    selectedPassPlan === 'monthly' && styles.passOptionCardActive,
                  ]}
                  onPress={() => setSelectedPassPlan('monthly')}
                >
                  <View style={styles.popularMiniTagAbsolute}>
                    <Text style={styles.popularMiniTagText}>POPULAR</Text>
                  </View>
                  <Text style={styles.passOptionTitle}>Monthly Unlimited</Text>
                  <Text style={styles.passOptionSubtitle}>30 Days Unlimited In/Out</Text>
                  <Text style={styles.passOptionPrice}>₹1,999</Text>
                  <Text style={styles.passOptionSubtext}>Zero surge fees</Text>
                </TouchableOpacity>
              </View>

              {/* Pass Highlights */}
              <View style={styles.passFeaturesList}>
                <View style={styles.passFeatureItem}>
                  <CheckCircle2 size={16} color="#15803D" />
                  <Text style={styles.passFeatureText}>
                    Barrier opens automatically via ANPR License Plate Scan
                  </Text>
                </View>
                <View style={styles.passFeatureItem}>
                  <CheckCircle2 size={16} color="#15803D" />
                  <Text style={styles.passFeatureText}>
                    Guaranteed floor parking capacity even during rush hours
                  </Text>
                </View>
                <View style={styles.passFeatureItem}>
                  <CheckCircle2 size={16} color="#15803D" />
                  <Text style={styles.passFeatureText}>
                    Free cancellation & prorated refund within 7 days
                  </Text>
                </View>
              </View>

              <Button
                title={`Activate ${
                  selectedPassPlan === '10_days' ? '10-Entry Pass (₹799)' : 'Monthly Pass (₹1,999)'
                }`}
                variant="primary"
                onPress={() => {
                  setCommuterPassModalVisible(false);
                  Alert.alert(
                    'Commuter Pass Activated! 🎉',
                    `Your pass has been bound to plate ${currentPlate}. You can now drive straight into any Drivix Smart Hub without paying at the gate.`
                  );
                }}
                style={{ marginTop: Spacing.md }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Interactive Drivix Network Map Modal ─── */}
      <NetworkMapModal
        visible={isMapModalVisible}
        onClose={() => setIsMapModalVisible(false)}
        onProceedToBooking={(hub) => {
          setIsMapModalVisible(false);
          selectHub(hub);
          if (onSelectHub) {
            onSelectHub(hub);
          } else {
            onNavigateToDiscovery();
          }
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
    marginBottom: Spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  logoBadge: {
    backgroundColor: Colors.primaryYellow,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  logoText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: 1.5,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    gap: 3,
  },
  cityPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '900',
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
    marginBottom: Spacing.md,
  },
  searchBarTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  searchIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ─── Vehicle Command Center Widget ─── */
  commandCenterCard: {
    backgroundColor: '#151926',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  commandCenterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 8,
  },
  carPlateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  plateNumberTag: {
    backgroundColor: Colors.primaryYellow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  plateNumberText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 0.5,
  },
  carModelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E5E7EB',
    flex: 1,
  },
  switchCarBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  switchCarText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryYellow,
  },
  commandModulesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commandModuleItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  moduleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  moduleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  moduleValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  moduleSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  moduleSubText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
  },
  statusDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  moduleDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  /* ─── Quick Services Grid (2x3) ─── */
  quickGridContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  parkPlusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryYellow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  parkPlusBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: 0.5,
  },
  iconGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  gridActionItem: {
    flex: 1,
    alignItems: 'center',
  },
  gridIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  gridEmoji: {
    fontSize: 24,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  /* ─── Active Booking Card ─── */
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
    marginBottom: Spacing.sm,
  },
  activeTagRow: {
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
  activeTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  activeHubTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  activeMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: Spacing.md,
  },
  activeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeCtaBtn: {
    width: '100%',
  },

  /* ─── Network Map Compact Banner ─── */
  networkMapBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2333',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: Spacing.lg,
  },
  networkMapIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkMapTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  networkMapSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  networkMapBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: Colors.primaryYellow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  networkMapBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.primaryYellow,
    letterSpacing: 0.5,
  },

  /* ─── Recent Section ─── */
  recentSection: {
    marginTop: Spacing.xs,
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
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  recentTimeText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  /* ─── Modals Styles ─── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chipHeaderLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },

  /* Challan Modal */
  challanSearchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  challanInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  challanSearchBtn: {
    backgroundColor: Colors.primaryYellow,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challanSearchBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#171717',
  },
  cleanRecordBox: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 16,
  },
  cleanRecordTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
    marginTop: 8,
    marginBottom: 4,
  },
  cleanRecordSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  challanItemCard: {
    marginBottom: 10,
    padding: Spacing.md,
  },
  challanItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  challanNum: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  challanViolation: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  challanLocation: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  challanDate: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  challanPayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  challanAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.error,
  },
  payChallanBtn: {
    backgroundColor: Colors.primaryYellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  payChallanBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171717',
  },

  /* Roadside SOS Modal */
  sosCallBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: BorderRadius.md,
    padding: 14,
  },
  sosCallTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sosCallSub: {
    fontSize: 11,
    color: '#FEE2E2',
    marginTop: 2,
  },
  sosCallBtnTag: {
    fontSize: 12,
    fontWeight: '900',
    color: '#DC2626',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    overflow: 'hidden',
  },
  sosServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.md,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sosIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosServiceName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sosServiceSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  sosEtaBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },

  /* In-Bay Car Care Modal */
  carCareItemCard: {
    marginBottom: 10,
    padding: 12,
  },
  carCareItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carCareItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  popularTag: {
    backgroundColor: Colors.primaryYellow,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  popularTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#171717',
  },
  carCareItemTagline: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  carCareDuration: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
    marginTop: 4,
  },
  carCarePriceCol: {
    marginLeft: 12,
  },
  carCarePriceText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },

  /* ─── Insurance Compliance Banner Styles ─── */
  insuranceComplianceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 16,
  },
  insuranceIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insuranceBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  ncbBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ncbBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#15803D',
  },
  insuranceBannerSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 15,
  },
  insuranceRenewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC928',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  insuranceRenewBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171717',
    marginRight: 2,
  },

  /* ─── Commuter Pass Card Styles ─── */
  commuterPassCard: {
    backgroundColor: '#171717',
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 40, 0.25)',
  },
  commuterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  commuterTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFC928',
    letterSpacing: 0.5,
  },
  commuterSaveBadge: {
    backgroundColor: 'rgba(255, 201, 40, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 40, 0.4)',
  },
  commuterSaveBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFC928',
  },
  commuterSubtitle: {
    fontSize: 11.5,
    color: '#D1D5DB',
    lineHeight: 16,
  },
  commuterPlansRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  commuterPlanChip: {
    flex: 1,
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    position: 'relative',
  },
  commuterPlanChipActive: {
    backgroundColor: 'rgba(255, 201, 40, 0.12)',
    borderColor: '#FFC928',
  },
  commuterPlanChipDays: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#A3A3A3',
    marginBottom: 3,
  },
  commuterPlanChipActiveText: {
    color: '#FFFFFF',
  },
  commuterPlanChipPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#E5E7EB',
  },
  commuterPlanChipActivePrice: {
    color: '#FFC928',
  },
  popularMiniTag: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#FFC928',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  popularMiniTagAbsolute: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFC928',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularMiniTagText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#171717',
  },
  commuterBenefitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#262626',
    marginBottom: 4,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  benefitText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },

  /* ─── Insurance Modal Styles ─── */
  insQuoteHero: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: BorderRadius.md,
    padding: 14,
    marginBottom: 6,
  },
  insQuoteHeroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  insQuoteHeroTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  insQuoteHeroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 2,
  },
  insQuoteHeroSub: {
    fontSize: 11.5,
    color: '#15803D',
    lineHeight: 16,
  },
  insurancePlanCard: {
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  insRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  insProviderName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  insCoverageText: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  insCashlessText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 4,
  },
  insPriceText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  insYearText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  insSelectBtn: {
    backgroundColor: '#FFC928',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  insSelectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171717',
  },

  /* ─── Commuter Pass Modal Styles ─── */
  passSelectRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  passOptionCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.md,
    padding: 14,
    position: 'relative',
  },
  passOptionCardActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  passOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  passOptionSubtitle: {
    fontSize: 10.5,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  passOptionPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  passOptionSubtext: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  passFeaturesList: {
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.md,
    padding: 14,
    gap: 10,
    marginBottom: 6,
  },
  passFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passFeatureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
});
