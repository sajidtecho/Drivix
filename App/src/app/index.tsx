import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, Alert, useWindowDimensions, TouchableOpacity, ScrollView, Platform, LayoutAnimation, PanResponder, DeviceEventEmitter, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, ShieldCheck, HelpCircle, Info, PhoneCall, Car, FileText, Zap, AlertTriangle, CarFront, Shield, Droplet, User, Truck, Mic, X, MapPin, AlertCircle } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { api } from '@/services/api';
import { socketService } from '@/services/socket';
import { useAuth } from '@/context/AuthContext';

import RadarMap from '@/components/drivix/RadarMap';
import AdCarousel from '@/components/drivix/AdCarousel';
import LocationCard from '@/components/drivix/LocationCard';
import SlotSelectionGrid from '@/components/drivix/SlotSelectionGrid';
import PricingCheckout from '@/components/drivix/PricingCheckout';
import QRPacketPass from '@/components/drivix/QRPacketPass';
import LoginBottomSheet from '@/components/LoginBottomSheet';
import ParkingHubsScreen from './parking-hubs';
import DriverHubScreen from './driver-hub';
import * as Location from 'expo-location';
import { setWebHeaderVisible } from '@/components/navigation-stubs';

import { useTheme } from '@/hooks/use-theme';

type WizardStep = 'MAP' | 'SLOTS' | 'CHECKOUT' | 'PASS' | 'PARKING_HUBS' | 'DRIVER_HUB';

export default function DashboardScreen() {
  const { user, isAuthenticated, refreshProfile } = useAuth();
  const colors = useTheme();
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

  // Registered Vehicles List for pre-filling and selection
  const [userVehicles, setUserVehicles] = useState<any[]>([]);

  // Fetch vehicles and pre-fill fields with the primary vehicle upon entering checkout
  useEffect(() => {
    if (step === 'CHECKOUT' && isAuthenticated) {
      const fetchAndPrefill = async () => {
        try {
          const res = await api.get('/vehicles');
          const list = res.data || [];
          setUserVehicles(list);
          
          if (list.length > 0) {
            const primary = list.find((v: any) => v.isPrimary) || list[0];
            if (primary) {
              setVehicleNumber(primary.plate || primary.vehicleNumber || '');
              setVehicleName(primary.model || '');
            }
          }
        } catch (err) {
          console.warn('Error pre-filling primary vehicle:', err);
        }
      };
      fetchAndPrefill();
    }
  }, [step, isAuthenticated]);
  const [loading, setLoading] = useState(false);

  // Home Screen Feature States
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [activeBookingTimeLeft, setActiveBookingTimeLeft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const fetchActiveBookings = async () => {
    if (!isAuthenticated) {
      setActiveBooking(null);
      return;
    }
    try {
      const res = await api.get('/bookings/my');
      const list = res.data || [];
      const active = list.find((b: any) => b.status === 'booked');
      setActiveBooking(active || null);
    } catch (err) {
      console.warn('Error fetching active bookings for home screen:', err);
    }
  };

  const fetchUserVehicles = async () => {
    if (!isAuthenticated) {
      setUserVehicles([]);
      return;
    }
    try {
      const res = await api.get('/vehicles');
      setUserVehicles(res.data || []);
    } catch (err) {
      console.warn('Error fetching vehicles for home screen:', err);
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
    fetchActiveBookings();
    fetchUserVehicles();
  }, [isAuthenticated]);

  useEffect(() => {
    if (step === 'MAP') {
      fetchActiveBookings();
      fetchUserVehicles();
    }
  }, [step]);

  useEffect(() => {
    if (!activeBooking) {
      setActiveBookingTimeLeft('');
      return;
    }
    const calculateTime = () => {
      try {
        const [year, month, day] = activeBooking.entryDate.split('-').map(Number);
        const [hour, minute] = activeBooking.entryTime.split(':').map(Number);
        const duration = activeBooking.durationHours || activeBooking.duration || 1;
        const startTime = new Date(year, month - 1, day, hour, minute);
        const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
        const now = new Date();
        const diff = endTime.getTime() - now.getTime();
        if (diff <= 0) {
          setActiveBookingTimeLeft('EXPIRED');
        } else {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setActiveBookingTimeLeft(`${h}h ${m}m ${s}s`);
        }
      } catch (err) {
        console.warn('Error calculating active booking time:', err);
      }
    };
    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [activeBooking]);

  const primaryVehicle = React.useMemo(() => {
    if (userVehicles.length === 0) return null;
    return userVehicles.find((v: any) => v.isPrimary) || userVehicles[0];
  }, [userVehicles]);

  const [isServicesExpanded, setIsServicesExpanded] = useState(false);
  const isServicesExpandedRef = useRef(isServicesExpanded);
  isServicesExpandedRef.current = isServicesExpanded;

  const toggleServices = (expand: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(
      280, // 280ms duration matches One UI speed
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.opacity
    ));
    setIsServicesExpanded(expand);
  };

  const panResponder = useRef(
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
  ).current;

  const dragHandlePanResponder = useRef(
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
  ).current;

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

  // Form Fields
  const [duration, setDuration] = useState('1');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleName, setVehicleName] = useState('');

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
      if (step !== 'SLOTS') {
        socketService.off('slotStatusUpdated');
      }
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
                {/* Header */}
                <View style={styles.dashboardHeader}>
                  <View>
                    <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Hi, {user?.name || 'Driver'}</Text>
                    <Text style={[styles.titleText, { color: colors.text }]}>Find Parking Space</Text>
                  </View>
                  <View style={[styles.walletBadge, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}>
                    <CreditCard size={16} color={colors.primary} />
                    <Text style={[styles.walletText, { color: colors.text }]}>Rs. {user?.walletBalance ?? 0}</Text>
                  </View>
                </View>

                {/* ── Active Session / Reservation Widget ── */}
                {activeBooking && (
                  <View style={[styles.activeSessionCard, { backgroundColor: colors.backgroundElement, borderColor: colors.primary, borderWidth: 1 }]}>
                    <View style={styles.sessionHeader}>
                      <Text style={[styles.sessionTitle, { color: colors.text }]}>Active Parking Session</Text>
                      <View style={styles.sessionPulse} />
                    </View>
                    <View style={styles.sessionRow}>
                      <View style={styles.sessionDetails}>
                        <Text style={[styles.sessionHubName, { color: colors.text }]}>{activeBooking.locationName}</Text>
                        <Text style={[styles.sessionSlotText, { color: colors.textSecondary }]}>Slot {activeBooking.slotId} • Floor {activeBooking.floor}</Text>
                      </View>
                      <View style={styles.sessionTimer}>
                        <Text style={styles.sessionTimerLabel}>Time Remaining</Text>
                        <Text style={[styles.sessionTimerVal, activeBookingTimeLeft === 'EXPIRED' && { color: '#ff4b4b' }]}>{activeBookingTimeLeft}</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={[styles.sessionManageBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleNavigateToTab('/explore?tab=bookings')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.sessionManageBtnText}>Manage Booking</Text>
                    </TouchableOpacity>
                  </View>
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

                {/* Quick Pins */}
                <View style={styles.quickPinsRow}>
                  {[
                    { label: 'Work', query: 'Office' },
                    { label: 'Home', query: 'Nexus' }, // Nexus is a central hub in their database
                    { label: 'Airport', query: 'Airport' },
                    { label: 'Cyber Hub', query: 'Cyber' },
                  ].map((pin) => (
                    <TouchableOpacity
                      key={pin.label}
                      style={[styles.quickPinBtn, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}
                      onPress={() => {
                        setSearchQuery(pin.query);
                        setIsSearchFocused(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.quickPinText, { color: colors.text }]}>{pin.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* ── My Garage compliance status ── */}
                {isAuthenticated && primaryVehicle && (
                  <View style={[styles.garageContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
                    <View style={styles.garageHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Car size={16} color={colors.primary} />
                        <Text style={[styles.garageTitle, { color: colors.text }]}>{primaryVehicle.model}</Text>
                        <Text style={[styles.garagePlate, { color: colors.textSecondary }]}>{primaryVehicle.plate}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleNavigateToTab('/explore?tab=vehicles')}>
                        <Text style={[styles.garageLink, { color: colors.primary }]}>Manage</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.complianceRow}>
                      {/* FASTag capsule */}
                      <TouchableOpacity 
                        style={[
                          styles.complianceBadge, 
                          { 
                            backgroundColor: (user?.walletBalance ?? 0) < 150 ? 'rgba(255, 75, 75, 0.08)' : 'rgba(0, 204, 106, 0.08)',
                            borderColor: (user?.walletBalance ?? 0) < 150 ? 'rgba(255, 75, 75, 0.15)' : 'rgba(0, 204, 106, 0.15)'
                          }
                        ]}
                        onPress={() => handleNavigateToTab('/explore?tab=fastag')}
                        activeOpacity={0.8}
                      >
                        <Zap size={11} color={(user?.walletBalance ?? 0) < 150 ? '#ff4b4b' : '#00cc6a'} />
                        <Text style={[styles.complianceText, { color: (user?.walletBalance ?? 0) < 150 ? '#ff4b4b' : '#00cc6a' }]}>
                          FASTag: Rs. {user?.walletBalance ?? 0}
                        </Text>
                      </TouchableOpacity>

                      {/* Challans capsule (semi-mocked for high fidelity) */}
                      <TouchableOpacity 
                        style={[
                          styles.complianceBadge, 
                          { 
                            backgroundColor: (primaryVehicle.plate.charCodeAt(primaryVehicle.plate.length - 1) % 2 !== 0) ? 'rgba(255, 206, 0, 0.08)' : 'rgba(0, 204, 106, 0.08)',
                            borderColor: (primaryVehicle.plate.charCodeAt(primaryVehicle.plate.length - 1) % 2 !== 0) ? 'rgba(255, 206, 0, 0.15)' : 'rgba(0, 204, 106, 0.15)'
                          }
                        ]}
                        onPress={() => handleNavigateToTab('/explore?tab=bookings')}
                        activeOpacity={0.8}
                      >
                        <AlertTriangle size={11} color={(primaryVehicle.plate.charCodeAt(primaryVehicle.plate.length - 1) % 2 !== 0) ? '#ffce00' : '#00cc6a'} />
                        <Text style={[styles.complianceText, { color: (primaryVehicle.plate.charCodeAt(primaryVehicle.plate.length - 1) % 2 !== 0) ? '#ffce00' : '#00cc6a' }]}>
                          {(primaryVehicle.plate.charCodeAt(primaryVehicle.plate.length - 1) % 2 !== 0) ? '1 Challan' : '0 Challans'}
                        </Text>
                      </TouchableOpacity>

                      {/* PUC capsule */}
                      <TouchableOpacity 
                        style={[
                          styles.complianceBadge, 
                          { 
                            backgroundColor: (user?.documents?.length ?? 0) >= 2 ? 'rgba(0, 204, 106, 0.08)' : 'rgba(255, 107, 53, 0.08)',
                            borderColor: (user?.documents?.length ?? 0) >= 2 ? 'rgba(0, 204, 106, 0.15)' : 'rgba(255, 107, 53, 0.15)'
                          }
                        ]}
                        onPress={() => handleNavigateToTab('/explore?tab=documents')}
                        activeOpacity={0.8}
                      >
                        <ShieldCheck size={11} color={(user?.documents?.length ?? 0) >= 2 ? '#00cc6a' : '#ff6b35'} />
                        <Text style={[styles.complianceText, { color: (user?.documents?.length ?? 0) >= 2 ? '#00cc6a' : '#ff6b35' }]}>
                          {(user?.documents?.length ?? 0) >= 2 ? 'PUC Active' : 'PUC Missing'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Hero Section */}
                <View style={[styles.heroCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass, flexDirection: isMobile ? 'column' : 'row' }]}>
                  <View style={[styles.heroContent, { width: isMobile ? '100%' : '55%' }]}>
                    <Text style={[styles.heroHeading, { color: colors.text }]}>
                      {"Don't just drive."}{'\n'}
                      <Text style={{ color: colors.primary }}>Own your journey.</Text>
                    </Text>
                    <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>
                      Join 1M+ drivers saving time with real-time parking, automatic FASTag, and instant challan alerts.
                    </Text>
                    <TouchableOpacity
                      style={[styles.heroBtn, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        if (!isAuthenticated) {
                          setLoginRequiredVisible(true);
                        } else {
                          Alert.alert('Start Booking', 'Select a nearby parking hub from the list below to choose a slot!');
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.heroBtnText}>Start Booking</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                 {/* ── Our Services Capsule Grid ── */}
                 <View 
                   style={styles.servicesSection}
                   {...panResponder.panHandlers}
                 >
                   <View style={styles.servicesHeader}>
                     <Text style={[styles.servicesTitle, { color: colors.text }]}>Our Services</Text>
                     <TouchableOpacity 
                       onPress={() => toggleServices(!isServicesExpanded)}
                       style={styles.viewMoreBtn}
                     >
                       <Text style={[styles.viewMoreText, { color: colors.primary }]}>
                         {isServicesExpanded ? 'View Less' : 'View More'}
                       </Text>
                     </TouchableOpacity>
                   </View>
                   
                   <View style={styles.capsuleGrid}>
                     {[
                       { label: 'Parking',     sub: 'Secure spots',       icon: Car,          color: '#ffce00', route: '/parking-hubs' },
                       { label: 'Challan',     sub: 'Check & Pay',         icon: AlertTriangle, color: '#ff6b35', route: '/explore?tab=bookings' },
                       { label: 'FASTag',      sub: 'Recharge now',        icon: Zap,           color: '#00f2ff', route: '/explore?tab=fastag' },
                       { label: 'Documents',   sub: 'Secure Vault',        icon: FileText,      color: '#a78bfa', route: '/explore?tab=documents' },
                       { label: 'Pollution',   sub: 'Renewals',            icon: ShieldCheck,   color: '#34d399', route: '/explore' },
                       { label: 'Car Sale',    sub: 'Transfer',            icon: CarFront,      color: '#f472b6', route: '/explore' },
                       { label: 'Insurance',   sub: 'Shield & Protect',    icon: Shield,        color: '#fbbf24', route: '/explore' },
                       { label: 'EV Charging', sub: 'Power up',            icon: Zap,           color: '#10b981', route: '/explore' },
                       { label: 'Car Wash',    sub: 'Sparkle clean',       icon: Droplet,       color: '#60a5fa', route: '/explore' },
                       { label: 'Driver Hub',  sub: 'Expert drivers',      icon: User,          color: '#f87171', route: '/driver-hub' },
                       { label: 'Emergency',   sub: 'SOS Support',         icon: PhoneCall,     color: '#ef4444', route: '/explore' },
                       { label: 'Towing',      sub: 'Roadside Help',       icon: Truck,         color: '#f59e0b', route: '/explore' },
                     ]
                       .slice(0, isServicesExpanded ? 12 : 4)
                       .map((svc) => {
                         const IconComp = svc.icon;
                         const capsuleWidth = isMobile ? (width - 50) / 2 : 170;
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
                             onPress={() => {
                               if (svc.label === 'Parking') {
                                 setStep('PARKING_HUBS');
                               } else if (svc.label === 'Driver Hub') {
                                 setStep('DRIVER_HUB');
                               } else {
                                 handleNavigateToTab(svc.route);
                               }
                             }}
                             activeOpacity={0.8}
                           >
                             <View style={[styles.serviceIconCircle, { backgroundColor: `${svc.color}18` }]}>
                               <IconComp size={18} color={svc.color} />
                             </View>
                             <View style={{ flex: 1 }}>
                               <Text style={[styles.serviceCapsuleLabel, { color: colors.text }]} numberOfLines={1}>{svc.label}</Text>
                               <Text style={[styles.serviceCapsuleSub, { color: colors.textSecondary }]} numberOfLines={1}>{svc.sub}</Text>
                             </View>
                           </TouchableOpacity>
                         );
                       })}
                   </View>

                    {/* Drag Handle (Samsung One UI Style) */}
                    <View 
                      style={styles.dragHandleContainer}
                      {...dragHandlePanResponder.panHandlers}
                    >
                      <View style={[styles.dragHandle, { backgroundColor: colors.textSecondary }]} />
                    </View>
                 </View>

                {/* Map View */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setStep('PARKING_HUBS')}
                  style={styles.mapContainer}
                >
                  <RadarMap locations={locations} onSelectLocation={handleSelectLocation} />
                </TouchableOpacity>

                {/* Nearby Facility Listings */}
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Nearby Parking Hubs</Text>

                <FlatList
                  horizontal
                  data={processedLocations}
                  keyExtractor={(item) => item._id}
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={width - 28}
                  decelerationRate="fast"
                  style={{ marginHorizontal: -20 }}
                  contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
                  renderItem={({ item, index }) => (
                    <View style={{ width: width - 40, marginRight: 12 }}>
                      <LocationCard 
                        location={item} 
                        onSelect={handleSelectLocation} 
                        isNearest={userLocation !== null && index === 0}
                      />
                    </View>
                  )}
                />

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

      {/* Guest Login Alert Modal */}
      <LoginBottomSheet
        visible={loginRequiredVisible}
        onCancel={() => setLoginRequiredVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c10',
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
    color: '#a0aab2',
    fontSize: 14,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 22, 30, 0.75)',
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
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
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
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  heroContent: {
    gap: 8,
  },
  heroHeading: {
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  heroDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  heroBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  heroBtnText: {
    color: '#0b0c10',
    fontWeight: 'bold',
    fontSize: 13,
  },
  heroImageWrapper: {
    width: '45%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: 120,
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
});

