import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Zap,
  ArrowUpDown,
  Shield,
  Layers,
  ChevronRight,
  AlertTriangle,
  Navigation,
  Car,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { Card, Button, Badge, Input, EmptyState, NetworkMapModal } from '../../components/common';
import { parkingApi } from '../../api/parkingApi';
import { useBooking } from '../../store/BookingContext';
import { ParkingLocation } from '../../types';
import { launchMobileLiveGpsNavigation } from '../../services/navigation';
import { checkIsOnlineBookingAllowed } from '../../services/bookingEligibility';

export interface ParkingDiscoveryScreenProps {
  onSelectHub: (hub: ParkingLocation) => void;
  onBack?: () => void;
}

type SortOption = 'relevance' | 'price_low' | 'availability_high';

export const ParkingDiscoveryScreen: React.FC<ParkingDiscoveryScreenProps> = ({
  onSelectHub,
  onBack,
}) => {
  const { selectHub } = useBooking();
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'ev' | 'available' | 'budget'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getLastKnownPositionAsync();
          if (isMounted && pos?.coords) {
            setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          }
        }
      } catch {
        // safe fallback
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const getDistanceText = (loc: ParkingLocation): string => {
    if (loc.distanceKm) return `${loc.distanceKm} km`;
    if (!userCoords || !loc.latitude || !loc.longitude) {
      const name = (loc.parkingName || '').toLowerCase();
      if (name.includes('knowledge park')) return '3.3 km';
      return '2.5 km';
    }
    const R = 6371;
    const lat1 = (userCoords.latitude * Math.PI) / 180;
    const lat2 = (loc.latitude * Math.PI) / 180;
    const dLat = ((loc.latitude - userCoords.latitude) * Math.PI) / 180;
    const dLon = ((loc.longitude - userCoords.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return `${(R * c).toFixed(1)} km`;
  };

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const data = await parkingApi.getLocations();
      setLocations(data);
    } catch (err) {
      console.warn('[ParkingDiscoveryScreen] Error fetching locations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLocations();
  };

  // Filter & Sort Logic
  const filteredAndSortedLocations = React.useMemo(() => {
    let result = [...locations];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.parkingName.toLowerCase().includes(q) ||
          l.address.toLowerCase().includes(q) ||
          (l.city && l.city.toLowerCase().includes(q))
      );
    }

    // Filter chip
    if (selectedFilter === 'ev') {
      result = result.filter((l) => l.amenities && l.amenities.includes('EV Charging'));
    } else if (selectedFilter === 'available') {
      result = result.filter((l) => l.availableSlots > 0 && checkIsOnlineBookingAllowed(l));
    } else if (selectedFilter === 'budget') {
      result = result.filter((l) => l.hourlyPrice <= 60);
    }

    // Sort
    if (sortOption === 'price_low') {
      result.sort((a, b) => a.hourlyPrice - b.hourlyPrice);
    } else if (sortOption === 'availability_high') {
      result.sort((a, b) => b.availableSlots - a.availableSlots);
    }

    return result;
  }, [locations, searchQuery, selectedFilter, sortOption]);

  const toggleSort = () => {
    if (sortOption === 'relevance') setSortOption('price_low');
    else if (sortOption === 'price_low') setSortOption('availability_high');
    else setSortOption('relevance');
  };

  const getSortLabel = () => {
    if (sortOption === 'price_low') return 'Price: Low to High';
    if (sortOption === 'availability_high') return 'Most Available';
    return 'Default Sort';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Find Parking Hubs</Text>
            <Text style={styles.headerSubtitle}>
              Real-time occupancy & multi-floor reservations
            </Text>
          </View>
          <TouchableOpacity
            style={styles.mapToggleBtn}
            onPress={() => setIsMapModalVisible(true)}
            activeOpacity={0.85}
          >
            <MapPin size={15} color="#171717" style={{ marginRight: 4 }} />
            <Text style={styles.mapToggleBtnText}>Map</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <Input
          placeholder="Search by hub name, locality, or landmark..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color={Colors.textSecondary} />}
          containerStyle={styles.searchContainer}
        />

        {/* Filter Chips Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'all' && styles.filterChipTextActive]}>
              All Hubs ({locations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'available' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('available')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'available' && styles.filterChipTextActive]}>
              Slots Available
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'ev' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('ev')}
          >
            <Zap size={14} color={selectedFilter === 'ev' ? '#171717' : Colors.textSecondary} />
            <Text style={[styles.filterChipText, selectedFilter === 'ev' && styles.filterChipTextActive]}>
              EV Charging
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'budget' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('budget')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'budget' && styles.filterChipTextActive]}>
              Under ₹60/hr
            </Text>
          </TouchableOpacity>

          {/* Sort toggle */}
          <TouchableOpacity style={styles.sortButton} onPress={toggleSort}>
            <ArrowUpDown size={14} color={Colors.textPrimary} />
            <Text style={styles.sortButtonText}>{getSortLabel()}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Locations List */}
      <FlatList
        data={filteredAndSortedLocations}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primaryYellow]}
            tintColor={Colors.primaryYellow}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="No Parking Hubs Found"
              description="No facilities match your search query or filter. Try clearing filters."
              actionTitle="Reset Filters"
              onAction={() => {
                setSearchQuery('');
                setSelectedFilter('all');
                setSortOption('relevance');
              }}
            />
          ) : null
        }
        renderItem={({ item }) => {
          const isOnline = checkIsOnlineBookingAllowed(item);
          const distText = getDistanceText(item);
          const rawAmenities = item.amenities || [];
          const cleanAmenities = rawAmenities.filter(
            (a) => typeof a === 'string' && !a.toLowerCase().includes('offline')
          );
          const displayAmenities =
            cleanAmenities.length > 0
              ? cleanAmenities.slice(0, 3)
              : ['CCTV', 'Covered'];

          // ─── OFFLINE / ON-SITE ONLY CARD (Reference from screenshot) ───
          if (!isOnline) {
            return (
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => {
                  launchMobileLiveGpsNavigation({
                    latitude: item.latitude,
                    longitude: item.longitude,
                    locationName: item.parkingName,
                  });
                }}
                style={[styles.locationCardDark, styles.locationCardNoBooking]}
              >
                {/* Header Row: Car Icon, Title & Address, Badge & Distance */}
                <View style={styles.cardHeaderRowDark}>
                  <View style={styles.carIconBox}>
                    <Car size={20} color="#9CA3AF" />
                  </View>

                  <View style={styles.cardTitleCol}>
                    <Text style={styles.hubTitleDark} numberOfLines={1}>
                      {item.parkingName}
                    </Text>
                    <View style={styles.addressRowDark}>
                      <MapPin size={13} color="#9CA3AF" />
                      <Text style={styles.addressTextDark} numberOfLines={1}>
                        {item.address}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.headerRightCol}>
                    <View style={styles.noBookingBadge}>
                      <AlertTriangle size={11} color="#FFAD00" style={{ marginRight: 3 }} />
                      <Text style={styles.noBookingBadgeText}>NOT ONLINE BOOKING</Text>
                    </View>
                    <Text style={styles.distanceText}>{distText}</Text>
                  </View>
                </View>

                {/* NOT ONLINE BOOKING BANNER */}
                <View style={styles.noBookingBanner}>
                  <AlertTriangle size={14} color="#FFAD00" style={{ marginRight: 6, flexShrink: 0 }} />
                  <Text style={styles.noBookingBannerText}>
                    <Text style={styles.noBookingBannerBold}>NOT ONLINE BOOKING: </Text>
                    On-site entry only. Use Navigate for GPS directions.
                  </Text>
                </View>

                {/* Availability Row */}
                <View style={styles.availabilityRow}>
                  <Text style={styles.availabilityLabel}>Availability</Text>
                  <Text style={styles.availabilityValueNoBooking}>0/0 slots</Text>
                </View>

                {/* Bottom Row: Features & Action */}
                <View style={styles.cardFooterDark}>
                  <View style={styles.featuresRow}>
                    {displayAmenities.map((feat, idx) => (
                      <View key={idx} style={styles.featurePillDark}>
                        <Text style={styles.featurePillTextDark}>{feat}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.navigateBtn}
                    onPress={() => {
                      launchMobileLiveGpsNavigation({
                        latitude: item.latitude,
                        longitude: item.longitude,
                        locationName: item.parkingName,
                      });
                    }}
                    activeOpacity={0.85}
                  >
                    <Navigation size={13} color="#000000" fill="#000000" style={{ marginRight: 4 }} />
                    <Text style={styles.navigateBtnText}>Navigate</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }

          // ─── ONLINE BOOKING ALLOWED CARD (Let user book smoothly) ───
          return (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => {
                selectHub(item);
                onSelectHub(item);
              }}
              style={styles.locationCardDark}
            >
              <View style={styles.cardHeaderRowDark}>
                <View
                  style={[
                    styles.carIconBox,
                    {
                      backgroundColor: 'rgba(255, 201, 40, 0.12)',
                      borderColor: 'rgba(255, 201, 40, 0.35)',
                    },
                  ]}
                >
                  <Car size={20} color={Colors.primaryYellow} />
                </View>

                <View style={styles.cardTitleCol}>
                  <Text style={styles.hubTitleDark} numberOfLines={1}>
                    {item.parkingName}
                  </Text>
                  <View style={styles.addressRowDark}>
                    <MapPin size={13} color="#9CA3AF" />
                    <Text style={styles.addressTextDark} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                </View>

                <View style={styles.headerRightCol}>
                  <View style={styles.onlineBadge}>
                    <Text style={styles.onlineBadgeText}>AVAILABLE</Text>
                  </View>
                  <Text style={styles.distanceTextOnline}>{distText}</Text>
                </View>
              </View>

              {/* Availability & Rate Row */}
              <View style={styles.availabilityRow}>
                <Text style={styles.availabilityLabel}>Availability</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={styles.availabilityValueOnline}>
                    {item.availableSlots}/{item.totalSlots} slots
                  </Text>
                  <Text style={styles.priceTag}>₹{item.hourlyPrice}/hr</Text>
                </View>
              </View>

              {/* Bottom Row: Features & Actions */}
              <View style={styles.cardFooterDark}>
                <View style={styles.featuresRow}>
                  {displayAmenities.map((feat, idx) => (
                    <View key={idx} style={styles.featurePillDark}>
                      <Text style={styles.featurePillTextDark}>{feat}</Text>
                    </View>
                  ))}
                  {item.totalFloors ? (
                    <View style={styles.featurePillDark}>
                      <Text style={styles.featurePillTextDark}>{item.totalFloors} Floors</Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    style={styles.secondaryNavBtn}
                    onPress={() => {
                      launchMobileLiveGpsNavigation({
                        latitude: item.latitude,
                        longitude: item.longitude,
                        locationName: item.parkingName,
                      });
                    }}
                    activeOpacity={0.85}
                  >
                    <Navigation size={12} color="#FFFFFF" fill="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.bookSpotBtn}
                    onPress={() => {
                      selectHub(item);
                      onSelectHub(item);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.bookSpotBtnText}>Book Spot</Text>
                    <ChevronRight size={14} color="#000000" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* ─── Interactive Drivix Network Map Modal ─── */}
      <NetworkMapModal
        visible={isMapModalVisible}
        onClose={() => setIsMapModalVisible(false)}
        onProceedToBooking={onSelectHub}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0D14',
  },
  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: '#0F131D',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitleWrap: {
    flex: 1,
  },
  mapToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryYellow,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
  },
  mapToggleBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171717',
  },
  headerTitle: {
    ...Typography.h2,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    ...Typography.subtitle,
    color: '#9CA3AF',
    marginBottom: Spacing.md,
  },
  searchContainer: {
    marginBottom: Spacing.sm,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: Spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChipActive: {
    backgroundColor: Colors.primaryYellow,
    borderColor: Colors.primaryYellow,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  filterChipTextActive: {
    color: '#171717',
    fontWeight: '800',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 90,
  },

  /* ── Dark Sleek Card Layout (Matching Screenshot Reference) ── */
  locationCardDark: {
    backgroundColor: '#10141D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  locationCardNoBooking: {
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  cardHeaderRowDark: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  carIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  cardTitleCol: {
    flex: 1,
    marginRight: 8,
  },
  hubTitleDark: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 21,
    marginBottom: 3,
  },
  addressRowDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressTextDark: {
    fontSize: 12.5,
    color: '#9CA3AF',
    flex: 1,
  },
  headerRightCol: {
    alignItems: 'flex-end',
  },
  noBookingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  noBookingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFAD00',
    letterSpacing: 0.5,
  },
  onlineBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.45)',
  },
  onlineBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#22C55E',
    letterSpacing: 0.5,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFAD00',
    marginTop: 4,
  },
  distanceTextOnline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFC928',
    marginTop: 4,
  },

  /* Amber Alert Banner */
  noBookingBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noBookingBannerText: {
    fontSize: 12,
    color: '#FFAD00',
    flex: 1,
    lineHeight: 16,
  },
  noBookingBannerBold: {
    fontWeight: '800',
    color: '#FFAD00',
  },

  /* Availability Row */
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 2,
  },
  availabilityLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  availabilityValueNoBooking: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFAD00',
  },
  availabilityValueOnline: {
    fontSize: 13,
    fontWeight: '800',
    color: '#22C55E',
  },
  priceTag: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryYellow,
    backgroundColor: 'rgba(255, 201, 40, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },

  /* Footer & Action Buttons */
  cardFooterDark: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  featurePillDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  featurePillTextDark: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  navigateBtn: {
    backgroundColor: '#FFC928',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigateBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 13,
  },
  bookSpotBtn: {
    backgroundColor: '#FFC928',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bookSpotBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 13,
  },
  secondaryNavBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

