import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Star,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Car,
  Zap,
  Coffee,
  Shield,
  Navigation,
  Sparkles,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Info,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/services/api';

const { width } = Dimensions.get('window');

interface DriverHubScreenProps {
  onBack: () => void;
  selectedLocation?: any | null;
  locations?: any[];
}

const MOCK_DEFAULT_HUB = {
  _id: 'mock_sharda',
  parkingName: 'Sharda University Hub',
  availableSlots: 120,
  totalSlots: 180,
  hourlyPrice: 40,
  distance: '1.2 km',
  rating: 4.0,
  amenities: ['Parking', 'Washrooms', 'Drinking Water', 'Wi-Fi']
};

export default function DriverHubScreen({ onBack, selectedLocation, locations }: DriverHubScreenProps) {
  const router = useRouter();
  const colors = useTheme();

  // Active hub state
  const [activeHub, setActiveHub] = useState<any>(
    selectedLocation || (locations && locations.length > 0 ? locations[0] : MOCK_DEFAULT_HUB)
  );

  // Hubs list state, defaulting to passed locations
  const [hubsList, setHubsList] = useState<any[]>(locations || []);

  // Expandable sections states
  const [isRestLoungeExpanded, setIsRestLoungeExpanded] = useState(false);
  const [isEvChargingExpanded, setIsEvChargingExpanded] = useState(false);
  const [isFoodCourtExpanded, setIsFoodCourtExpanded] = useState(false);
  const [isParkingBookingExpanded, setIsParkingBookingExpanded] = useState(false);
  const [isCurrentBookingExpanded, setIsCurrentBookingExpanded] = useState(true);
  const [isSafetyExpanded, setIsSafetyExpanded] = useState(false);
  const [isMembershipExpanded, setIsMembershipExpanded] = useState(false);
  const [isHubServicesExpanded, setIsHubServicesExpanded] = useState(false);

  // Reservation & Interactive States
  const [restCapacity, setRestCapacity] = useState(18);
  const [isRestReserved, setIsRestReserved] = useState(false);
  const [evAvailable, setEvAvailable] = useState(6);
  const [isEvBooked, setIsEvBooked] = useState(false);
  const [isSosTriggered, setIsSosTriggered] = useState(false);
  const [membershipTier, setMembershipTier] = useState<'Silver' | 'Gold'>('Silver');

  // Real Bookings State
  const [activeBooking, setActiveBooking] = useState<any | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);

  const sosAnim = useRef(new Animated.Value(1)).current;

  // Amenity Check Helpers
  const hasRestLounge = activeHub?.amenities?.some((a: string) => 
    /rest|lounge/i.test(a)
  ) ?? false;

  const hasEvCharging = activeHub?.amenities?.some((a: string) => 
    /ev|charge|charger/i.test(a)
  ) ?? false;

  const hasFoodCourt = activeHub?.amenities?.some((a: string) => 
    /food|cafe|court|canteen|dining/i.test(a)
  ) ?? false;

  const hasWashrooms = activeHub?.amenities?.some((a: string) => 
    /washroom|toilet|shower/i.test(a)
  ) ?? true;

  // Fetch initial data: bookings & parking hubs list
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Fetch bookings
        const bookingsRes = await api.get('/bookings/my');
        let activeB: any = null;
        if (bookingsRes.data && bookingsRes.data.length > 0) {
          activeB = bookingsRes.data.find((b: any) => b.status === 'booked');
          if (activeB) {
            setActiveBooking(activeB);
            
            // Calculate remaining countdown
            const entryDateStr = activeB.entryDate;
            const entryTimeStr = activeB.entryTime;
            const durationHrs = Number(activeB.duration || 2);
            
            const [hours, minutes] = entryTimeStr.split(':').map(Number);
            const expiry = new Date(entryDateStr);
            expiry.setHours(hours + durationHrs, minutes, 0, 0);
            
            const diff = Math.floor((expiry.getTime() - Date.now()) / 1000);
            setRemainingTime(diff > 0 ? diff : 0);
          } else {
            setActiveBooking(null);
          }
        }

        // 2. Fetch hubs if none passed as props
        let loadedHubs = locations || [];
        if (!loadedHubs || loadedHubs.length === 0) {
          const parkingRes = await api.get('/parking');
          if (parkingRes.data) {
            loadedHubs = parkingRes.data;
            setHubsList(loadedHubs);
          }
        }

        // 3. Set the active hub dynamically
        if (activeB && loadedHubs.length > 0) {
          // Try to match the active booking's location name
          const matchedHub = loadedHubs.find(
            (h: any) => (h.parkingName || h.parkingLocationName) === activeB.locationName
          );
          if (matchedHub) {
            setActiveHub(matchedHub);
          } else {
            setActiveHub(selectedLocation || loadedHubs[0]);
          }
        } else if (selectedLocation) {
          setActiveHub(selectedLocation);
        } else if (loadedHubs.length > 0) {
          setActiveHub(loadedHubs[0]);
        }
      } catch (err: any) {
        console.warn('Error loading Driver Hub data:', err.message);
        if (err.config) {
          console.warn('Axios URL requested:', err.config.url);
        }
        if (err.response) {
          console.warn('Axios Response status:', err.response.status);
          console.warn('Axios Response data:', JSON.stringify(err.response.data));
        }
      }
    };

    loadData();
  }, [locations, selectedLocation]);

  // Countdown timer update
  useEffect(() => {
    if (remainingTime <= 0) return;
    const interval = setInterval(() => {
      setRemainingTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingTime]);

  // Blinking animation for SOS trigger
  useEffect(() => {
    if (isSosTriggered) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(sosAnim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.timing(sosAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      sosAnim.setValue(1);
    }
  }, [isSosTriggered]);

  const toggleSection = (section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    switch (section) {
      case 'rest':
        setIsRestLoungeExpanded(!isRestLoungeExpanded);
        break;
      case 'ev':
        setIsEvChargingExpanded(!isEvChargingExpanded);
        break;
      case 'food':
        setIsFoodCourtExpanded(!isFoodCourtExpanded);
        break;
      case 'parking':
        setIsParkingBookingExpanded(!isParkingBookingExpanded);
        break;
      case 'current':
        setIsCurrentBookingExpanded(!isCurrentBookingExpanded);
        break;
      case 'safety':
        setIsSafetyExpanded(!isSafetyExpanded);
        break;
      case 'membership':
        setIsMembershipExpanded(!isMembershipExpanded);
        break;
    }
  };

  const handleRestReserve = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isRestReserved) {
      setRestCapacity((prev) => prev - 1);
      setIsRestReserved(false);
      Alert.alert('Reservation Cancelled', 'Your seat at the Driver Rest Lounge has been cancelled.');
    } else {
      if (restCapacity >= 30) {
        Alert.alert('Lounge Full', 'All seats are currently occupied.');
        return;
      }
      setRestCapacity((prev) => prev + 1);
      setIsRestReserved(true);
      Alert.alert('Seat Reserved Successfully!', 'Your recliner seat is held for the next 30 minutes. Rate: ₹40/hr.');
    }
  };

  const handleEvBook = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isEvBooked) {
      setEvAvailable((prev) => prev + 1);
      setIsEvBooked(false);
      Alert.alert('Booking Cancelled', 'Your EV charging session has been cancelled.');
    } else {
      if (evAvailable <= 0) {
        Alert.alert('No Chargers Available', 'Please check back in a few minutes.');
        return;
      }
      setEvAvailable((prev) => prev - 1);
      setIsEvBooked(true);
      Alert.alert('Charging Slot Confirmed', 'Proceed to Charger Hub #4. Rate: ₹14/kWh.');
    }
  };

  const handleSosPress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isSosTriggered) {
      setIsSosTriggered(false);
      Alert.alert('SOS Deactivated', 'Security staff notified that the situation is resolved.');
    } else {
      setIsSosTriggered(true);
      Alert.alert(
        '⚠️ EMERGENCY ALARM TRIGGERED',
        'Drivix Security Guard and Medical Response Team have been dispatched to your GPS location immediately.',
        [{ text: 'Acknowledge', style: 'destructive' }]
      );
    }
  };

  const handleUpgradeMembership = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (membershipTier === 'Silver') {
      setMembershipTier('Gold');
      Alert.alert('Upgraded!', 'Welcome to Gold Tier! Rest lounge access is now discounted at 15% off.');
    } else {
      setMembershipTier('Silver');
      Alert.alert('Downgraded', 'Membership changed back to Silver Tier.');
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const activePrice = activeHub?.hourlyPrice || activeHub?.pricePerHr || 40;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sticky Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderGlass }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <ChevronLeft size={20} color="#ffce00" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Driver Hub</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Your professional companion</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 👋 Hero Section Capsule */}
        <View style={[styles.heroCapsule, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <Text style={[styles.heroGreeting, { color: colors.text }]}>👋 Welcome to Driver Hub</Text>
          <Text style={[styles.heroIntro, { color: colors.textSecondary }]}>
            Everything a professional driver needs, all in one place.
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.borderGlass }]} />
          
          <View style={styles.hubDetailsRow}>
            <View style={styles.hubDetailLeft}>
              <View style={styles.dropdownTrigger}>
                <Text style={[styles.hubName, { color: colors.text }]}>📍 {activeHub.parkingName || activeHub.parkingLocationName}</Text>
              </View>
              
              <View style={styles.hubBadges}>
                <View style={[styles.badge, { backgroundColor: 'rgba(0, 204, 106, 0.15)', borderColor: 'rgba(0,204,106,0.3)' }]}>
                  <Text style={styles.badgeTextGreen}>Open 24×7</Text>
                </View>
                <Text style={[styles.hubDistance, { color: colors.textSecondary }]}>
                  {activeHub.distance || '1.2 km'} Away
                </Text>
              </View>
            </View>
            <View style={styles.hubRatingBlock}>
              <View style={styles.starsRow}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Star key={i} size={14} color="#ffce00" fill="#ffce00" />
                ))}
                <Star size={14} color="#ffce00" />
              </View>
              <Text style={[styles.ratingVal, { color: colors.textSecondary }]}>
                {activeHub.rating ? activeHub.rating.toFixed(1) : '4.0'} Stars
              </Text>
            </View>
          </View>
        </View>

        {/* 🆘 Animated SOS Emergency Indicator */}
        {isSosTriggered && (
          <Animated.View style={[styles.sosAlarmContainer, { opacity: sosAnim }]}>
            <AlertTriangle size={24} color="#000" />
            <Text style={styles.sosAlarmText}>EMERGENCY PROTOCOL ACTIVE: Security Dispatch Route En-route</Text>
          </Animated.View>
        )}

        {/* 🅿️ Smart Today's Booking Widget */}
        {activeBooking ? (
          <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
            <TouchableOpacity
              style={styles.cardHeaderToggle}
              onPress={() => toggleSection('current')}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeaderLeft}>
                <Car size={20} color="#ffce00" />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Today's Booking</Text>
              </View>
              {isCurrentBookingExpanded ? <ChevronUp size={18} color={colors.textSecondary} /> : <ChevronDown size={18} color={colors.textSecondary} />}
            </TouchableOpacity>

            {isCurrentBookingExpanded && (
              <View style={styles.cardBody}>
                <View style={styles.bookingDetailsRow}>
                  <View>
                    <Text style={[styles.bookingLabel, { color: colors.textSecondary }]}>PARKING SLOT</Text>
                    <Text style={[styles.bookingVal, { color: colors.text }]}>
                      {activeBooking.slotId} ({activeBooking.floor})
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                      {activeBooking.locationName}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.bookingLabel, { color: colors.textSecondary }]}>REMAINING TIME</Text>
                    <Text style={[styles.bookingVal, { color: '#ffce00' }]}>
                      {remainingTime > 0 ? formatTime(remainingTime) : 'Expired / Due'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.bookingActionsRow}>
                  <TouchableOpacity 
                    style={[styles.bookingBtn, { backgroundColor: 'rgba(255, 206, 0, 0.12)', borderColor: 'rgba(255,206,0,0.25)' }]} 
                    onPress={() => Alert.alert('Gate Pass QR', `Please scan this QR at gate: ${activeBooking.bookingId}`)}
                  >
                    <Text style={[styles.bookingBtnText, { color: '#ffce00' }]}>Open QR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.bookingBtn, { backgroundColor: 'rgba(0, 242, 255, 0.12)', borderColor: 'rgba(0,242,255,0.25)' }]} 
                    onPress={() => Alert.alert('Navigating', `Launching Google Maps directions to ${activeBooking.locationName}...`)}
                  >
                    <Navigation size={14} color="#00f2ff" />
                    <Text style={[styles.bookingBtnText, { color: '#00f2ff', marginLeft: 4 }]}>Navigate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.noBookingCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Info size={20} color="#ffce00" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.noBookingTitle, { color: colors.text }]}>No Active Booking</Text>
                <Text style={[styles.noBookingText, { color: colors.textSecondary }]}>
                  You don't have any parking slot reservations for today.
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.noBookingBtn, { backgroundColor: colors.primary }]} 
              onPress={() => {
                Alert.alert('Redirecting', 'Opening Hub selector...');
                router.push('/parking-hubs');
              }}
            >
              <Text style={styles.noBookingBtnText}>Reserve Parking Spot</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 📊 Live Hub Status Panel */}
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <Text style={[styles.cardTitleOnly, { color: colors.text }]}>Driver Hub Live Status</Text>
          
          <View style={styles.statusGrid}>
            {[
              { label: 'Parking Slots', value: `${activeHub.availableSlots} / ${activeHub.totalSlots} Available`, green: activeHub.availableSlots > 0, icon: '🅿️' },
              { label: 'Rest Lounge Pods', value: hasRestLounge ? `${30 - restCapacity} / 30 Available` : 'Unavailable', green: hasRestLounge && (30 - restCapacity) > 5, icon: '🛏️' },
              { label: 'EV Charger Stations', value: hasEvCharging ? `${evAvailable} / 8 Available` : 'Unavailable', green: hasEvCharging && evAvailable > 0, icon: '⚡' },
              { label: 'Executive Cafeteria', value: hasFoodCourt ? 'Open Now' : 'Unavailable', green: hasFoodCourt, icon: '☕' },
              { label: 'Washrooms', value: hasWashrooms ? 'Fully Functional' : 'Unavailable', green: hasWashrooms, icon: '🚿' }
            ].map((stat, idx) => (
              <View key={idx} style={[styles.statusRow, { borderBottomColor: colors.borderGlass }]}>
                <View style={styles.statusLeft}>
                  <Text style={{ fontSize: 16, marginRight: 8 }}>{stat.icon}</Text>
                  <Text style={[styles.statusLabel, { color: colors.text }]}>{stat.label}</Text>
                </View>
                <View style={styles.statusRight}>
                  <View style={[styles.dotIndicator, { backgroundColor: stat.green ? '#00cc6a' : '#ff4b4b' }]} />
                  <Text style={[styles.statusValue, { color: colors.textSecondary }]}>{stat.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 🎛️ Services Grid (Quick Toggles) */}
        <View style={styles.servicesHeader}>
          <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 0 }]}>Available Services</Text>
          <TouchableOpacity
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setIsHubServicesExpanded(!isHubServicesExpanded);
            }}
            style={styles.viewMoreBtn}
          >
            <Text style={[styles.viewMoreText, { color: colors.primary }]}>
              {isHubServicesExpanded ? 'View Less' : 'View More'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.capsuleGrid}>
          {[
            { label: 'Parking',     sub: `${activeHub.availableSlots} / ${activeHub.totalSlots} Avail`, icon: '🅿️', color: '#ffce00', action: () => toggleSection('parking') },
            { label: 'EV Charging', sub: hasEvCharging ? `${evAvailable} / 8 Stations` : 'Unavailable', icon: '⚡', color: '#10b981', action: () => toggleSection('ev') },
            { label: 'Rest Lounge', sub: hasRestLounge ? `${30 - restCapacity} / 30 Pods` : 'Unavailable', icon: '🛏️', color: '#60a5fa', action: () => toggleSection('rest') },
            { label: 'Food Court',  sub: hasFoodCourt ? 'Executive Cafe' : 'Unavailable', icon: '☕', color: '#fbbf24', action: () => toggleSection('food') },
            { label: 'Washrooms',   sub: hasWashrooms ? 'Fully Functional' : 'Unavailable', icon: '🚿', color: '#34d399', action: () => Alert.alert('Washrooms', 'A1 Standard Washrooms are located on Level 1 (Near Section B) & Rest Area.') },
            { label: 'Car Wash',    sub: 'Bay 3 Active', icon: '🚗', color: '#f472b6', action: () => Alert.alert('Car Wash', 'Foam wash service is available at Bay 3. Price: ₹300.') },
            { label: 'Tyre Air',    sub: 'Nitrogen Station', icon: '🛞', color: '#a78bfa', action: () => Alert.alert('Tyre Air Station', 'Free automated nitrogen/air dispensers are placed near exit gates.') },
            { label: 'Service Center', sub: 'Bay 1 Mechanic', icon: '🔧', color: '#f87171', action: () => Alert.alert('Service Center', 'Minor quick service mechanic available from 9 AM to 9 PM at Bay 1.') },
          ]
            .slice(0, isHubServicesExpanded ? 8 : 4)
            .map((svc) => {
              const capsuleWidth = (width - 50) / 2;
              return (
                <TouchableOpacity
                  key={svc.label}
                  style={[
                    styles.serviceCapsule,
                    {
                      backgroundColor: colors.backgroundElement,
                      borderColor: colors.borderGlass,
                      width: capsuleWidth
                    }
                  ]}
                  onPress={svc.action}
                  activeOpacity={0.8}
                >
                  <View style={[styles.serviceIconCircle, { backgroundColor: `${svc.color}15` }]}>
                    <Text style={{ fontSize: 16 }}>{svc.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.serviceCapsuleLabel, { color: colors.text }]} numberOfLines={1}>{svc.label}</Text>
                    <Text style={[styles.serviceCapsuleSub, { color: colors.textSecondary }]} numberOfLines={1}>{svc.sub}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
        </View>

        {/* 🛋️ Expandable Rest Lounge Card */}
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <TouchableOpacity
            style={styles.cardHeaderToggle}
            onPress={() => toggleSection('rest')}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeaderLeft}>
              <Text style={{ fontSize: 20 }}>🛏️</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Driver Rest Lounge</Text>
            </View>
            <View style={styles.headerRightInfo}>
              <View style={[
                styles.badge, 
                hasRestLounge 
                  ? { backgroundColor: 'rgba(0, 242, 255, 0.1)', borderColor: 'rgba(0,242,255,0.2)' }
                  : { backgroundColor: 'rgba(255, 75, 75, 0.1)', borderColor: 'rgba(255,75,75,0.2)' }
              ]}>
                <Text style={{ color: hasRestLounge ? '#00f2ff' : '#ff4b4b', fontSize: 10, fontWeight: 'bold' }}>
                  {hasRestLounge ? 'Available' : 'Unavailable'}
                </Text>
              </View>
              {hasRestLounge && <Text style={[styles.headerRateText, { color: colors.primary }]}>₹40 / Hr</Text>}
              {isRestLoungeExpanded ? <ChevronUp size={18} color={colors.textSecondary} /> : <ChevronDown size={18} color={colors.textSecondary} />}
            </View>
          </TouchableOpacity>

          {isRestLoungeExpanded && (
            <View style={styles.cardBody}>
              {hasRestLounge ? (
                <>
                  <Text style={[styles.cardExpandTitle, { color: colors.text }]}>Premium Amenities</Text>
                  <View style={styles.amenitiesWrap}>
                    {['Recliner Chairs', 'Charging Points', 'Drinking Water', 'Free Wi-Fi', 'AC Waiting Area'].map((am) => (
                      <View key={am} style={styles.amenityRow}>
                        <Text style={styles.checkMark}>✓</Text>
                        <Text style={[styles.amenityLabel, { color: colors.textSecondary }]}>{am}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.bookingDetailsRow}>
                    <View>
                      <Text style={[styles.bookingLabel, { color: colors.textSecondary }]}>CAPACITY</Text>
                      <Text style={[styles.bookingVal, { color: colors.text }]}>{restCapacity} / 30 Occupied</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        isRestReserved ? { backgroundColor: '#ff4b4b' } : { backgroundColor: colors.primary }
                      ]}
                      onPress={handleRestReserve}
                    >
                      <Text style={[styles.actionBtnText, isRestReserved && { color: '#ffffff' }]}>
                        {isRestReserved ? 'Release Seat' : 'Reserve Seat'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
                  <ShieldAlert size={18} color="#ff4b4b" />
                  <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1 }}>
                    Driver Rest Lounge waiting pods are not available at {activeHub.parkingName || activeHub.parkingLocationName}.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ⚡ Expandable EV Charging Card */}
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <TouchableOpacity
            style={styles.cardHeaderToggle}
            onPress={() => toggleSection('ev')}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeaderLeft}>
              <Text style={{ fontSize: 20 }}>⚡</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>EV Charging Stations</Text>
            </View>
            <View style={styles.headerRightInfo}>
              <Text style={[styles.headerRateText, { color: hasEvCharging ? colors.primary : '#ff4b4b' }]}>
                {hasEvCharging ? '₹14 / kWh' : 'Unavailable'}
              </Text>
              {isEvChargingExpanded ? <ChevronUp size={18} color={colors.textSecondary} /> : <ChevronDown size={18} color={colors.textSecondary} />}
            </View>
          </TouchableOpacity>

          {isEvChargingExpanded && (
            <View style={styles.cardBody}>
              {hasEvCharging ? (
                <>
                  <View style={styles.evSpecsGrid}>
                    <View style={styles.evSpecBox}>
                      <Text style={[styles.bookingLabel, { color: colors.textSecondary }]}>PLUG TYPE</Text>
                      <Text style={[styles.bookingVal, { color: colors.text }]}>CCS2 / Type 2</Text>
                    </View>
                    <View style={styles.evSpecBox}>
                      <Text style={[styles.bookingLabel, { color: colors.textSecondary }]}>WAIT ESTIMATION</Text>
                      <Text style={[styles.bookingVal, { color: '#ffce00' }]}>~5 Minutes</Text>
                    </View>
                  </View>

                  <View style={styles.bookingDetailsRow}>
                    <View>
                      <Text style={[styles.bookingLabel, { color: colors.textSecondary }]}>AVAILABLE CHARGERS</Text>
                      <Text style={[styles.bookingVal, { color: colors.text }]}>{evAvailable} Stations</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        isEvBooked ? { backgroundColor: '#ff4b4b' } : { backgroundColor: colors.primary }
                      ]}
                      onPress={handleEvBook}
                    >
                      <Text style={[styles.actionBtnText, isEvBooked && { color: '#ffffff' }]}>
                        {isEvBooked ? 'Cancel Booking' : 'Book Charging Slot'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
                  <ShieldAlert size={18} color="#ff4b4b" />
                  <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1 }}>
                    EV charging speed chargers are not available at {activeHub.parkingName || activeHub.parkingLocationName}.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ☕ Expandable Food Court Card */}
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <TouchableOpacity
            style={styles.cardHeaderToggle}
            onPress={() => toggleSection('food')}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeaderLeft}>
              <Text style={{ fontSize: 20 }}>☕</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Food Court & Cafe</Text>
            </View>
            <View style={styles.headerRightInfo}>
              <View style={[
                styles.badge, 
                hasFoodCourt 
                  ? { backgroundColor: 'rgba(0, 204, 106, 0.1)', borderColor: 'rgba(0,204,106,0.2)' }
                  : { backgroundColor: 'rgba(255, 75, 75, 0.1)', borderColor: 'rgba(255,75,75,0.2)' }
              ]}>
                <Text style={{ color: hasFoodCourt ? '#00cc6a' : '#ff4b4b', fontSize: 10, fontWeight: 'bold' }}>
                  {hasFoodCourt ? 'Open Now' : 'Unavailable'}
                </Text>
              </View>
              {isFoodCourtExpanded ? <ChevronUp size={18} color={colors.textSecondary} /> : <ChevronDown size={18} color={colors.textSecondary} />}
            </View>
          </TouchableOpacity>

          {isFoodCourtExpanded && (
            <View style={styles.cardBody}>
              {hasFoodCourt ? (
                <>
                  <Text style={[styles.cardExpandTitle, { color: colors.text, marginBottom: 12 }]}>Driver Cafe Specialities</Text>
                  
                  <View style={styles.foodMenuRow}>
                    {[
                      { name: 'Chai / Coffee', price: '₹15' },
                      { name: 'Snacks & Samosa', price: '₹25' },
                      { name: 'Full North Lunch Thali', price: '₹80' },
                      { name: 'Beverages', price: '₹20' }
                    ].map((item, index) => (
                      <View key={index} style={styles.foodItem}>
                        <Text style={[styles.foodItemName, { color: colors.text }]}>{item.name}</Text>
                        <Text style={styles.foodItemPrice}>{item.price}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.menuBtn, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}
                    onPress={() => Alert.alert('Digital Menu', 'Full menu loading... Show driver ID badge at billing counter to get an additional 10% off.')}
                  >
                    <Text style={[styles.menuBtnText, { color: colors.primary }]}>View Digital Menu</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
                  <ShieldAlert size={18} color="#ff4b4b" />
                  <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1 }}>
                    Food court, cafeteria, or coffee services are not available at {activeHub.parkingName || activeHub.parkingLocationName}.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 🚿 Horizontal Facilities Scrolling */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Core Driver Facilities</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.facilitiesScroll}
        >
          {[
            { label: 'Hot Shower', icon: '🚿' },
            { label: 'Clean Washroom', icon: '🚻' },
            { label: 'Drinking Water', icon: '💧' },
            { label: 'High-speed Wi-Fi', icon: '📶' },
            { label: 'USB Charging', icon: '📱' },
            { label: '24×7 Guard Security', icon: '🛡️' }
          ].map((item, idx) => (
            <View key={idx} style={[styles.facilityPill, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
              <Text style={{ fontSize: 16, marginRight: 6 }}>{item.icon}</Text>
              <Text style={[styles.facilityLabel, { color: colors.text }]}>{item.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* 🅿️ Parking Booking Card (Collapsible) */}
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <TouchableOpacity
            style={styles.cardHeaderToggle}
            onPress={() => toggleSection('parking')}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeaderLeft}>
              <Car size={20} color="#ffce00" />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Quick Parking Reservation</Text>
            </View>
            {isParkingBookingExpanded ? <ChevronUp size={18} color={colors.textSecondary} /> : <ChevronDown size={18} color={colors.textSecondary} />}
          </TouchableOpacity>

          {isParkingBookingExpanded && (
            <View style={styles.cardBody}>
              <View style={styles.bookingDetailsRow}>
                <View>
                  <Text style={[styles.bookingLabel, { color: colors.textSecondary }]}>AVAILABLE SLOTS</Text>
                  <Text style={[styles.bookingVal, { color: colors.text }]}>
                    {activeHub.availableSlots} Slots Open
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.bookingLabel, { color: colors.textSecondary }]}>RATE</Text>
                  <Text style={[styles.bookingVal, { color: '#ffce00' }]}>₹{activePrice} / Hour</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  Alert.alert('Redirecting', 'Navigating to Slot Selection Layout...');
                  router.push('/parking-hubs');
                }}
              >
                <Text style={styles.submitBtnText}>Book Parking Spot</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 🛡️ Safety & SOS Section (Collapsible) */}
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <TouchableOpacity
            style={styles.cardHeaderToggle}
            onPress={() => toggleSection('safety')}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeaderLeft}>
              <Shield size={20} color="#ffce00" />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Safety & Security Protocols</Text>
            </View>
            {isSafetyExpanded ? <ChevronUp size={18} color={colors.textSecondary} /> : <ChevronDown size={18} color={colors.textSecondary} />}
          </TouchableOpacity>

          {isSafetyExpanded && (
            <View style={styles.cardBody}>
              <View style={styles.safetySpecsGrid}>
                {[
                  { title: '24×7 CCTV', desc: 'AI Object detection' },
                  { title: 'ANPR Gates', desc: 'Verified entries' },
                  { title: 'Security Staff', desc: 'Active armed patrol' },
                  { title: 'Emergency', desc: 'On-site medical kits' }
                ].map((spec, index) => (
                  <View key={index} style={styles.safetyBox}>
                    <Text style={[styles.safetyTitle, { color: colors.text }]}>✓ {spec.title}</Text>
                    <Text style={[styles.safetyDesc, { color: colors.textSecondary }]}>{spec.desc}</Text>
                  </View>
                ))}
              </View>
              
              <TouchableOpacity
                style={[
                  styles.sosBtn,
                  isSosTriggered ? { backgroundColor: '#00cc6a' } : { backgroundColor: '#ff4b4b' }
                ]}
                onPress={handleSosPress}
              >
                <Text style={styles.sosBtnText}>{isSosTriggered ? 'CANCEL SOS ALARM' : '⚠️ TRIGGER SOS ALARM'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 🌟 Membership Tier Card (Collapsible) */}
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <TouchableOpacity
            style={styles.cardHeaderToggle}
            onPress={() => toggleSection('membership')}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeaderLeft}>
              <Sparkles size={20} color="#ffce00" />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Driver Membership</Text>
            </View>
            <View style={styles.headerRightInfo}>
              <View style={[styles.badge, { backgroundColor: 'rgba(255, 206, 0, 0.1)', borderColor: 'rgba(255,206,0,0.2)' }]}>
                <Text style={{ color: '#ffce00', fontSize: 10, fontWeight: 'bold' }}>{membershipTier} Tier</Text>
              </View>
              {isMembershipExpanded ? <ChevronUp size={18} color={colors.textSecondary} /> : <ChevronDown size={18} color={colors.textSecondary} />}
            </View>
          </TouchableOpacity>

          {isMembershipExpanded && (
            <View style={styles.cardBody}>
              <Text style={[styles.cardExpandTitle, { color: colors.text }]}>{membershipTier} Tier Benefits</Text>
              
              <View style={styles.amenitiesWrap}>
                {[
                  'Priority Parking Reservations',
                  'Free Access to High-speed Hub Wi-Fi',
                  '5% Discount on all Parking Fares',
                  'Exclusive Discounts on Rest Lounge and EV Slots'
                ].map((b) => (
                  <View key={b} style={styles.amenityRow}>
                    <Text style={styles.checkMark}>★</Text>
                    <Text style={[styles.amenityLabel, { color: colors.textSecondary }]}>{b}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#ffce00' }]}
                onPress={handleUpgradeMembership}
              >
                <Text style={styles.submitBtnText}>
                  {membershipTier === 'Silver' ? 'Upgrade to Gold Membership' : 'Downgrade Membership'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 🗺️ Nearby Driver Hubs */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Nearby Driver Hubs</Text>
        <View style={styles.nearbyGrid}>
          {(hubsList && hubsList.length > 1 ? hubsList.slice(1, 3) : [
            { parkingName: 'Galgotias University Hub', distance: '2.5 km', availableSlots: 80, status: 'Open' },
            { parkingName: 'Knowledge Park Metro Hub', distance: '3.8 km', availableSlots: 140, status: 'Open' }
          ]).map((hub, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.nearbyCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setActiveHub(hub);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.nearbyLeft}>
                <Text style={[styles.nearbyName, { color: colors.text }]}>{hub.parkingName || hub.parkingLocationName}</Text>
                <View style={styles.nearbyBadges}>
                  <Text style={[styles.nearbyDist, { color: colors.textSecondary }]}>
                    {hub.distance || '2.0 km'} · {hub.availableSlots || 100} Slots Open
                  </Text>
                </View>
              </View>
              <View style={styles.nearbyRight}>
                <View style={[styles.dotIndicator, { backgroundColor: '#00cc6a' }]} />
                <Text style={[styles.nearbyStatus, { color: '#00cc6a' }]}>Open</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 120, // clears the custom floating bottom tab bar
    gap: 16,
  },
  heroCapsule: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  heroGreeting: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  heroIntro: {
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  hubDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hubDetailLeft: {
    flex: 1,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  hubName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  hubBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeTextGreen: {
    color: '#00cc6a',
    fontSize: 11,
    fontWeight: 'bold',
  },
  hubDistance: {
    fontSize: 12,
  },
  hubRatingBlock: {
    alignItems: 'flex-end',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  ratingVal: {
    fontSize: 11,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 2,
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewMoreBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewMoreText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  capsuleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  serviceIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceCapsuleLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  serviceCapsuleSub: {
    fontSize: 10,
    color: '#a0aab2',
    marginTop: 1,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  cardHeaderToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  cardTitleOnly: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  headerRightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRateText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cardBody: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 16,
  },
  cardExpandTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bookingDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingLabel: {
    fontSize: 9,
    letterSpacing: 1,
  },
  bookingVal: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  bookingActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  bookingBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  bookingBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  noBookingCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  noBookingTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  noBookingText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  noBookingBtn: {
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  noBookingBtnText: {
    color: '#0b0c10',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statusGrid: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusValue: {
    fontSize: 12,
  },
  amenitiesWrap: {
    gap: 8,
    marginBottom: 16,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkMark: {
    color: '#ffce00',
    fontSize: 13,
    fontWeight: 'bold',
  },
  amenityLabel: {
    fontSize: 13,
  },
  actionBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#0b0c10',
    fontSize: 12,
    fontWeight: 'bold',
  },
  evSpecsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  evSpecBox: {
    flex: 1,
  },
  foodMenuRow: {
    gap: 8,
    marginBottom: 16,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodItemName: {
    fontSize: 13,
  },
  foodItemPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffce00',
  },
  menuBtn: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  facilitiesScroll: {
    gap: 10,
    paddingRight: 20,
  },
  facilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  facilityLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  submitBtn: {
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#0b0c10',
    fontSize: 13,
    fontWeight: 'bold',
  },
  safetySpecsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  safetyBox: {
    width: (width - 76) / 2,
  },
  safetyTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffce00',
  },
  safetyDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  sosBtn: {
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sosAlarmContainer: {
    backgroundColor: '#ffce00',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sosAlarmText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 11,
    flex: 1,
  },
  nearbyGrid: {
    gap: 12,
  },
  nearbyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  nearbyLeft: {
    flex: 1,
  },
  nearbyName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nearbyBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nearbyDist: {
    fontSize: 12,
  },
  nearbyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nearbyStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
