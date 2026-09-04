import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, Alert, useWindowDimensions, TouchableOpacity, ScrollView, Platform, LayoutAnimation, PanResponder, DeviceEventEmitter, TextInput, Linking, ImageBackground, Image as RNImage } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, ShieldCheck, HelpCircle, Info, PhoneCall, Car, FileText, Zap, AlertTriangle, CarFront, Shield, Droplet, User, Truck, Mic, X, MapPin, AlertCircle, Search, ArrowRight } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { api } from '@/services/api';
import { socketService } from '@/services/socket';
import { useAuth } from '@/context/AuthContext';
import { storage } from '@/services/storage';

import RadarMap from '@/components/drivix/RadarMap';
import AdCarousel from '@/components/drivix/AdCarousel';
import LocationCard from '@/components/drivix/LocationCard';
import SlotSelectionGrid from '@/components/drivix/SlotSelectionGrid';
import PricingCheckout from '@/components/drivix/PricingCheckout';
import QRPacketPass from '@/components/drivix/QRPacketPass';
import ActiveBookingBanner from '@/components/drivix/ActiveBookingBanner';
import GarageCard from '@/components/drivix/GarageCard';
import QuickServicesGrid from '@/components/drivix/QuickServicesGrid';
import CarDealsCarousel from '@/components/drivix/CarDealsCarousel';
import EVChargingCard from '@/components/drivix/EVChargingCard';
import FASTagAlertCard from '@/components/drivix/FASTagAlertCard';
import LoginBottomSheet from '@/components/LoginBottomSheet';
import ParkingHubsScreen from './parking-hubs';
import DriverHubScreen from './driver-hub';
import ChallanScreen from './challan';
import * as Location from 'expo-location';
import { setWebHeaderVisible } from '@/components/navigation-stubs';

import OfflineNotice from '@/components/OfflineNotice';

import { useTheme } from '@/hooks/use-theme';
import { useActiveBooking } from '@/hooks/useActiveBooking';
import { useUserVehicles } from '@/hooks/useUserVehicles';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WizardStep, DocumentComplianceStatus } from '@/types';

export default function DashboardScreen() {
  const { user, isAuthenticated, refreshProfile } = useAuth();
  const colors = useTheme();
  const { isConnected } = useNetworkStatus();

  const getDocumentCompliance = (type: 'DL' | 'PUC'): DocumentComplianceStatus => {
    if (!user || !user.documents) {
      return {
        status: type === 'PUC' ? 'PUC Missing' : 'DL Missing',
        color: type === 'PUC' ? '#ff6b35' : '#ffce00',
        bgColor: type === 'PUC' ? 'rgba(255, 107, 53, 0.08)' : 'rgba(255, 206, 0, 0.08)',
        borderColor: type === 'PUC' ? 'rgba(255, 107, 53, 0.15)' : 'rgba(255, 206, 0, 0.15)',
        icon: FileText
      };
    }

    const doc = user.documents.find((d: any) => d.type === type);
    if (!doc) {
      return {
        status: type === 'PUC' ? 'PUC Missing' : 'DL Missing',
        color: type === 'PUC' ? '#ff6b35' : '#ffce00',
        bgColor: type === 'PUC' ? 'rgba(255, 107, 53, 0.08)' : 'rgba(255, 206, 0, 0.08)',
        borderColor: type === 'PUC' ? 'rgba(255, 107, 53, 0.15)' : 'rgba(255, 206, 0, 0.15)',
        icon: FileText
      };
    }

    if (!doc.expiryDate) {
      return {
        status: type === 'PUC' ? 'PUC Active' : 'DL Active',
        color: '#00cc6a',
        bgColor: 'rgba(0, 204, 106, 0.08)',
        borderColor: 'rgba(0, 204, 106, 0.15)',
        icon: type === 'PUC' ? ShieldCheck : FileText
      };
    }

    const parts = doc.expiryDate.split('/');
    if (parts.length !== 3) {
      return {
        status: type === 'PUC' ? 'PUC Active' : 'DL Active',
        color: '#00cc6a',
        bgColor: 'rgba(0, 204, 106, 0.08)',
        borderColor: 'rgba(0, 204, 106, 0.15)',
        icon: type === 'PUC' ? ShieldCheck : FileText
      };
    }

    const [d, m, y] = parts.map(Number);
    const expiry = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: type === 'PUC' ? 'PUC Expired' : 'DL Expired',
        color: '#ff4b4b',
        bgColor: 'rgba(255, 75, 75, 0.08)',
        borderColor: 'rgba(255, 75, 75, 0.15)',
        icon: AlertTriangle
      };
    }

    const warningDays = type === 'DL' ? 30 : 5;
    if (diffDays <= warningDays) {
      return {
        status: type === 'PUC' ? `PUC Expiring soon` : `DL Expiring soon`,
        color: '#ffce00',
        bgColor: 'rgba(255, 206, 0, 0.08)',
        borderColor: 'rgba(255, 206, 0, 0.15)',
        icon: AlertTriangle
      };
    }

    return {
      status: type === 'PUC' ? 'PUC Active' : 'DL Active',
      color: '#00cc6a',
      bgColor: 'rgba(0, 204, 106, 0.08)',
      borderColor: 'rgba(0, 204, 106, 0.15)',
      icon: type === 'PUC' ? ShieldCheck : FileText
    };
  };
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { facilityId } = useLocalSearchParams<{ facilityId?: string }>();

  // Wizard Navigation Step
  const [step, setStep] = useState<WizardStep>('MAP');
  const [loginRequiredVisible, setLoginRequiredVisible] = useState(false);

  // Synchronize Tab Bar Visibility with Home wizard step state
  useEffect(() => {
    DeviceEventEmitter.emit('setHomeMapActive', step === 'MAP');
    // Ensure tab bar is shown again if unmounting Home screen
    return () => {
      DeviceEventEmitter.emit('setHomeMapActive', true);
    };
  }, [step]);

  // Form Fields
  const [duration, setDuration] = useState('1');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [loading, setLoading] = useState(false);

  // Custom Hooks for Active Booking and User Vehicles
  const { activeBooking, timeLeft: activeBookingTimeLeft } = useActiveBooking(isAuthenticated, step);
  const { vehicles: userVehicles, primaryVehicle } = useUserVehicles(isAuthenticated, step);

  // Pre-fill primary vehicle details upon entering checkout
  useEffect(() => {
    if (step === 'CHECKOUT' && primaryVehicle) {
      setVehicleNumber(primaryVehicle.plate || primaryVehicle.vehicleNumber || '');
      setVehicleName(primaryVehicle.model || '');
    }
  }, [step, primaryVehicle]);

  // Home Screen Feature States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isGarageCardVisible, setIsGarageCardVisible] = useState(false);
  const [activeHeroTab, setActiveHeroTab] = useState<'parking' | 'challan' | 'fastag'>('parking');
  const [activeCarTab, setActiveCarTab] = useState<'popular' | 'testdrive'>('popular');
  const [heroVehicleNumber, setHeroVehicleNumber] = useState('');
  const [isHeroInputFocused, setIsHeroInputFocused] = useState(false);

  useEffect(() => {
    const checkGarageCardVisibility = async () => {
      try {
        const dismissedDate = await storage.getItem('garage_card_dismissed_date');
        const todayStr = new Date().toISOString().split('T')[0];
        if (dismissedDate === todayStr) {
          setIsGarageCardVisible(false);
        } else {
          setIsGarageCardVisible(true);
        }
      } catch (err) {
        console.warn('Error checking garage card dismissed state:', err);
        setIsGarageCardVisible(true);
      }
    };
    if (isAuthenticated) {
      checkGarageCardVisibility();
    } else {
      setIsGarageCardVisible(false);
    }
  }, [isAuthenticated]);

  const handleDismissGarageCard = async () => {
    setIsGarageCardVisible(false);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await storage.saveItem('garage_card_dismissed_date', todayStr);
    } catch (err) {
      console.warn('Error saving garage card dismissed state:', err);
    }
  };

  const handleNavigateToTab = (webRoute: string) => {
    if (Platform.OS === 'web') {
      router.push(webRoute as any);
    } else {
      let nativeTab: 'bookings' | 'profile' = 'profile';
      let nativeSubTab: string = 'profile';

      if (webRoute.includes('tab=bookings')) {
        nativeTab = 'bookings';
        nativeSubTab = 'bookings';
      } else if (webRoute.includes('tab=wallet')) {
        nativeTab = 'profile';
        nativeSubTab = 'wallet';
      } else if (webRoute.includes('tab=vehicles')) {
        nativeTab = 'profile';
        nativeSubTab = 'vehicles';
      } else if (webRoute.includes('tab=documents')) {
        nativeTab = 'profile';
        nativeSubTab = 'documents';
      } else if (webRoute.includes('tab=fastag')) {
        nativeTab = 'profile';
        nativeSubTab = 'fastag';
      }

      DeviceEventEmitter.emit('changeTab', nativeTab);
      setTimeout(() => {
        DeviceEventEmitter.emit('changeSubTab', nativeSubTab);
      }, 100);
    }
  };

  useEffect(() => {
    if (primaryVehicle && primaryVehicle.plate) {
      setHeroVehicleNumber(primaryVehicle.plate.toUpperCase());
    }
  }, [primaryVehicle]);

  const [isServicesExpanded, setIsServicesExpanded] = useState(false);
  const isServicesExpandedRef = useRef(isServicesExpanded);
  useEffect(() => {
    isServicesExpandedRef.current = isServicesExpanded;
  }, [isServicesExpanded]);

  const toggleServices = (expand: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(
      280, // 280ms duration matches One UI speed
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.opacity
    ));
    setIsServicesExpanded(expand);
  };

  const panResponder = useMemo(() =>
    // eslint-disable-next-line react-hooks/refs
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy, vy } = gestureState;
        const isVertical = Math.abs(dy) > Math.abs(dx) * 2;
        const isFlick = Math.abs(vy) > 0.35;
        const isSignificantDrag = Math.abs(dy) > 35;

        if (isVertical && (isFlick || isSignificantDrag)) {
          if (dy < 0 && !isServicesExpandedRef.current) {
            return true;
          }
          if (dy > 0 && isServicesExpandedRef.current) {
            return true;
          }
        }
        return false;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -30 && !isServicesExpandedRef.current) {
          toggleServices(true);
        } else if (gestureState.dy > 30 && isServicesExpandedRef.current) {
          toggleServices(false);
        }
      },
    })
    , []);

  const dragHandlePanResponder = useMemo(() =>
    // eslint-disable-next-line react-hooks/refs
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        const { dx, dy } = gestureState;
        // Tap detection (minimal movement)
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) {
          toggleServices(!isServicesExpandedRef.current);
        } else {
          // Drag/Swipe detection
          if (dy < -10 && !isServicesExpandedRef.current) {
            toggleServices(true);
          } else if (dy > 10 && isServicesExpandedRef.current) {
            toggleServices(false);
          }
        }
      },
    })
    , []);

  // Core Data Lists
  const [locations, setLocations] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      } catch (err) {
        console.warn('Error getting user location in index.tsx:', err);
      }
    })();
  }, []);

  const processedLocations = React.useMemo(() => {
    if (!userLocation) return locations;
    return [...locations]
      .map((loc) => {
        const dist = getDistance(
          userLocation.latitude,
          userLocation.longitude,
          loc.latitude,
          loc.longitude
        );
        return { ...loc, distance: dist };
      })
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }, [locations, userLocation]);

  const filteredLocations = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    return processedLocations.filter(loc =>
      loc.parkingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, processedLocations]);

  // Selection States
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [pricing, setPricing] = useState<any | null>(null);

  // Reservation Timer State
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<any>(null);

  // Pass State
  const [booking, setBooking] = useState<any | null>(null);

  const fetchLocations = async () => {
    requestAnimationFrame(() => setLoading(true));
    try {
      const response = await api.get('/parking');
      requestAnimationFrame(() => setLocations(response.data));
    } catch (err: any) {
      console.warn('Error fetching locations:', err.message || err);
    } finally {
      requestAnimationFrame(() => setLoading(false));
    }
  };

  const handleSelectLocation = async (loc: any) => {
    setSelectedLocation(loc);
    setLoading(true);
    try {
      const response = await api.get(`/parking/${loc._id}/slots`);
      setSlots(response.data);
      setStep('SLOTS');
    } catch (err: any) {
      console.warn('Error fetching slots:', err.message || err);
      if (Platform.OS === 'web') {
        alert('Error: Failed to retrieve slot layout for this location.');
      } else {
        Alert.alert('Error', 'Failed to retrieve slot layout for this location.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocationById = async (facilityId: string) => {
    setLoading(true);
    try {
      const response = await api.get('/parking');
      const matched = response.data.find((l: any) => l._id === facilityId);
      if (matched) {
        setStep('MAP');
        await handleSelectLocation(matched);
      } else {
        if (Platform.OS === 'web') {
          alert('Error: Facility not found.');
        } else {
          Alert.alert('Error', 'Facility not found.');
        }
      }
    } catch (err: any) {
      console.warn('Error selecting location by id:', err.message || err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = async (slot: any) => {
    if (slot.status !== 'available') {
      const isReservedByMe = slot.status === 'temporarily_reserved' &&
        slot.reservedBy &&
        user &&
        slot.reservedBy.toString() === user._id.toString();

      if (!isReservedByMe) {
        if (Platform.OS === 'web') {
          alert('Slot Unavailable: This slot is currently being booked by another user. Please choose another available slot.');
        } else {
          Alert.alert(
            'Slot Unavailable',
            'This slot is currently being booked by another user. Please choose another available slot.'
          );
        }
        return;
      }
    }
    if (!isAuthenticated) {
      setLoginRequiredVisible(true);
      return;
    }
    setLoading(true);
    try {
      const response = await api.post(`/parking/${selectedLocation._id}/slots/${slot.id}/reserve`);
      if (response.data) {
        setSelectedSlot(response.data);

        // Fetch pricing recommendation
        const responsePricing = await api.get(`/parking/${selectedLocation._id}/pricing`);
        setPricing(responsePricing.data);

        setStep('CHECKOUT');
        setTimer(300); // 5 minutes soft-lock
      }
    } catch (err: any) {
      console.warn('Error reserving slot:', err.message || err);
      const errMsg = err.response?.data?.message || 'This slot is already being booked. Please select another slot.';
      if (Platform.OS === 'web') {
        alert(`Slot Unavailable: ${errMsg}`);
      } else {
        Alert.alert('Slot Unavailable', errMsg);
      }
      // Refresh slot layout
      handleSelectLocation(selectedLocation);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseSlot = async () => {
    if (!selectedSlot || !selectedLocation) return;
    setLoading(true);
    try {
      await api.post(`/parking/${selectedLocation._id}/slots/${selectedSlot.id}/release`);
    } catch (err: any) {
      console.warn('Error releasing slot:', err.message || err);
    } finally {
      setSelectedSlot(null);
      setTimer(0);
      // Refresh slots layout
      const response = await api.get(`/parking/${selectedLocation._id}/slots`);
      setSlots(response.data);
      setStep('SLOTS');
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (paymentOption: 'PAY_NOW' | 'PAY_AFTER_CHECKOUT', additionalServices?: string[]) => {
    if (!selectedSlot || !selectedLocation) return;
    setLoading(true);
    try {
      const response = await api.post('/bookings', {
        facilityId: selectedLocation._id,
        slotId: selectedSlot.id,
        durationHours: Number(duration),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        vehicleModel: vehicleName.trim(),
        paymentOption,
        additionalServices,
      });

      if (response.data) {
        // Clear active reservation timer
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        setTimer(0);
        setBooking(response.data);
        setStep('PASS');
        await refreshProfile();
      }
    } catch (err: any) {
      console.warn('Error confirming booking:', err.message || err);
      const errMsg = err.response?.data?.message || 'Booking failed. Your reservation may have expired.';
      if (Platform.OS === 'web') {
        alert(`Booking Failed: ${errMsg}`);
      } else {
        Alert.alert('Booking Failed', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFinishBooking = () => {
    setStep('MAP');
    setSelectedLocation(null);
    setSelectedSlot(null);
    setPricing(null);
    setBooking(null);
    fetchLocations();
  };

  // Fetch Locations on Mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Trigger automatic selection if facilityId is passed in search params
  useEffect(() => {
    if (facilityId && locations.length > 0) {
      const matched = locations.find((l) => l._id === facilityId);
      if (matched) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        handleSelectLocation(matched);
      }
    }
  }, [facilityId, locations]);

  // Autofill primary vehicle details if user updates
  useEffect(() => {
    if (user && user.vehicles && user.vehicles.length > 0) {
      const primary = user.vehicles.find((v: any) => v.isPrimary) || user.vehicles[0];
      const handle = requestAnimationFrame(() => {
        setVehicleNumber(primary.plate);
        setVehicleName(primary.model);
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [user]);

  // Reservation Countdown Timer Handler
  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setTimeout(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && selectedSlot && step === 'CHECKOUT') {
      if (Platform.OS === 'web') {
        alert('Reservation Expired: Your 5-minute slot reservation has expired. Please select a slot again.');
        // eslint-disable-next-line react-hooks/set-state-in-effect
        handleReleaseSlot();
      } else {
        Alert.alert(
          'Reservation Expired',
          'Your 5-minute slot reservation has expired. Please select a slot again.',
          [{ text: 'OK', onPress: () => handleReleaseSlot() }]
        );
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer]);

  // Socket.IO Listener for Real-Time Slot Updates
  useEffect(() => {
    if (step === 'SLOTS' && selectedLocation) {
      socketService.connect();
      socketService.on('slotStatusUpdated', (data: any) => {
        // Only update if it belongs to current facility
        if (String(data.facilityId) === String(selectedLocation._id)) {
          setSlots((prevSlots) =>
            prevSlots.map((s) =>
              s.id === data.id
                ? {
                  ...s,
                  status: data.status,
                  reservedBy: data.reservedBy,
                  reservationExpiresAt: data.reservationExpiresAt
                }
                : s
            )
          );
        }
      });
    }

    return () => {
      socketService.off('slotStatusUpdated');
    };
  }, [step, selectedLocation]);

  // Listen to admin booking cancellations/removals globally
  useEffect(() => {
    if (isAuthenticated && user) {
      socketService.connect();
      socketService.on('bookingRemoved', (data: any) => {
        if (data.userId === user._id) {
          if (Platform.OS === 'web') {
            alert(`Admin removed the bookings. Booking ID: ${data.bookingId}`);
          } else {
            Alert.alert(
              'Booking Cancelled',
              `Admin removed the bookings. Booking ID: ${data.bookingId}`
            );
          }
          // Reset step back to MAP and refresh state
          setStep('MAP');
          setSelectedLocation(null);
          setSelectedSlot(null);
          setPricing(null);
          setBooking(null);
          refreshProfile();
          fetchLocations();
        }
      });
    }

    return () => {
      socketService.off('bookingRemoved');
    };
  }, [isAuthenticated, user]);

  // Synchronize web header visibility with the active step
  useEffect(() => {
    setWebHeaderVisible(step !== 'PARKING_HUBS');
    return () => {
      setWebHeaderVisible(true);
    };
  }, [step]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineNotice isVisible={!isConnected} />
      {/* ── Ambient Glow Background Layers ── */}
      <View style={styles.ambientGlowTopLeft} pointerEvents="none" />
      <View style={styles.ambientGlowTopRight} pointerEvents="none" />

      {loading && step !== 'CHECKOUT' && step !== 'PASS' && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffce00" />
        </View>
      )}

      {/* -------------------- STEP 0: DISCOVERY MAP -------------------- */}
      {step === 'MAP' && (
        <View style={styles.viewContainer}>
          <FlatList
            data={[]}
            keyExtractor={() => 'dummy'}
            renderItem={null}
            ListHeaderComponent={
              <View>
                {/* Redesigned Dashboard Header */}
                <View style={styles.dashboardHeader}>
                  <View style={styles.welcomeWrapper}>
                    {/* Glowing Circular Avatar block */}
                    <View style={[styles.avatarCircle, { backgroundColor: 'rgba(255, 206, 0, 0.08)', borderColor: 'rgba(255, 206, 0, 0.25)' }]}>
                      <Text style={styles.avatarText}>
                        {user?.name ? user.name.substring(0, 2).toUpperCase() : 'SA'}
                      </Text>
                      <View style={styles.avatarActiveDot} />
                    </View>
                    <View>
                      <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Welcome back,</Text>
                      <Text style={[styles.titleText, { color: colors.text }]}>{user?.name || 'Sajid Ahmad'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.walletBadge, { backgroundColor: 'rgba(21, 22, 30, 0.65)', borderColor: 'rgba(255, 206, 0, 0.25)' }]}
                    onPress={() => handleNavigateToTab('/explore?tab=wallet')}
                    activeOpacity={0.8}
                  >
                    <CreditCard size={15} color={colors.primary} />
                    <Text style={[styles.walletText, { color: colors.text }]}>Rs. {user?.walletBalance ?? 0}</Text>
                  </TouchableOpacity>
                </View>

                {/* ── Active Session / Reservation Widget ── */}
                {activeBooking && (
                  <ActiveBookingBanner
                    activeBooking={activeBooking}
                    timeLeft={activeBookingTimeLeft}
                    onPressPass={() => setStep('PASS')}
                    colors={colors}
                  />
                )}

                {/* ── Low FASTag Balance Warning Card ── */}
                <FASTagAlertCard
                  balance={user?.walletBalance ?? 0}
                  vehicleNumber={primaryVehicle?.plate}
                  onReloadSuccess={refreshProfile}
                  colors={colors}
                />

                {/* ── EV Charging Live Telemetry Card ── */}
                {primaryVehicle && (primaryVehicle.type === 'ev' || primaryVehicle.model?.toLowerCase().includes('ev') || primaryVehicle.plate?.toLowerCase().includes('ev')) && (
                  <EVChargingCard
                    vehicleModel={primaryVehicle.model}
                    colors={colors}
                  />
                )}

                {/* ── Pending Slot Reservation Widget (Soft Lock) ── */}
                {selectedSlot && step === 'MAP' && timer > 0 && (
                  <View style={[styles.activeSessionCard, { backgroundColor: colors.backgroundElement, borderColor: '#ff6b35', borderWidth: 1 }]}>
                    <View style={styles.sessionHeader}>
                      <Text style={[styles.sessionTitle, { color: colors.text }]}>Pending Reservation</Text>
                      <View style={[styles.sessionPulse, { backgroundColor: '#ff6b35' }]} />
                    </View>
                    <View style={styles.sessionRow}>
                      <View style={styles.sessionDetails}>
                        <Text style={[styles.sessionHubName, { color: colors.text }]}>{selectedLocation?.parkingName}</Text>
                        <Text style={[styles.sessionSlotText, { color: colors.textSecondary }]}>Slot {selectedSlot.id}</Text>
                      </View>
                      <View style={styles.sessionTimer}>
                        <Text style={styles.sessionTimerLabel}>Expires In</Text>
                        <Text style={[styles.sessionTimerVal, { color: '#ff6b35' }]}>{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                      <TouchableOpacity
                        style={[styles.sessionManageBtn, { flex: 1, backgroundColor: '#ff6b35' }]}
                        onPress={() => setStep('CHECKOUT')}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.sessionManageBtnText}>Complete Checkout</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.sessionManageBtn, { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }]}
                        onPress={handleReleaseSlot}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.sessionManageBtnText, { color: '#ffffff' }]}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* ── Search Bar Component ── */}
                <View style={[styles.searchBarContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
                  <View style={styles.searchInner}>
                    <MapPin size={18} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.text }]}
                      placeholder="Search destination or parking..."
                      placeholderTextColor={colors.textSecondary}
                      value={searchQuery}
                      onChangeText={(txt) => {
                        setSearchQuery(txt);
                        setIsSearchFocused(true);
                      }}
                      onFocus={() => setIsSearchFocused(true)}
                    />
                    {searchQuery ? (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <X size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    ) : (
                      <Mic size={16} color={colors.textSecondary} />
                    )}
                  </View>
                </View>

                {/* Autocomplete Suggestions Overlay */}
                {isSearchFocused && searchQuery.length > 0 && (
                  <View style={[styles.searchOverlay, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
                    {filteredLocations.length > 0 ? (
                      filteredLocations.map((loc) => (
                        <TouchableOpacity
                          key={loc._id}
                          style={[styles.searchSuggestItem, { borderBottomColor: colors.borderGlass }]}
                          onPress={() => {
                            setSearchQuery('');
                            setIsSearchFocused(false);
                            handleSelectLocation(loc);
                          }}
                        >
                          <MapPin size={14} color={colors.primary} />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.suggestName, { color: colors.text }]}>{loc.parkingName}</Text>
                            <Text style={[styles.suggestAddress, { color: colors.textSecondary }]} numberOfLines={1}>{loc.address}</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={[styles.noSuggestText, { color: colors.textSecondary }]}>No matching parking hubs found</Text>
                    )}
                    <TouchableOpacity
                      style={styles.closeSuggestBtn}
                      onPress={() => setIsSearchFocused(false)}
                    >
                      <Text style={[styles.closeSuggestBtnText, { color: colors.primary }]}>Close Suggestions</Text>
                    </TouchableOpacity>
                  </View>
                )}


                {/* ── My Garage compliance status ── */}
                {isAuthenticated && primaryVehicle && isGarageCardVisible && (
                  <GarageCard
                    primaryVehicle={primaryVehicle}
                    user={user}
                    getDocumentCompliance={getDocumentCompliance}
                    onNavigateToTab={handleNavigateToTab}
                    onDismiss={handleDismissGarageCard}
                    colors={colors}
                  />
                )}

                {/* Hero Section */}
                <View style={styles.heroCardOuter}>
                  {/* Dynamic Interactive Background Image */}
                  {activeHeroTab === 'parking' && (
                    <ImageBackground
                      source={require('../../assets/images/parking_bg.jpg')}
                      style={StyleSheet.absoluteFill}
                      imageStyle={{ borderRadius: 24, resizeMode: 'cover' }}
                    >
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8, 12, 20, 0.76)' }]} />
                    </ImageBackground>
                  )}
                  {activeHeroTab === 'challan' && (
                    <ImageBackground
                      source={require('../../assets/images/challan_bg.jpg')}
                      style={StyleSheet.absoluteFill}
                      imageStyle={{ borderRadius: 24, resizeMode: 'cover' }}
                    >
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8, 12, 20, 0.78)' }]} />
                    </ImageBackground>
                  )}
                  {activeHeroTab === 'fastag' && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backgroundElement, borderRadius: 24 }]} />
                  )}

                  <View style={styles.heroCardInner}>
                    {/* Service Tabs */}
                    <View style={styles.heroTabsContainer}>
                      {/* Book Slot Tab */}
                      <TouchableOpacity
                        style={[
                          styles.heroTabButton,
                          {
                            backgroundColor: activeHeroTab === 'parking' ? 'rgba(255, 206, 0, 0.12)' : 'rgba(20, 25, 38, 0.65)',
                            borderColor: activeHeroTab === 'parking' ? colors.primary : 'rgba(255, 255, 255, 0.12)',
                            borderWidth: activeHeroTab === 'parking' ? 1.5 : 1,
                          }
                        ]}
                        onPress={() => {
                          setActiveHeroTab('parking');
                          setIsSearchFocused(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[
                          styles.heroTabIconP,
                          {
                            backgroundColor: activeHeroTab === 'parking' ? colors.primary : 'rgba(255, 255, 255, 0.1)'
                          }
                        ]}>
                          <Text style={[
                            styles.heroTabIconPText,
                            {
                              color: activeHeroTab === 'parking' ? '#000000' : 'rgba(255, 255, 255, 0.7)'
                            }
                          ]}>P</Text>
                        </View>
                        <Text style={[
                          styles.heroTabLabel,
                          {
                            color: activeHeroTab === 'parking' ? '#ffffff' : colors.textSecondary
                          }
                        ]}>Book Slot</Text>
                        {activeHeroTab === 'parking' && (
                          <View style={[styles.heroTabActiveBar, { backgroundColor: colors.primary }]} />
                        )}
                      </TouchableOpacity>

                      {/* E-Challan Tab */}
                      <TouchableOpacity
                        style={[
                          styles.heroTabButton,
                          {
                            backgroundColor: activeHeroTab === 'challan' ? 'rgba(255, 206, 0, 0.12)' : 'rgba(20, 25, 38, 0.65)',
                            borderColor: activeHeroTab === 'challan' ? colors.primary : 'rgba(255, 255, 255, 0.12)',
                            borderWidth: activeHeroTab === 'challan' ? 1.5 : 1,
                          }
                        ]}
                        onPress={() => {
                          setActiveHeroTab('challan');
                          setIsSearchFocused(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[
                          styles.heroTabIconTraffic,
                          {
                            borderColor: activeHeroTab === 'challan' ? colors.primary : 'rgba(255, 255, 255, 0.15)',
                            backgroundColor: 'rgba(0, 0, 0, 0.4)'
                          }
                        ]}>
                          <View style={[styles.heroTabIconTrafficDot, { backgroundColor: '#ff4b4b', opacity: activeHeroTab === 'challan' ? 1 : 0.6 }]} />
                          <View style={[styles.heroTabIconTrafficDot, { backgroundColor: '#ffae0e', opacity: activeHeroTab === 'challan' ? 1 : 0.6 }]} />
                          <View style={[styles.heroTabIconTrafficDot, { backgroundColor: '#00cc6a', opacity: activeHeroTab === 'challan' ? 1 : 0.6 }]} />
                        </View>
                        <Text style={[
                          styles.heroTabLabel,
                          {
                            color: activeHeroTab === 'challan' ? '#ffffff' : colors.textSecondary
                          }
                        ]}>E-Challan</Text>
                        {activeHeroTab === 'challan' && (
                          <View style={[styles.heroTabActiveBar, { backgroundColor: colors.primary }]} />
                        )}
                      </TouchableOpacity>

                      {/* FASTag Tab */}
                      <TouchableOpacity
                        style={[
                          styles.heroTabButton,
                          {
                            backgroundColor: activeHeroTab === 'fastag' ? 'rgba(255, 206, 0, 0.12)' : 'rgba(20, 25, 38, 0.65)',
                            borderColor: activeHeroTab === 'fastag' ? colors.primary : 'rgba(255, 255, 255, 0.12)',
                            borderWidth: activeHeroTab === 'fastag' ? 1.5 : 1,
                          }
                        ]}
                        onPress={() => {
                          setActiveHeroTab('fastag');
                          setIsSearchFocused(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[
                          styles.heroTabIconFastag,
                          {
                            borderColor: activeHeroTab === 'fastag' ? colors.primary : 'rgba(255, 255, 255, 0.15)',
                            backgroundColor: 'rgba(0, 0, 0, 0.4)'
                          }
                        ]}>
                          <Text style={[
                            styles.heroTabIconFastagText,
                            {
                              color: activeHeroTab === 'fastag' ? colors.primary : 'rgba(255, 255, 255, 0.7)'
                            }
                          ]}>FASTag</Text>
                        </View>
                        <Text style={[
                          styles.heroTabLabel,
                          {
                            color: activeHeroTab === 'fastag' ? '#ffffff' : colors.textSecondary
                          }
                        ]}>FASTag</Text>
                        {activeHeroTab === 'fastag' && (
                          <View style={[styles.heroTabActiveBar, { backgroundColor: colors.primary }]} />
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Search Input Container */}
                    <View style={[
                      styles.heroInputContainer,
                      {
                        borderColor: isHeroInputFocused ? colors.primary : 'rgba(255, 255, 255, 0.2)',
                        backgroundColor: 'rgba(15, 20, 32, 0.88)'
                      }
                    ]}>
                      {activeHeroTab === 'parking' && <Search size={18} color="#ffce00" />}
                      {activeHeroTab === 'challan' && <AlertTriangle size={18} color="#ffce00" />}
                      {activeHeroTab === 'fastag' && <CreditCard size={18} color="#ffce00" />}

                      <TextInput
                        style={[styles.heroTextInput, { color: '#ffffff' }]}
                        placeholder={
                          activeHeroTab === 'parking'
                            ? "Search parking locations..."
                            : activeHeroTab === 'challan'
                              ? "Enter Vehicle Number (e.g. DL1CA1234)"
                              : "Enter Vehicle Number / FASTag ID"
                        }
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={activeHeroTab === 'parking' ? searchQuery : heroVehicleNumber}
                        onChangeText={(txt) => {
                          if (activeHeroTab === 'parking') {
                            setSearchQuery(txt);
                            setIsSearchFocused(true);
                          } else {
                            setHeroVehicleNumber(txt);
                          }
                        }}
                        onFocus={() => {
                          setIsHeroInputFocused(true);
                          if (activeHeroTab === 'parking' && searchQuery) {
                            setIsSearchFocused(true);
                          }
                        }}
                        onBlur={() => {
                          setIsHeroInputFocused(false);
                        }}
                        autoCapitalize={activeHeroTab !== 'parking' ? 'characters' : 'none'}
                      />

                      {((activeHeroTab === 'parking' && searchQuery) || (activeHeroTab !== 'parking' && heroVehicleNumber)) ? (
                        <TouchableOpacity onPress={() => {
                          if (activeHeroTab === 'parking') {
                            setSearchQuery('');
                            setIsSearchFocused(false);
                          } else {
                            setHeroVehicleNumber('');
                          }
                        }}>
                          <X size={16} color="#ffffff" />
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {/* Primary Action Button */}
                    <TouchableOpacity
                      style={[styles.heroActionButton, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        if (activeHeroTab === 'parking') {
                          if (!searchQuery.trim()) {
                            Alert.alert('Required', 'Please enter a destination or parking name.');
                            return;
                          }
                          if (filteredLocations.length > 0) {
                            handleSelectLocation(filteredLocations[0]);
                          } else {
                            Alert.alert('Not Found', 'No matching parking hubs found.');
                          }
                        } else if (activeHeroTab === 'challan') {
                          if (!heroVehicleNumber.trim()) {
                            Alert.alert('Required', 'Please enter your vehicle number.');
                            return;
                          }
                          setStep('CHALLAN');
                        } else if (activeHeroTab === 'fastag') {
                          if (!heroVehicleNumber.trim()) {
                            Alert.alert('Required', 'Please enter your vehicle number or FASTag ID.');
                            return;
                          }
                          handleNavigateToTab('/explore?tab=fastag');
                        }
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.heroActionButtonText}>
                        {activeHeroTab === 'parking' && "Find Parking Slot"}
                        {activeHeroTab === 'challan' && "Check Challans"}
                        {activeHeroTab === 'fastag' && "Recharge FASTag"}
                      </Text>
                      <ArrowRight size={18} color="#000000" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ── Our Services Capsule Grid ── */}
                <QuickServicesGrid
                  isServicesExpanded={isServicesExpanded}
                  onToggleExpand={toggleServices}
                  onSelectService={(label, route) => {
                    if (label === 'Parking') {
                      setStep('PARKING_HUBS');
                    } else if (label === 'Driver Hub') {
                      setStep('DRIVER_HUB');
                    } else if (label === 'Challan') {
                      setStep('CHALLAN');
                    } else {
                      handleNavigateToTab(route);
                    }
                  }}
                  panHandlers={panResponder.panHandlers}
                  dragHandlePanHandlers={dragHandlePanResponder.panHandlers}
                  colors={colors}
                />

                {/* ── Buy Your Dream Car Section ── */}
                <CarDealsCarousel />

                <AdCarousel />
              </View>
            }
            showsVerticalScrollIndicator={false}
            style={styles.locationsList}
          />
        </View>
      )}

      {/* -------------------- STEP 1: REAL-TIME SLOTS GRID -------------------- */}
      {step === 'SLOTS' && selectedLocation && (
        <View style={styles.viewContainer}>
          <SlotSelectionGrid
            slots={slots}
            selectedSlot={selectedSlot}
            onSelectSlot={handleSelectSlot}
            onBack={() => setStep('MAP')}
            locationName={selectedLocation.parkingName}
          />
        </View>
      )}

      {/* -------------------- STEP 2: PRICING & CHECKOUT -------------------- */}
      {step === 'CHECKOUT' && selectedLocation && (
        <View style={styles.viewContainer}>
          <PricingCheckout
            selectedSlot={selectedSlot}
            selectedLocation={selectedLocation}
            pricing={pricing}
            timer={timer}
            user={user}
            duration={duration}
            setDuration={setDuration}
            vehicleNumber={vehicleNumber}
            setVehicleNumber={setVehicleNumber}
            vehicleName={vehicleName}
            setVehicleName={setVehicleName}
            loading={loading}
            onConfirm={handleConfirmBooking}
            onRelease={handleReleaseSlot}
            userVehicles={userVehicles}
          />
        </View>
      )}

      {/* -------------------- STEP 3: DIGITAL TICKET PASS -------------------- */}
      {step === 'PASS' && booking && (
        <View style={styles.viewContainer}>
          <QRPacketPass
            booking={booking}
            selectedLocation={selectedLocation}
            selectedSlot={selectedSlot}
            duration={duration}
            vehicleNumber={vehicleNumber}
            onDone={handleFinishBooking}
          />
        </View>
      )}

      {/* -------------------- STEP 4: PARKING HUBS DISCOVERY -------------------- */}
      {step === 'PARKING_HUBS' && (
        <ParkingHubsScreen
          onBack={() => setStep('MAP')}
          onBook={handleSelectLocationById}
        />
      )}

      {/* -------------------- STEP 5: DRIVER HUB EXPERIENCE -------------------- */}
      {step === 'DRIVER_HUB' && (
        <DriverHubScreen
          onBack={() => setStep('MAP')}
          selectedLocation={selectedLocation}
          locations={locations}
        />
      )}

      {/* -------------------- STEP 6: CHALLAN SETTLEMENT EXPERIENCE -------------------- */}
      {step === 'CHALLAN' && (
        <ChallanScreen
          onBack={() => setStep('MAP')}
          initialVehicleNumber={heroVehicleNumber}
        />
      )}

      {/* Guest Login Alert Modal */}
      <LoginBottomSheet
        visible={loginRequiredVisible}
        onCancel={() => setLoginRequiredVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ambientGlowTopLeft: {
    position: 'absolute',
    top: -100,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 206, 0, 0.035)',
    zIndex: -1,
  },
  ambientGlowTopRight: {
    position: 'absolute',
    top: 120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(0, 242, 255, 0.025)',
    zIndex: -1,
  },
  welcomeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  avatarText: {
    color: '#ffce00',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  avatarActiveDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00cc6a',
    borderWidth: 1.5,
    borderColor: '#07080c',
  },
  container: {
    flex: 1,
    backgroundColor: '#07080c',
  },
  viewContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  welcomeText: {
    color: '#8a959e',
    fontSize: 12,
    fontWeight: '600',
  },
  titleText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 22, 30, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 206, 0, 0.2)',
    gap: 6,
  },
  walletText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  mapContainer: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 206, 0, 0.15)',
    marginBottom: 20,
    backgroundColor: '#07080c',
    shadowColor: '#ffce00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  locationsList: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 12, 16, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  heroCardOuter: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 206, 0, 0.35)',
    marginBottom: 20,
    backgroundColor: '#0a0d16',
    shadowColor: '#ffce00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  heroCardInner: {
    padding: 18,
    zIndex: 2,
  },
  heroTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  heroTabButton: {
    flex: 1,
    height: 76,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 6,
  },
  heroTabIconP: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTabIconPText: {
    fontSize: 13,
    fontWeight: '900',
  },
  heroTabIconTraffic: {
    width: 22,
    height: 24,
    borderRadius: 6,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: 3,
    borderWidth: 1,
  },
  heroTabIconTrafficDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  heroTabIconFastag: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTabIconFastagText: {
    fontSize: 7,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  heroTabLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  heroTabActiveBar: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
    marginTop: 2,
  },
  heroInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    marginBottom: 16,
    gap: 8,
  },
  heroTextInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
    paddingVertical: 0,
  },
  heroActionButton: {
    height: 46,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  heroActionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0b0c10',
  },
  footerSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  supportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  supportCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  supportCardText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  servicesSection: {
    marginBottom: 20,
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  servicesTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.3,
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
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
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
    marginTop: 1,
  },
  dragHandleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 12,
  },
  dragHandle: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
    opacity: 0.45,
  },
  activeSessionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sessionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sessionPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00cc6a',
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDetails: {
    flex: 1,
  },
  sessionHubName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sessionSlotText: {
    fontSize: 12,
    marginTop: 2,
  },
  sessionTimer: {
    alignItems: 'flex-end',
  },
  sessionTimerLabel: {
    color: '#a0aab2',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  sessionTimerVal: {
    color: '#ffce00',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginTop: 2,
  },
  sessionManageBtn: {
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionManageBtnText: {
    color: '#0b0c10',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchBarContainer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    paddingVertical: 0,
  },
  searchOverlay: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    zIndex: 10,
  },
  searchSuggestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  suggestName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  suggestAddress: {
    fontSize: 11,
    marginTop: 2,
  },
  noSuggestText: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
  closeSuggestBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  closeSuggestBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickPinsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  quickPinBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickPinText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  garageContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  garageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  garageTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  garagePlate: {
    fontSize: 11,
  },
  garageLink: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  complianceRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  complianceText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  dreamCarSection: {
    backgroundColor: '#110b29',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(120, 80, 245, 0.3)',
    paddingVertical: 20,
    marginVertical: 16,
    shadowColor: '#6344e7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  dreamCarHeaderAccents: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dreamCarSparkle: {
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dreamCarSubtitle: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  dreamCarTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  dreamCarBrand: {
    color: '#a78bfa',
    fontStyle: 'italic',
    fontWeight: '900',
  },
  dreamCarTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  dreamCarTabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  dreamCarTabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dreamCarActiveIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '80%',
    height: 3,
    backgroundColor: '#ffffff',
    borderRadius: 1.5,
  },
  carCardContainer: {
    backgroundColor: '#181236',
    borderRadius: 22,
    padding: 16,
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  carImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
    overflow: 'hidden',
  },
  carCardImage: {
    width: '92%',
    height: '92%',
  },
  carRatingBadge: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  carRatingStar: {
    color: '#059669',
    fontSize: 12,
    fontWeight: 'bold',
  },
  carRatingText: {
    color: '#1e293b',
    fontSize: 12,
    fontWeight: '700',
  },
  carInfoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  carModelTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  carModelSpecs: {
    color: '#a6a0c5',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  bookTestDriveBtn: {
    backgroundColor: '#6344e7',
    width: '100%',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6344e7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  bookTestDriveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  viewMoreCarsLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewMoreCarsLinkText: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '700',
  },
});

