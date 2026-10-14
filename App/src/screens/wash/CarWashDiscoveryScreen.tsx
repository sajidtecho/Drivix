import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  MapPin,
  Phone,
  Star,
  Clock,
  Sparkles,
  Navigation,
  CheckCircle2,
  Car,
  Bike,
  Truck,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { Input, EmptyState } from '../../components/common';
import { washApi } from '../../api/washApi';
import { CarWashCenter } from '../../types';
import { launchMobileLiveGpsNavigation } from '../../services/navigation';
import { getUserLiveLocation, UserCoordinates } from '../../services/locationService';

export interface CarWashDiscoveryScreenProps {
  onBack: () => void;
  onBookWash?: (center: CarWashCenter) => void;
}

type VehicleFilterType = 'all' | 'car' | 'bike' | 'bus_truck';

export const CarWashDiscoveryScreen: React.FC<CarWashDiscoveryScreenProps> = ({
  onBack,
  onBookWash,
}) => {
  const [centers, setCenters] = useState<CarWashCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleFilterType>('all');
  const [selectedCity, setSelectedCity] = useState<'all' | 'Noida' | 'Greater Noida' | 'Gurgaon' | 'Delhi'>('all');
  const [userCoords, setUserCoords] = useState<UserCoordinates | null>(null);

  const fetchCenters = async () => {
    setLoading(true);
    try {
      getUserLiveLocation()
        .then((coords) => {
          if (coords) setUserCoords(coords);
        })
        .catch(() => {});

      const data = await washApi.getWashCenters({
        vehicleType: selectedVehicle,
        city: selectedCity,
        search: searchQuery,
      });
      setCenters(data);
    } catch (e) {
      console.warn('Error fetching wash centers:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCenters();
  }, [selectedVehicle, selectedCity]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCenters();
  };

  // Filtered by Search input
  const displayedCenters = useMemo(() => {
    if (!searchQuery.trim()) return centers;
    const q = searchQuery.toLowerCase();
    return centers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.locality.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  }, [centers, searchQuery]);

  const handleBookNow = (center: CarWashCenter) => {
    const rate =
      selectedVehicle === 'bike'
        ? center.pricing.bike
        : selectedVehicle === 'bus_truck'
        ? center.pricing.bus_truck
        : center.pricing.car;

    const label =
      selectedVehicle === 'bike'
        ? 'Bike Wash'
        : selectedVehicle === 'bus_truck'
        ? 'Heavy Bus/Truck Wash'
        : 'Car Spa & Wash';

    Alert.alert(
      `Book ${label}`,
      `Confirm wash slot at "${center.name}"?\nEstimated Price: ₹${rate}\nLocation: ${center.address}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Slot',
          onPress: () => {
            if (onBookWash) onBookWash(center);
            Alert.alert(
              'Wash Slot Confirmed! ✓',
              `Your bay is reserved at ${center.name}. You can drive in directly or use GPS navigation.`
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ─── 1. Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>In-Bay Wash & Car Spa</Text>
          <Text style={styles.headerSubtitle}>
            Verified wash centres & studios across Delhi NCR
          </Text>
        </View>
      </View>

      {/* ─── 2. Search & Filter Bar ─── */}
      <View style={styles.filterSection}>
        <Input
          placeholder="Search by center name, sector, or landmark..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color={Colors.textSecondary} />}
          containerStyle={styles.searchContainer}
        />

        {/* ─── Vehicle Type Filter (Bike, Car, Bus/Truck) ─── */}
        <View style={styles.vehicleFilterRow}>
          <TouchableOpacity
            style={[styles.vehicleTab, selectedVehicle === 'all' && styles.vehicleTabActive]}
            onPress={() => setSelectedVehicle('all')}
            activeOpacity={0.85}
          >
            <Sparkles size={14} color={selectedVehicle === 'all' ? '#171717' : '#9CA3AF'} />
            <Text style={[styles.vehicleTabText, selectedVehicle === 'all' && styles.vehicleTabTextActive]}>
              All ({centers.length})
            </Text>
          </TouchableOpacity>

          {/* Bike */}
          <TouchableOpacity
            style={[styles.vehicleTab, selectedVehicle === 'bike' && styles.vehicleTabActive]}
            onPress={() => setSelectedVehicle('bike')}
            activeOpacity={0.85}
          >
            <Bike size={15} color={selectedVehicle === 'bike' ? '#171717' : '#9CA3AF'} />
            <Text style={[styles.vehicleTabText, selectedVehicle === 'bike' && styles.vehicleTabTextActive]}>
              Bike
            </Text>
          </TouchableOpacity>

          {/* Car */}
          <TouchableOpacity
            style={[styles.vehicleTab, selectedVehicle === 'car' && styles.vehicleTabActive]}
            onPress={() => setSelectedVehicle('car')}
            activeOpacity={0.85}
          >
            <Car size={15} color={selectedVehicle === 'car' ? '#171717' : '#9CA3AF'} />
            <Text style={[styles.vehicleTabText, selectedVehicle === 'car' && styles.vehicleTabTextActive]}>
              Car
            </Text>
          </TouchableOpacity>

          {/* Bus / Truck */}
          <TouchableOpacity
            style={[styles.vehicleTab, selectedVehicle === 'bus_truck' && styles.vehicleTabActive]}
            onPress={() => setSelectedVehicle('bus_truck')}
            activeOpacity={0.85}
          >
            <Truck size={15} color={selectedVehicle === 'bus_truck' ? '#171717' : '#9CA3AF'} />
            <Text style={[styles.vehicleTabText, selectedVehicle === 'bus_truck' && styles.vehicleTabTextActive]}>
              Bus/Truck
            </Text>
          </TouchableOpacity>
        </View>

        {/* City Filter Pills */}
        <View style={styles.cityPillRow}>
          {(['all', 'Noida', 'Greater Noida', 'Gurgaon'] as const).map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.cityChip, selectedCity === c && styles.cityChipActive]}
              onPress={() => setSelectedCity(c)}
            >
              <Text style={[styles.cityChipText, selectedCity === c && styles.cityChipTextActive]}>
                {c === 'all' ? 'All NCR' : c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ─── 3. Centers List ─── */}
      <FlatList
        data={displayedCenters}
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
              title="No Wash Centers Found"
              description="No facilities found matching your vehicle filter or city. Try switching to 'All'."
              actionTitle="Reset Filters"
              onAction={() => {
                setSelectedVehicle('all');
                setSelectedCity('all');
                setSearchQuery('');
              }}
            />
          ) : null
        }
        renderItem={({ item }) => {
          const currentPrice =
            selectedVehicle === 'bike'
              ? item.pricing.bike
              : selectedVehicle === 'bus_truck'
              ? item.pricing.bus_truck
              : item.pricing.car;

          return (
            <View style={styles.centerCard}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.centerName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.locationRow}>
                    <MapPin size={13} color="#9CA3AF" />
                    <Text style={styles.addressText} numberOfLines={1}>
                      {item.locality}, {item.city}
                    </Text>
                  </View>
                </View>

                {/* Rating Badge */}
                <View style={styles.ratingBadge}>
                  <Star size={12} color="#FFC928" fill="#FFC928" style={{ marginRight: 3 }} />
                  <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                  <Text style={styles.reviewsText}>({item.reviewsCount})</Text>
                </View>
              </View>

              {/* Supported Vehicles Tags */}
              <View style={styles.tagsRow}>
                {item.supportedVehicles.map((v) => (
                  <View key={v} style={styles.vehicleBadge}>
                    <Text style={styles.vehicleBadgeText}>
                      {v === 'bike' ? '🏍️ Bike' : v === 'car' ? '🚗 Car' : '🚛 Bus/Truck'}
                    </Text>
                  </View>
                ))}
                <View style={styles.hoursBadge}>
                  <Clock size={11} color="#059669" style={{ marginRight: 4 }} />
                  <Text style={styles.hoursText}>{item.operatingHours || 'Open Today'}</Text>
                </View>
              </View>

              {/* Services List */}
              <View style={styles.servicesPillsWrap}>
                {item.services.slice(0, 3).map((s, idx) => (
                  <View key={idx} style={styles.servicePill}>
                    <Text style={styles.servicePillText}>{s}</Text>
                  </View>
                ))}
              </View>

              {/* Pricing & Actions */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.priceLabel}>Starting from</Text>
                  <Text style={styles.priceValue}>₹{currentPrice}</Text>
                </View>

                <View style={styles.actionsRow}>
                  {/* Phone Call */}
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => Linking.openURL(`tel:${item.phone}`).catch(() => {})}
                    activeOpacity={0.8}
                  >
                    <Phone size={15} color="#FFFFFF" />
                  </TouchableOpacity>

                  {/* GPS Directions */}
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => {
                      launchMobileLiveGpsNavigation({
                        latitude: item.latitude,
                        longitude: item.longitude,
                        locationName: item.name,
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <Navigation size={15} color="#FFFFFF" fill="#FFFFFF" />
                  </TouchableOpacity>

                  {/* Book Wash Button */}
                  <TouchableOpacity
                    style={styles.bookWashBtn}
                    onPress={() => handleBookNow(item)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.bookWashBtnText}>Book Wash</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0D14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#0F131D',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  filterSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: '#0F131D',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchContainer: {
    marginBottom: Spacing.sm,
  },
  vehicleFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  vehicleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.md,
    paddingVertical: 9,
  },
  vehicleTabActive: {
    backgroundColor: Colors.primaryYellow,
    borderColor: Colors.primaryYellow,
  },
  vehicleTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  vehicleTabTextActive: {
    color: '#171717',
    fontWeight: '800',
  },
  cityPillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: Spacing.md,
  },
  cityChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cityChipActive: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#525252',
  },
  cityChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  cityChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  centerCard: {
    backgroundColor: '#10141D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  centerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 201, 40, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 40, 0.3)',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFC928',
  },
  reviewsText: {
    fontSize: 10,
    color: '#A3A3A3',
    marginLeft: 3,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  vehicleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vehicleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  hoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hoursText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  servicesPillsWrap: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  servicePill: {
    backgroundColor: '#1E2430',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  servicePillText: {
    fontSize: 11,
    color: '#CBD5E1',
    textTransform: 'capitalize',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  priceLabel: {
    fontSize: 10.5,
    color: '#9CA3AF',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primaryYellow,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  bookWashBtn: {
    backgroundColor: Colors.primaryYellow,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  bookWashBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171717',
  },
});
