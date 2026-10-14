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
  Fuel,
  AlertTriangle,
  CreditCard,
  FileText,
  CheckCircle2,
  PhoneCall,
  X,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Wrench,
  Compass,
  Check,
  Flame,
  Coins,
  Navigation,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import {
  Card,
  Button,
  Badge,
  Input,
  NetworkMapModal,
} from '../../components/common';
import { useAuth } from '../../store/AuthContext';
import { useBooking } from '../../store/BookingContext';
import { parkingApi } from '../../api/parkingApi';
import { bookingApi } from '../../api/bookingApi';
import { vehicleApi } from '../../api/vehicleApi';
import { ParkingLocation, Booking, Vehicle } from '../../types';
import {
  getInitialFASTagAccount,
  fetchChallansForPlate,
  ROADSIDE_SERVICES,
  FASTagAccount,
  ChallanItem,
  NCR_EXPRESSWAY_ROUTES,
  ExpresswayRoute,
} from '../../services/vehicleUtilities';
import {
  SUPPORTED_INDIAN_CITIES,
  fetchLiveFuelRates,
  CityFuelInfo,
} from '../../services/fuelRateService';
import { IN_HUB_VEHICLE_SERVICES } from '../../services/vehicleCareServices';


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

  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [activeBooking, setLocalActiveBooking] = useState<Booking | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState(0);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ─── Park+ Parity Interactive Utilities State ───────────────────────
  const [fastagAccount, setFastagAccount] = useState<FASTagAccount>(
    getInitialFASTagAccount('DL01AB1234')
  );
  const [fastagModalVisible, setFastagModalVisible] = useState(false);
  const [rechargePill, setRechargePill] = useState(500);
  const [isRecharging, setIsRecharging] = useState(false);

  const [challanModalVisible, setChallanModalVisible] = useState(false);
  const [challanPlate, setChallanPlate] = useState('UP16AB1234');
  const [challanResults, setChallanResults] = useState<ChallanItem[]>([]);
  const [hasCheckedChallans, setHasCheckedChallans] = useState(false);
  const [isCheckingChallan, setIsCheckingChallan] = useState(false);

  const [fuelModalVisible, setFuelModalVisible] = useState(false);
  const [selectedCityFuel, setSelectedCityFuel] = useState<CityFuelInfo>(SUPPORTED_INDIAN_CITIES[0]);
  const [isSyncingFuel, setIsSyncingFuel] = useState(false);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [carCareModalVisible, setCarCareModalVisible] = useState(false);

  // ─── 3 New Features State: Toll Calculator, Miles Rewards, Hubs ───
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [userMiles, setUserMiles] = useState(350);
  const [redeemedMiles, setRedeemedMiles] = useState(false);

  const handleRedeemMiles = () => {
    if (redeemedMiles) {
      Alert.alert('Reward Active', 'Promo code "DRIVIX50" is already active on your account for ₹50 off.');
      return;
    }
    Alert.alert(
      'Redeem 350 Drivix Miles 🪙',
      'Convert 350 miles into an instant ₹50 voucher applicable on your next parking reservation or in-bay car wash?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply ₹50 Discount',
          onPress: () => {
            setRedeemedMiles(true);
            setUserMiles((prev) => Math.max(0, prev - 350));
            Alert.alert(
              '🎉 ₹50 Voucher Unlocked!',
              'Voucher code "DRIVIX50" is activated! ₹50 will be auto-deducted from your checkout pass.'
            );
          },
        },
      ]
    );
  };

  const handleSwitchCityFuel = async (cityKey: string) => {
    setIsSyncingFuel(true);
    try {
      const res = await fetchLiveFuelRates(cityKey);
      setSelectedCityFuel(res);
    } finally {
      setIsSyncingFuel(false);
    }
  };

  const activeVehicle = vehicles[selectedVehicleIdx] || null;
  const currentPlate = activeVehicle?.plate || activeVehicle?.vehicleNumber || 'DL01AB1234';

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
            setFastagAccount(getInitialFASTagAccount(p));
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

  // ─── FASTag Top-up Handler ───
  const handleRechargeFASTag = () => {
    setIsRecharging(true);
    setTimeout(() => {
      setFastagAccount((prev) => ({
        ...prev,
        balance: prev.balance + rechargePill,
        lastRecharged: 'Just now',
        status: 'active',
      }));
      setIsRecharging(false);
      setFastagModalVisible(false);
      Alert.alert(
        'FASTag Recharged Successfully! ⚡',
        `₹${rechargePill} has been added to your ${fastagAccount.bank} wallet for ${currentPlate}. Current Balance: ₹${fastagAccount.balance + rechargePill}.`
      );
    }, 1200);
  };

  // ─── E-Challan Search Handler ───
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
        {/* ─── 1. Top Header & User Greeting ─── */}
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

        {/* ─── 2. Search & Primary Action Bar ─── */}
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

        {/* ─── 3. My Vehicle Command Center (Park+ Super-Widget) ─── */}
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

          {/* 3 Status Modules Row */}
          <View style={styles.commandModulesRow}>
            {/* Module 1: FASTag Balance */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setFastagModalVisible(true)}
              style={styles.commandModuleItem}
            >
              <View style={styles.moduleTopRow}>
                <CreditCard size={14} color={Colors.primaryYellow} />
                <Text style={styles.moduleLabel}>FASTag</Text>
              </View>
              <Text style={styles.moduleValue}>₹{fastagAccount.balance}</Text>
              <View style={styles.moduleSubRow}>
                <View style={styles.statusDotActive} />
                <Text style={styles.moduleSubText}>+ Top Up</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.moduleDivider} />

            {/* Module 2: E-Challan Radar */}
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

            {/* Module 3: Document Vault Expiry */}
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
          </View>
        </Card>

        {/* ─── 4. High-Frequency 8-Icon Quick Action Grid (2x4) ─── */}
        <View style={styles.quickGridContainer}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeaderTitle}>QUICK MOBILITY SERVICES</Text>
            <View style={styles.parkPlusBadge}>
              <Sparkles size={11} color="#171717" />
              <Text style={styles.parkPlusBadgeText}>ALL-IN-ONE</Text>
            </View>
          </View>

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

            {/* 2. FASTag */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setFastagModalVisible(true)}
              style={styles.gridActionItem}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Text style={styles.gridEmoji}>⚡</Text>
              </View>
              <Text style={styles.gridLabel}>FASTag</Text>
            </TouchableOpacity>

            {/* 3. E-Challans */}
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

            {/* 4. Car Wash / Care */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setCarCareModalVisible(true)}
              style={styles.gridActionItem}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: '#EDE9FE' }]}>
                <Text style={styles.gridEmoji}>🧼</Text>
              </View>
              <Text style={styles.gridLabel}>In-Bay Wash</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.iconGridRow, { marginTop: 14 }]}>
            {/* 5. Document Vault */}
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

            {/* 6. EV Fast Charging */}
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

            {/* 7. Fuel Rates */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setFuelModalVisible(true)}
              style={styles.gridActionItem}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.gridEmoji}>⛽</Text>
              </View>
              <Text style={styles.gridLabel}>Fuel Rates</Text>
            </TouchableOpacity>

            {/* 8. Roadside SOS */}
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

        {/* ─── 5. Daily Live City Fuel & EV Price Ticker (Park+ Hook) ─── */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setFuelModalVisible(true)}
          style={styles.fuelTickerCard}
        >
          <View style={styles.fuelTickerLeft}>
            <View style={styles.fuelFlameCircle}>
              <Fuel size={14} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.fuelTickerTitle}>
                  DAILY COMMUTE RADAR ({selectedCityFuel.cityName.toUpperCase()})
                </Text>
                <View style={styles.fuelLiveTag}>
                  <Text style={styles.fuelLiveTagText}>LIVE SYNC</Text>
                </View>
              </View>
              <Text style={styles.fuelTickerRates}>
                Petrol: ₹{selectedCityFuel.rates.petrol} • Diesel: ₹{selectedCityFuel.rates.diesel} • CNG: ₹{selectedCityFuel.rates.cng} • EV: ₹{selectedCityFuel.rates.evFastDC}/u
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* ─── FEATURE 1: Drivix Miles & Cashback Rewards Bar ─── */}
        <View style={styles.milesCard}>
          <View style={styles.milesLeftCol}>
            <View style={styles.milesCoinBadge}>
              <Coins size={16} color="#B45309" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.milesTitle}>{userMiles} Drivix Miles</Text>
                <View style={styles.milesCashTag}>
                  <Text style={styles.milesCashTagText}>Worth ₹{Math.floor(userMiles / 7)}</Text>
                </View>
              </View>
              <Text style={styles.milesSub} numberOfLines={1}>
                {redeemedMiles
                  ? '✓ ₹50 voucher active for next pass checkout'
                  : 'Earn 50 miles on every parking & car wash'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleRedeemMiles}
            style={[styles.redeemBtn, redeemedMiles && styles.redeemBtnActive]}
          >
            <Text style={[styles.redeemBtnText, redeemedMiles && styles.redeemBtnTextActive]}>
              {redeemedMiles ? 'Applied ✓' : 'Redeem'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── FEATURE 2: Expressway Toll & FASTag Trip Calculator ─── */}
        <Card style={styles.tollCard}>
          <View style={styles.tollHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
              <View style={styles.tollIconCircle}>
                <Navigation size={13} color={Colors.primaryYellow} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.tollTitle}>Expressway Toll & FASTag</Text>
                <Text style={styles.tollSub} numberOfLines={1}>
                  Toll planner vs balance (₹{fastagAccount.balance})
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsRoundTrip((prev) => !prev)}
              style={[styles.tripToggleChip, isRoundTrip && styles.tripToggleChipActive]}
            >
              <Text style={[styles.tripToggleText, isRoundTrip && styles.tripToggleTextActive]}>
                {isRoundTrip ? 'Round Trip' : 'One Way'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Route Selector Horizontal Pills */}
          <View style={styles.tollRoutesScrollWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {NCR_EXPRESSWAY_ROUTES.map((route, idx) => {
                const isSel = selectedRouteIdx === idx;
                return (
                  <TouchableOpacity
                    key={route.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedRouteIdx(idx)}
                    style={[styles.routeChip, isSel && styles.routeChipSelected]}
                  >
                    <Text style={[styles.routeChipText, isSel && styles.routeChipTextSelected]}>
                      {route.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Active Route Toll Details */}
          {(() => {
            const activeRoute = NCR_EXPRESSWAY_ROUTES[selectedRouteIdx] || NCR_EXPRESSWAY_ROUTES[0];
            const tripToll = isRoundTrip ? activeRoute.roundTripToll : activeRoute.oneWayToll;
            const isSufficient = fastagAccount.balance >= tripToll;

            return (
              <View style={styles.tollCalculationBox}>
                <View style={styles.tollInfoRow}>
                  <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <Text style={styles.routeFromToText} numberOfLines={1}>
                      {activeRoute.fromTo}
                    </Text>
                    <Text style={styles.routeDistanceText} numberOfLines={1}>
                      {activeRoute.distanceKm} km • {activeRoute.plazas}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                    <Text style={styles.tollCostNumber}>₹{tripToll}</Text>
                    <Text style={styles.tollCostLabel}>{isRoundTrip ? 'Round' : 'One-Way'}</Text>
                  </View>
                </View>

                {/* Balance Health vs Toll Pill */}
                <View
                  style={[
                    styles.tollBalanceBanner,
                    isSufficient ? styles.tollBalanceOk : styles.tollBalanceShort,
                  ]}
                >
                  <View style={{ flex: 1, minWidth: 0, paddingRight: 6 }}>
                    <Text
                      style={[
                        styles.tollBalanceText,
                        isSufficient ? styles.tollBalanceTextOk : styles.tollBalanceTextShort,
                      ]}
                      numberOfLines={1}
                    >
                      {isSufficient
                        ? `✓ FASTag (₹${fastagAccount.balance}) balance sufficient`
                        : `⚠️ Balance short by ₹${tripToll - fastagAccount.balance}`}
                    </Text>
                  </View>
                  {!isSufficient && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setRechargePill(Math.max(200, tripToll - fastagAccount.balance));
                        setFastagModalVisible(true);
                      }}
                      style={styles.quickTopupBtn}
                    >
                      <Text style={styles.quickTopupBtnText}>+ Top Up</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })()}
        </Card>

        {/* ─── FEATURE 3: Nearby Verified Smart Parking Hubs Live Carousel ─── */}
        <View style={styles.nearbyHubsSection}>
          <View style={styles.sectionTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.sectionHeaderTitle}>NEARBY SMART PARKING HUBS</Text>
              <View style={styles.statusDotActive} />
            </View>
            <TouchableOpacity onPress={onNavigateToDiscovery}>
              <Text style={styles.seeAllLink}>View All ({locations.length})</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 8 }}
          >
            {(locations.length > 0 ? locations.slice(0, 5) : []).map((hub) => {
              const isSharda = hub.parkingName?.toLowerCase().includes('sharda');
              const isOnlineAllowed = hub.allowOnlineBooking === true || isSharda;

              return (
                <Card key={hub._id} style={styles.nearbyHubCard}>
                  <View style={styles.hubCardHeader}>
                    <View
                      style={[
                        styles.hubStatusPill,
                        isOnlineAllowed ? styles.hubStatusOnline : styles.hubStatusOnSite,
                      ]}
                    >
                      <Text
                        style={[
                          styles.hubStatusText,
                          isOnlineAllowed ? styles.hubStatusTextOnline : styles.hubStatusTextOnSite,
                        ]}
                      >
                        {isOnlineAllowed ? 'ONLINE BOOKING' : 'ON-SITE ONLY'}
                      </Text>
                    </View>
                    <Text style={styles.hubDistanceText}>1.2 km</Text>
                  </View>

                  <Text style={styles.hubCardTitle} numberOfLines={1}>
                    {hub.parkingName}
                  </Text>
                  <Text style={styles.hubCardAddress} numberOfLines={1}>
                    📍 {hub.address}
                  </Text>

                  <View style={styles.hubCardStatsRow}>
                    <View style={styles.hubStatCol}>
                      <Text style={styles.hubStatNum}>{hub.availableSlots || 42}</Text>
                      <Text style={styles.hubStatLabel}>Available</Text>
                    </View>
                    <View style={styles.hubStatDivider} />
                    <View style={styles.hubStatCol}>
                      <Text style={styles.hubStatNum}>₹{hub.hourlyPrice || 20}</Text>
                      <Text style={styles.hubStatLabel}>per hour</Text>
                    </View>
                  </View>

                  {/* Strictly sized button staying 100% inside card without overflowing */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => {
                      selectHub(hub);
                      if (onSelectHub) onSelectHub(hub);
                      else onNavigateToDiscovery();
                    }}
                    style={[
                      styles.hubActionBtn,
                      !isOnlineAllowed && styles.hubActionBtnOnSite,
                    ]}
                  >
                    <Text
                      style={[
                        styles.hubActionBtnText,
                        !isOnlineAllowed && styles.hubActionBtnTextOnSite,
                      ]}
                    >
                      {isOnlineAllowed ? 'Reserve Slot' : 'Navigate'}
                    </Text>
                    <ArrowRight size={13} color={isOnlineAllowed ? '#171717' : '#FFFFFF'} />
                  </TouchableOpacity>
                </Card>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── 6. Active Booking Banner (If Any) ─── */}
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

        {/* ─── 7. Compact Live Parking Network Map Launcher ─── */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setIsMapModalVisible(true)}
          style={styles.networkMapBanner}
        >
          <View style={styles.networkMapIconWrap}>
            <Compass size={18} color="#171717" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.networkMapTitle}>Live Parking Network Map</Text>
            <Text style={styles.networkMapSub}>
              Explore 28+ verified Delhi NCR smart hubs & real-time capacity
            </Text>
          </View>
          <View style={styles.networkMapBadge}>
            <Text style={styles.networkMapBadgeText}>MAP</Text>
          </View>
        </TouchableOpacity>

        {/* ─── 8. Recent Bookings Preview ─── */}
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

      {/* ─── MODAL 1: FASTAG INSTANT RECHARGE (Park+ Parity) ─── */}
      <Modal
        visible={fastagModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFastagModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.modalTitle}>FASTag Recharge</Text>
                  <View style={styles.netcBadge}>
                    <Text style={styles.netcBadgeText}>NETC NPCI</Text>
                  </View>
                </View>
                <Text style={styles.modalSub}>Instant toll pass top-up for {currentPlate}</Text>
              </View>
              <TouchableOpacity onPress={() => setFastagModalVisible(false)}>
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.fastagBalanceBox}>
              <Text style={styles.fastagBalLabel}>CURRENT FASTAG BALANCE</Text>
              <Text style={styles.fastagBalValue}>₹{fastagAccount.balance}.00</Text>
              <Text style={styles.fastagBankTag}>{fastagAccount.bank} • Linked Tag</Text>
            </View>

            <Text style={styles.chipHeaderLabel}>Select Recharge Amount</Text>
            <View style={styles.rechargePillsRow}>
              {[200, 500, 1000, 2000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  activeOpacity={0.8}
                  onPress={() => setRechargePill(amt)}
                  style={[
                    styles.rechargePill,
                    rechargePill === amt && styles.rechargePillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.rechargePillText,
                      rechargePill === amt && styles.rechargePillTextSelected,
                    ]}
                  >
                    +₹{amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title={isRecharging ? 'Processing Recharge...' : `Pay ₹${rechargePill} via UPI`}
              variant="primary"
              loading={isRecharging}
              onPress={handleRechargeFASTag}
              style={{ marginTop: Spacing.lg }}
            />
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 2: E-CHALLAN LOOKUP & SETTLEMENT ─── */}
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

      {/* ─── MODAL 3: 24/7 ROADSIDE SOS ─── */}
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

      {/* ─── MODAL 4: FUEL & EV CHARGING RADAR ─── */}
      <Modal
        visible={fuelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFuelModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.modalTitle}>Daily Fuel & EV Radar</Text>
                  <View style={styles.fuelLiveTag}>
                    <Text style={styles.fuelLiveTagText}>GOOGLE & OMC</Text>
                  </View>
                </View>
                <Text style={styles.modalSub}>Official OMC retail prices • Revised daily at 06:00 AM IST</Text>
              </View>
              <TouchableOpacity onPress={() => setFuelModalVisible(false)}>
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* City Switcher Row */}
            <View style={styles.fuelCitySelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {SUPPORTED_INDIAN_CITIES.map((c) => {
                  const isSelected = selectedCityFuel.cityKey === c.cityKey;
                  return (
                    <TouchableOpacity
                      key={c.cityKey}
                      activeOpacity={0.8}
                      onPress={() => handleSwitchCityFuel(c.cityKey)}
                      style={[
                        styles.fuelCityPill,
                        isSelected && styles.fuelCityPillSelected,
                      ]}
                    >
                      <MapPin size={11} color={isSelected ? '#171717' : Colors.textSecondary} />
                      <Text
                        style={[
                          styles.fuelCityPillText,
                          isSelected && styles.fuelCityPillTextSelected,
                        ]}
                      >
                        {c.cityName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Sync Status Bar */}
            <View style={styles.fuelSyncRow}>
              <Text style={styles.fuelSyncText}>
                {isSyncingFuel ? 'Syncing live market rates...' : selectedCityFuel.rates.lastUpdated}
              </Text>
              <TouchableOpacity
                onPress={() => handleSwitchCityFuel(selectedCityFuel.cityKey)}
                disabled={isSyncingFuel}
                style={styles.fuelRefreshBtn}
              >
                <RefreshCw size={12} color={Colors.textPrimary} />
                <Text style={styles.fuelRefreshText}>Sync</Text>
              </TouchableOpacity>
            </View>

            {/* 3-Col Fuel Grid */}
            <View style={styles.fuelRateGrid}>
              <View style={styles.fuelRateCol}>
                <Text style={styles.fuelRateType}>PETROL</Text>
                <Text style={styles.fuelRateNum}>₹{selectedCityFuel.rates.petrol}</Text>
                <Text style={styles.fuelRateUnit}>per Litre</Text>
              </View>
              <View style={styles.fuelRateCol}>
                <Text style={styles.fuelRateType}>DIESEL</Text>
                <Text style={styles.fuelRateNum}>₹{selectedCityFuel.rates.diesel}</Text>
                <Text style={styles.fuelRateUnit}>per Litre</Text>
              </View>
              <View style={styles.fuelRateCol}>
                <Text style={styles.fuelRateType}>CNG</Text>
                <Text style={styles.fuelRateNum}>₹{selectedCityFuel.rates.cng}</Text>
                <Text style={styles.fuelRateUnit}>per Kg</Text>
              </View>
            </View>

            {/* Detailed EV Tariffs Breakdown */}
            <View style={styles.evTariffSection}>
              <Text style={styles.evTariffTitle}>⚡ EV CHARGING TARIFF RADAR ({selectedCityFuel.state})</Text>

              {/* 1. Fast DC */}
              <View style={styles.evTariffCard}>
                <View style={styles.evTariffIconWrap}>
                  <Zap size={16} color="#15803D" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.evTariffLabel}>DC Ultra-Fast Charging (50-120 kW)</Text>
                  <Text style={styles.evTariffSub}>Tata Power EZ, Statiq, Jio-bp in smart hubs & malls</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.evTariffPrice}>₹{selectedCityFuel.rates.evFastDC}</Text>
                  <Text style={styles.evTariffUnit}>/ kWh</Text>
                </View>
              </View>

              {/* 2. Slow AC */}
              <View style={styles.evTariffCard}>
                <View style={[styles.evTariffIconWrap, { backgroundColor: '#EDE9FE' }]}>
                  <Zap size={16} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.evTariffLabel}>AC Moderate Charging (7.4-22 kW)</Text>
                  <Text style={styles.evTariffSub}>Hub parking bays & destination overnight chargers</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.evTariffPrice}>₹{selectedCityFuel.rates.evSlowAC}</Text>
                  <Text style={styles.evTariffUnit}>/ kWh</Text>
                </View>
              </View>

              {/* 3. DISCOM Base */}
              <View style={[styles.evTariffCard, { backgroundColor: '#F8FAFC' }]}>
                <View style={[styles.evTariffIconWrap, { backgroundColor: '#E2E8F0' }]}>
                  <ShieldCheck size={16} color="#475569" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.evTariffLabel}>State DISCOM Base EV Tariff</Text>
                  <Text style={styles.evTariffSub}>Govt regulated single-delivery EV connection rate</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.evTariffPrice, { color: '#475569' }]}>₹{selectedCityFuel.rates.discomBase}</Text>
                  <Text style={styles.evTariffUnit}>/ kWh</Text>
                </View>
              </View>
            </View>

            <Text style={styles.fuelSourceText}>
              Official Source: {selectedCityFuel.rates.source} • Synced via Google & OMC Portals
            </Text>

            <Button
              title="Find Nearby EV & Fuel Stations"
              variant="primary"
              onPress={() => {
                setFuelModalVisible(false);
                onNavigateToDiscovery();
              }}
              style={{ marginTop: Spacing.sm }}
            />
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 5: IN-BAY CAR CARE DETAIL ─── */}
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

      {/* ─── Interactive Drivix Network Map Modal (Webapp Parity) ─── */}
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
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  moduleSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803D',
  },
  moduleSubText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryYellow,
  },
  moduleDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  /* ─── 8-Icon Core Services Grid ─── */
  quickGridContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 11,
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
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  gridEmoji: {
    fontSize: 22,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  /* ─── Fuel Radar Ticker Banner ─── */
  fuelTickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: Spacing.lg,
  },
  fuelTickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  fuelFlameCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fuelTickerTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  fuelTickerRates: {
    fontSize: 11,
    fontWeight: '700',
    color: '#171717',
    marginTop: 1,
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

  /* ─── Recent Section ─── */
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
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  recentTimeText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  /* ─── Modals Styles (Backdrop & Content) ─── */
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
  netcBadge: {
    backgroundColor: '#1E2333',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  netcBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.primaryYellow,
  },
  fastagBalanceBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  fastagBalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  fastagBalValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginVertical: 4,
    fontVariant: ['tabular-nums'],
  },
  fastagBankTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  chipHeaderLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  rechargePillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rechargePill: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rechargePillSelected: {
    backgroundColor: Colors.accentYellowLight,
    borderColor: Colors.primaryYellow,
  },
  rechargePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  rechargePillTextSelected: {
    fontWeight: '900',
    color: '#171717',
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
  },
  cleanRecordSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  challanItemCard: {
    padding: Spacing.md,
    marginBottom: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  challanItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  challanNum: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  challanViolation: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 4,
  },
  challanLocation: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  challanDate: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  challanPayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  challanAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#171717',
  },
  payChallanBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  payChallanBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  /* SOS Modal */
  sosCallBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sosCallTitle: {
    fontSize: 13,
    fontWeight: '900',
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
  },
  sosServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  sosIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1E2333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosServiceName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sosServiceSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  sosEtaBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  /* Fuel Modal */
  fuelRateGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  fuelRateCol: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    alignItems: 'center',
  },
  fuelRateType: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  fuelRateNum: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginVertical: 4,
  },
  fuelRateUnit: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  evBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFCCB',
    borderRadius: BorderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BEF264',
    marginBottom: Spacing.sm,
  },
  evBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  evBannerSub: {
    fontSize: 10,
    color: '#365314',
    marginTop: 1,
  },

  /* Car Care Modal */
  carCareItemCard: {
    padding: Spacing.md,
    marginBottom: 8,
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

  /* Network Map Compact Banner */
  networkMapBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2333',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: Spacing.md,
  },
  networkMapIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkMapTitle: {
    fontSize: 13,
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
    paddingVertical: 3,
    borderRadius: 6,
  },
  networkMapBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.primaryYellow,
    letterSpacing: 0.5,
  },

  /* Dynamic Fuel Modal Styles */
  fuelLiveTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  fuelLiveTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  fuelCitySelector: {
    marginBottom: 10,
  },
  fuelCityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  fuelCityPillSelected: {
    backgroundColor: Colors.accentYellowLight,
    borderColor: Colors.primaryYellow,
  },
  fuelCityPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  fuelCityPillTextSelected: {
    fontWeight: '900',
    color: '#171717',
  },
  fuelSyncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  fuelSyncText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  fuelRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  fuelRefreshText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  evTariffSection: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    gap: 8,
  },
  evTariffTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  evTariffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 10,
    gap: 8,
  },
  evTariffIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  evTariffLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  evTariffSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  evTariffPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },
  evTariffUnit: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  fuelSourceText: {
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },

  /* ─── 3 New Features Styles (Mobile Screen Strictly Bounded) ─── */
  /* Feature 1: Miles Rewards Card */
  milesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  milesLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  milesCoinBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  milesTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#92400E',
  },
  milesCashTag: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  milesCashTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#854D0E',
  },
  milesSub: {
    fontSize: 10,
    color: '#78350F',
    marginTop: 1,
  },
  redeemBtn: {
    backgroundColor: '#1E2333',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    flexShrink: 0,
    marginLeft: 8,
  },
  redeemBtnActive: {
    backgroundColor: '#15803D',
  },
  redeemBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.primaryYellow,
  },
  redeemBtnTextActive: {
    color: '#FFFFFF',
  },

  /* Feature 2: Expressway Toll Calculator */
  tollCard: {
    backgroundColor: '#151926',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    borderRadius: BorderRadius.lg,
    padding: 12,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  tollHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tollIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tollTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  tollSub: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  tripToggleChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    flexShrink: 0,
    marginLeft: 6,
  },
  tripToggleChipActive: {
    backgroundColor: Colors.primaryYellow,
  },
  tripToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  tripToggleTextActive: {
    color: '#111827',
    fontWeight: '900',
  },
  tollRoutesScrollWrap: {
    marginBottom: 8,
  },
  routeChip: {
    backgroundColor: '#1E2333',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  routeChipSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: Colors.primaryYellow,
  },
  routeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  routeChipTextSelected: {
    color: Colors.primaryYellow,
    fontWeight: '800',
  },
  tollCalculationBox: {
    backgroundColor: '#1C2233',
    borderRadius: BorderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tollInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeFromToText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  routeDistanceText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  tollCostNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primaryYellow,
    fontVariant: ['tabular-nums'],
  },
  tollCostLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  tollBalanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tollBalanceOk: {
    backgroundColor: 'rgba(22, 101, 52, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  tollBalanceShort: {
    backgroundColor: 'rgba(185, 28, 28, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  tollBalanceText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tollBalanceTextOk: {
    color: '#86EFAC',
  },
  tollBalanceTextShort: {
    color: '#FCA5A5',
  },
  quickTopupBtn: {
    backgroundColor: Colors.primaryYellow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    flexShrink: 0,
  },
  quickTopupBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#111827',
  },

  /* Feature 3: Nearby Hubs Carousel */
  nearbyHubsSection: {
    marginBottom: Spacing.md,
  },
  seeAllLink: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryYellow,
  },
  nearbyHubCard: {
    width: 250,
    padding: 12,
    marginRight: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  hubCardHeader: {
    marginBottom: 6,
  },
  hubBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hubStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hubStatusOnline: {
    backgroundColor: '#DCFCE7',
  },
  hubStatusOnSite: {
    backgroundColor: '#FEF3C7',
  },
  hubStatusText: {
    fontSize: 9,
    fontWeight: '900',
  },
  hubStatusTextOnline: {
    color: '#15803D',
  },
  hubStatusTextOnSite: {
    color: '#B45309',
  },
  hubDistanceText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  hubCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  hubCardAddress: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  hubCardStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.md,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  hubStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  hubStatDivider: {
    width: 1,
    height: 18,
    backgroundColor: Colors.border,
  },
  hubStatNum: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  hubStatLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  hubActionBtn: {
    width: '100%',
    height: 34,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryYellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  hubActionBtnOnSite: {
    backgroundColor: '#1E2333',
  },
  hubActionBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#171717',
  },
  hubActionBtnTextOnSite: {
    color: '#FFFFFF',
  },
});
