import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  X,
  MapPin,
  Navigation as NavigationIcon,
  Search,
  Compass,
  Car,
  Zap,
  Layers,
  ChevronRight,
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { parkingApi } from '../../api/parkingApi';
import { useBooking } from '../../store/BookingContext';
import { ParkingLocation } from '../../types';
import { launchMobileLiveGpsNavigation } from '../../services/navigation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Custom sleek dark mode map styling array identical to Drivix Website
export const DARK_GOOGLE_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0c0e17' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8d9b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0c0e17' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1f2438' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9b9ea8' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#111422' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#181d2f' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#7a7f92' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#122023' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1f33' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#111422' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#777c8e' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#252b45' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#141727' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#b8bac6' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#192033' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#090c14' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#48536e' }] },
];

// Baseline Network Locations matching Drivix Website dataset
export const DEFAULT_NETWORK_LOCATIONS: ParkingLocation[] = [
  {
    _id: 'noida-sec18',
    parkingName: 'Sector 18 Multi-Level Hub',
    address: 'Block K, Sector 18, Noida',
    city: 'Noida',
    latitude: 28.5708,
    longitude: 77.3261,
    totalSlots: 250,
    availableSlots: 84,
    hourlyPrice: 20,
    status: 'Active',
    amenities: ['EV Charging', 'ANPR Gate', 'Covered'],
  },
  {
    _id: 'noida-kp2',
    parkingName: 'Knowledge Park II Metro Hub',
    address: 'Greater Noida Express Highway',
    city: 'Greater Noida',
    latitude: 28.4595,
    longitude: 77.5020,
    totalSlots: 180,
    availableSlots: 62,
    hourlyPrice: 15,
    status: 'Active',
    amenities: ['EV Charging', 'Metro Connect'],
  },
  {
    _id: 'noida-sec62',
    parkingName: 'Sector 62 IT Park Facility',
    address: 'Phase 2, Sector 62, Noida',
    city: 'Noida',
    latitude: 28.6280,
    longitude: 77.3649,
    totalSlots: 300,
    availableSlots: 112,
    hourlyPrice: 25,
    status: 'Active',
    amenities: ['EV Charging', 'ANPR Camera'],
  },
  {
    _id: 'noida-botanical',
    parkingName: 'Botanical Garden Interchange Hub',
    address: 'Sector 38, Noida',
    city: 'Noida',
    latitude: 28.5642,
    longitude: 77.3343,
    totalSlots: 400,
    availableSlots: 145,
    hourlyPrice: 20,
    status: 'Active',
    amenities: ['Metro Interchange', '24/7 Security'],
  },
  {
    _id: 'noida-pari-chowk',
    parkingName: 'Pari Chowk Commercial Complex',
    address: 'Commercial Belt, Pari Chowk',
    city: 'Greater Noida',
    latitude: 28.4673,
    longitude: 77.5140,
    totalSlots: 220,
    availableSlots: 40,
    hourlyPrice: 15,
    status: 'Active',
    amenities: ['EV Charging', 'Valet Available'],
  },
  {
    _id: 'delhi-cp',
    parkingName: 'Connaught Place Outer Ring Hub',
    address: 'Block C, Connaught Place',
    city: 'Delhi',
    latitude: 28.6315,
    longitude: 77.2167,
    totalSlots: 350,
    availableSlots: 58,
    hourlyPrice: 40,
    status: 'Active',
    amenities: ['EV Charging', 'Multi-Level', 'CCTV'],
  },
  {
    _id: 'delhi-south-ext',
    parkingName: 'South Extension Plaza Facility',
    address: 'Ring Road, South Ext I',
    city: 'Delhi',
    latitude: 28.5684,
    longitude: 77.2215,
    totalSlots: 160,
    availableSlots: 29,
    hourlyPrice: 30,
    status: 'Active',
    amenities: ['Valet Service', 'Underground'],
  },
  {
    _id: 'noida-sec137',
    parkingName: 'Sector 137 Expressway Hub',
    address: 'Felix Hospital Rd, Sector 137',
    city: 'Noida',
    latitude: 28.5034,
    longitude: 77.4042,
    totalSlots: 190,
    availableSlots: 77,
    hourlyPrice: 20,
    status: 'Active',
    amenities: ['EV Charging', 'Hospital Adjacent'],
  },
  {
    _id: 'noida-sec142',
    parkingName: 'Advant Navis Corporate Hub',
    address: 'Sector 142, Noida Expressway',
    city: 'Noida',
    latitude: 28.4981,
    longitude: 77.4105,
    totalSlots: 450,
    availableSlots: 198,
    hourlyPrice: 25,
    status: 'Active',
    amenities: ['EV Fast Charging', 'ANPR Gate', 'Corporate'],
  },
  {
    _id: 'delhi-nehru-place',
    parkingName: 'Nehru Place Tech Hub Parking',
    address: 'Nehru Place Commercial Complex',
    city: 'Delhi',
    latitude: 28.5492,
    longitude: 77.2519,
    totalSlots: 280,
    availableSlots: 65,
    hourlyPrice: 30,
    status: 'Active',
    amenities: ['EV Charging', 'Metro Connect'],
  },
  {
    _id: 'noida-sec50',
    parkingName: 'Sector 50 Market Square',
    address: 'Main Market Rd, Sector 50',
    city: 'Noida',
    latitude: 28.5770,
    longitude: 77.3630,
    totalSlots: 120,
    availableSlots: 31,
    hourlyPrice: 20,
    status: 'Active',
    amenities: ['Market Square', 'Fast Checkout'],
  },
  {
    _id: 'gr-noida-west',
    parkingName: 'Gaur City Mall Parking Hub',
    address: 'Greater Noida West Rd',
    city: 'Greater Noida',
    latitude: 28.6087,
    longitude: 77.4285,
    totalSlots: 500,
    availableSlots: 210,
    hourlyPrice: 20,
    status: 'Active',
    amenities: ['EV Charging', 'Mall Parking', 'Covered'],
  },
];

const DEFAULT_REGION: Region = {
  latitude: 28.5400,
  longitude: 77.3800,
  latitudeDelta: 0.28,
  longitudeDelta: 0.28,
};

export interface NetworkMapModalProps {
  visible: boolean;
  onClose: () => void;
  onProceedToBooking: (hub: ParkingLocation) => void;
}

export const NetworkMapModal: React.FC<NetworkMapModalProps> = ({
  visible,
  onClose,
  onProceedToBooking,
}) => {
  const { selectHub } = useBooking();
  const mapRef = useRef<MapView>(null);

  const [locations, setLocations] = useState<ParkingLocation[]>(DEFAULT_NETWORK_LOCATIONS);
  const [selectedCity, setSelectedCity] = useState<'ALL' | 'Noida' | 'Greater Noida' | 'Delhi'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<ParkingLocation | null>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isListDrawerOpen, setIsListDrawerOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch live locations from backend and merge with network defaults
  useEffect(() => {
    if (!visible) return;

    const fetchLocations = async () => {
      setLoading(true);
      try {
        const liveHubs = await parkingApi.getLocations();
        if (Array.isArray(liveHubs) && liveHubs.length > 0) {
          const validLive = liveHubs
            .filter((h) => h.latitude && h.longitude)
            .map((h, idx) => ({
              ...h,
              _id: h._id || `live-${idx}`,
              parkingName: h.parkingName || 'Drivix Smart Hub',
              city: h.city || 'Noida',
              hourlyPrice: h.hourlyPrice || 20,
              totalSlots: h.totalSlots || 100,
              availableSlots: h.availableSlots ?? 50,
            }));

          // Merge without duplicate names
          const merged = [...validLive];
          DEFAULT_NETWORK_LOCATIONS.forEach((defLoc) => {
            if (!merged.some((m) => m.parkingName.toLowerCase() === defLoc.parkingName.toLowerCase())) {
              merged.push(defLoc);
            }
          });
          setLocations(merged);
        }
      } catch (err) {
        console.warn('NetworkMapModal: Fallback to default network locations dataset:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();

    // Request GPS permission and coordinates
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (loc?.coords) {
            setUserCoords({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        }
      } catch (e) {
        console.warn('NetworkMapModal location permission error:', e);
      }
    })();
  }, [visible]);

  // Filter locations by city and search query
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const city = loc.city || '';
      const matchesCity =
        selectedCity === 'ALL' || city.toLowerCase() === selectedCity.toLowerCase();

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        loc.parkingName.toLowerCase().includes(q) ||
        loc.address.toLowerCase().includes(q) ||
        city.toLowerCase().includes(q);

      return matchesCity && matchesSearch;
    });
  }, [locations, selectedCity, searchQuery]);

  // Distance calculator helper
  const calculateDistance = (lat: number, lon: number): string | null => {
    if (!userCoords || !lat || !lon) return null;
    const R = 6371; // Earth radius in km
    const dLat = ((lat - userCoords.latitude) * Math.PI) / 180;
    const dLon = ((lon - userCoords.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userCoords.latitude * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const handleSelectLocation = (loc: ParkingLocation) => {
    setSelectedLocation(loc);
    setIsListDrawerOpen(false);

    if (mapRef.current && loc.latitude && loc.longitude) {
      mapRef.current.animateToRegion(
        {
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        600
      );
    }
  };

  const handleLocateMe = async () => {
    try {
      let coords = userCoords;
      if (!coords) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setUserCoords(coords);
        }
      }

      if (coords && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          },
          600
        );
      }
    } catch (e) {
      Alert.alert('Location Error', 'Unable to retrieve current GPS location.');
    }
  };

  const handleBookParkingFromMap = (hub: ParkingLocation) => {
    // Save to context
    selectHub(hub);
    // Close modal
    onClose();
    // Smoothly transition to booking workflow
    onProceedToBooking(hub);
  };

  const handleLaunchDirections = (hub: ParkingLocation) => {
    launchMobileLiveGpsNavigation({
      latitude: hub.latitude,
      longitude: hub.longitude,
      locationName: hub.parkingName,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* ─── Top Header & Controls ─── */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.brandRow}>
              <View style={styles.brandIconBox}>
                <MapPin size={20} color="#171717" />
              </View>
              <View>
                <Text style={styles.brandTitle}>Drivix Network Map</Text>
                <Text style={styles.brandSubtitle}>Real-time Smart Parking Hubs</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Search Input Bar */}
          <View style={styles.searchBar}>
            <Search size={16} color="#8a8d9b" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search hubs, cities, landmarks..."
              placeholderTextColor="#8a8d9b"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#8a8d9b" />
              </TouchableOpacity>
            )}
          </View>

          {/* City Filter Tabs Row */}
          <View style={styles.cityTabsRow}>
            {(['ALL', 'Noida', 'Greater Noida', 'Delhi'] as const).map((city) => {
              const isSelected = selectedCity === city;
              return (
                <TouchableOpacity
                  key={city}
                  style={[styles.cityTab, isSelected && styles.cityTabSelected]}
                  onPress={() => setSelectedCity(city)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cityTabText, isSelected && styles.cityTabTextSelected]}>
                    {city}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── Map Viewport ─── */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={DEFAULT_REGION}
            customMapStyle={DARK_GOOGLE_MAP_STYLES}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={false}
          >
            {filteredLocations.map((loc) => {
              const isSelected = selectedLocation?._id === loc._id;
              const isAvailable = (loc.availableSlots ?? 0) > 0;
              const pinColor = !isAvailable ? '#DC2626' : (loc.availableSlots ?? 0) < 20 ? '#F59E0B' : '#FFC928';

              return (
                <Marker
                  key={loc._id}
                  coordinate={{
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                  }}
                  title={loc.parkingName}
                  description={`${loc.availableSlots} slots free • ₹${loc.hourlyPrice}/hr`}
                  onPress={() => handleSelectLocation(loc)}
                >
                  <View style={[styles.customPin, isSelected && styles.customPinSelected, { borderColor: pinColor }]}>
                    <View style={[styles.pinDot, { backgroundColor: pinColor }]} />
                    {isSelected && (
                      <Text style={styles.pinLabel} numberOfLines={1}>
                        ₹{loc.hourlyPrice}
                      </Text>
                    )}
                  </View>
                </Marker>
              );
            })}
          </MapView>

          {/* Top Floating Control Bar */}
          <View style={styles.floatingControls}>
            <TouchableOpacity
              style={styles.floatingBtn}
              onPress={() => setIsListDrawerOpen(!isListDrawerOpen)}
              activeOpacity={0.85}
            >
              <SlidersHorizontal size={15} color="#171717" style={{ marginRight: 6 }} />
              <Text style={styles.floatingBtnText}>
                {isListDrawerOpen ? 'Hide List' : `Sites (${filteredLocations.length})`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.locateBtn} onPress={handleLocateMe} activeOpacity={0.85}>
              <Compass size={18} color="#FFC928" />
            </TouchableOpacity>
          </View>

          {/* Collapsible Sites List Overlay Drawer */}
          {isListDrawerOpen && (
            <View style={styles.drawerOverlay}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>
                  Nearby Parking Facilities ({filteredLocations.length})
                </Text>
                <TouchableOpacity onPress={() => setIsListDrawerOpen(false)} style={styles.drawerClose}>
                  <Text style={styles.drawerCloseText}>✕ Close</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={filteredLocations}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.drawerList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const dist = calculateDistance(item.latitude, item.longitude);
                  const isSelected = selectedLocation?._id === item._id;
                  const isAvailable = (item.availableSlots ?? 0) > 0;

                  return (
                    <TouchableOpacity
                      style={[styles.drawerItem, isSelected && styles.drawerItemSelected]}
                      onPress={() => handleSelectLocation(item)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.drawerItemHeader}>
                        <Text style={styles.drawerItemName} numberOfLines={1}>
                          {item.parkingName}
                        </Text>
                        {dist && <Text style={styles.drawerDistance}>{dist} km</Text>}
                      </View>

                      <Text style={styles.drawerItemAddress} numberOfLines={1}>
                        {item.address}
                      </Text>

                      <View style={styles.drawerItemFooter}>
                        <View
                          style={[
                            styles.slotPill,
                            { backgroundColor: isAvailable ? 'rgba(22, 163, 74, 0.15)' : 'rgba(220, 38, 38, 0.15)' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.slotPillText,
                              { color: isAvailable ? '#16A34A' : '#DC2626' },
                            ]}
                          >
                            {isAvailable ? `${item.availableSlots} free` : 'Full'}
                          </Text>
                        </View>

                        <Text style={styles.drawerPrice}>₹{item.hourlyPrice}/hr</Text>

                        <TouchableOpacity
                          style={styles.drawerBookBtn}
                          onPress={() => handleBookParkingFromMap(item)}
                        >
                          <Text style={styles.drawerBookBtnText}>Book</Text>
                          <ChevronRight size={12} color="#171717" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}

          {/* ─── Selected Hub Floating Bottom Card ─── */}
          {selectedLocation && !isListDrawerOpen && (
            <View style={styles.selectedCard}>
              <View style={styles.selectedCardHeader}>
                <View style={styles.selectedBadge}>
                  <ShieldCheck size={12} color="#171717" style={{ marginRight: 4 }} />
                  <Text style={styles.selectedBadgeText}>DRIVIX VERIFIED HUB</Text>
                </View>

                <TouchableOpacity onPress={() => setSelectedLocation(null)} style={styles.cardCloseBtn}>
                  <X size={16} color="#8a8d9b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.selectedName} numberOfLines={1}>
                {selectedLocation.parkingName}
              </Text>
              <Text style={styles.selectedAddress} numberOfLines={1}>
                {selectedLocation.address}
              </Text>

              {/* Status & Pricing Info */}
              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.availBadge,
                    {
                      backgroundColor:
                        (selectedLocation.availableSlots ?? 0) > 0
                          ? 'rgba(22, 163, 74, 0.15)'
                          : 'rgba(220, 38, 38, 0.15)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.availBadgeText,
                      {
                        color:
                          (selectedLocation.availableSlots ?? 0) > 0 ? '#16A34A' : '#DC2626',
                      },
                    ]}
                  >
                    {(selectedLocation.availableSlots ?? 0) > 0
                      ? `${selectedLocation.availableSlots} of ${selectedLocation.totalSlots} slots free`
                      : 'Facility Full'}
                  </Text>
                </View>

                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>₹{selectedLocation.hourlyPrice}/hr</Text>
                </View>

                {calculateDistance(selectedLocation.latitude, selectedLocation.longitude) && (
                  <View style={styles.distBadge}>
                    <Text style={styles.distBadgeText}>
                      {calculateDistance(selectedLocation.latitude, selectedLocation.longitude)} km away
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons: Book Spot & Directions */}
              <View style={styles.cardActionRow}>
                <TouchableOpacity
                  style={styles.directionsBtn}
                  onPress={() => handleLaunchDirections(selectedLocation)}
                  activeOpacity={0.85}
                >
                  <NavigationIcon size={16} color="#FFFFFF" />
                  <Text style={styles.directionsBtnText}>Directions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bookNowBtn}
                  onPress={() => handleBookParkingFromMap(selectedLocation)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.bookNowBtnText}>Book Parking Spot</Text>
                  <ArrowRight size={16} color="#171717" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0e17',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#0f121e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#8a8d9b',
    fontWeight: '600',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 0,
  },
  cityTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cityTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cityTabSelected: {
    backgroundColor: Colors.primaryYellow,
    borderColor: Colors.primaryYellow,
  },
  cityTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8a8d9b',
  },
  cityTabTextSelected: {
    color: '#171717',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  floatingControls: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryYellow,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  floatingBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171717',
  },
  locateBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0f121e',
    borderWidth: 1.5,
    borderColor: Colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  customPin: {
    backgroundColor: '#0c0e17',
    borderWidth: 2,
    borderRadius: 16,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  customPinSelected: {
    transform: [{ scale: 1.15 }],
    backgroundColor: '#1f2438',
  },
  pinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pinLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: 'rgba(12, 14, 23, 0.98)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 20,
    padding: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  drawerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8a8d9b',
    textTransform: 'uppercase',
  },
  drawerClose: {
    padding: 4,
  },
  drawerCloseText: {
    color: '#FFC928',
    fontSize: 12,
    fontWeight: '700',
  },
  drawerList: {
    paddingBottom: 20,
    gap: 10,
  },
  drawerItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
  },
  drawerItemSelected: {
    borderColor: Colors.primaryYellow,
    backgroundColor: 'rgba(255, 201, 40, 0.08)',
  },
  drawerItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  drawerItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 6,
  },
  drawerDistance: {
    fontSize: 11,
    color: '#60a5fa',
    fontWeight: '700',
  },
  drawerItemAddress: {
    fontSize: 11,
    color: '#8a8d9b',
    marginBottom: 8,
  },
  drawerItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  slotPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  drawerPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryYellow,
  },
  drawerBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryYellow,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  drawerBookBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171717',
    marginRight: 2,
  },
  selectedCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 18, 30, 0.96)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 201, 40, 0.4)',
    borderRadius: 20,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    zIndex: 15,
  },
  selectedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryYellow,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  selectedBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: 0.5,
  },
  cardCloseBtn: {
    padding: 4,
  },
  selectedName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  selectedAddress: {
    fontSize: 12,
    color: '#8a8d9b',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  availBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  availBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  priceBadge: {
    backgroundColor: 'rgba(255, 201, 40, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 40, 0.3)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  priceBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryYellow,
  },
  distBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  distBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60a5fa',
  },
  cardActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  directionsBtn: {
    flex: 0.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2438',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  directionsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bookNowBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryYellow,
    borderRadius: 12,
    paddingVertical: 12,
  },
  bookNowBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#171717',
  },
});
