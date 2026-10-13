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
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { Card, Button, Badge, Input, EmptyState } from '../../components/common';
import { parkingApi } from '../../api/parkingApi';
import { useBooking } from '../../store/BookingContext';
import { ParkingLocation } from '../../types';

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
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      result = result.filter((l) => l.availableSlots > 0);
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
        <Text style={styles.headerTitle}>Find Parking Hubs</Text>
        <Text style={styles.headerSubtitle}>
          Real-time occupancy & multi-floor smart reservations
        </Text>

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
        renderItem={({ item }) => (
          <Card
            style={styles.locationCard}
            onPress={() => {
              selectHub(item);
              onSelectHub(item);
            }}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleCol}>
                <Text style={styles.hubTitle}>{item.parkingName}</Text>
                <View style={styles.addressRow}>
                  <MapPin size={14} color={Colors.textSecondary} />
                  <Text style={styles.addressText} numberOfLines={2}>
                    {item.address}
                  </Text>
                </View>
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.priceValue}>₹{item.hourlyPrice}</Text>
                <Text style={styles.priceUnit}>/hr base</Text>
              </View>
            </View>

            {/* Capacity & Amenities Bar */}
            <View style={styles.metaRow}>
              <Badge
                label={`${item.availableSlots} / ${item.totalSlots} Free`}
                variant={item.availableSlots > 10 ? 'available' : item.availableSlots > 0 ? 'reserved' : 'occupied'}
              />

              {item.totalFloors ? (
                <View style={styles.metaChip}>
                  <Layers size={13} color={Colors.textSecondary} />
                  <Text style={styles.metaChipText}>{item.totalFloors} Floors</Text>
                </View>
              ) : null}

              {item.amenities?.includes('EV Charging') && (
                <View style={styles.metaChip}>
                  <Zap size={13} color="#15803D" />
                  <Text style={styles.metaChipText}>EV Fast</Text>
                </View>
              )}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.operatingHoursText}>
                {item.openingTime && item.closingTime
                  ? `Open: ${item.openingTime} - ${item.closingTime}`
                  : 'Open 24/7 Monitored'}
              </Text>
              <View style={styles.selectActionRow}>
                <Text style={styles.selectActionText}>Select Floor</Text>
                <ChevronRight size={16} color="#171717" />
              </View>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.h2,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...Typography.subtitle,
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
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: Colors.primaryYellow,
    borderColor: '#171717',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 90,
  },
  locationCard: {
    marginBottom: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitleCol: {
    flex: 1,
    marginRight: Spacing.md,
  },
  hubTitle: {
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
  priceContainer: {
    alignItems: 'flex-end',
    backgroundColor: Colors.accentYellowLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accentYellowMuted,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  priceUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  metaChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    marginTop: 4,
  },
  operatingHoursText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  selectActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  selectActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171717',
  },
});
