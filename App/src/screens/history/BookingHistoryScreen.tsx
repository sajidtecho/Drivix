import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Building2,
  MapPin,
  Car,
  RefreshCw,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { bookingApi } from '../../api/bookingApi';
import { Booking } from '../../types';

interface BookingHistoryScreenProps {
  navigation: any;
}

type TabCategory = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export const BookingHistoryScreen: React.FC<BookingHistoryScreenProps> = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState<TabCategory>('UPCOMING');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setError(null);
      const res = await bookingApi.getMyBookings();
      if (Array.isArray(res)) {
        setBookings(res);
      } else if ((res as any)?.data && Array.isArray((res as any).data)) {
        setBookings((res as any).data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not load your bookings. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const filteredBookings = bookings.filter((b) => {
    const status = String(b.status || '').toLowerCase();
    switch (selectedTab) {
      case 'UPCOMING':
        return status === 'confirmed' || status === 'pending' || status === 'booked';
      case 'ACTIVE':
        return (
          status === 'active' ||
          status === 'in_progress' ||
          status === 'occupied' ||
          status === 'slot assigned' ||
          status === 'checked in'
        );
      case 'COMPLETED':
        return status === 'completed' || status === 'checked out';
      case 'CANCELLED':
        return status === 'cancelled' || status === 'rejected' || status === 'expired';
      default:
        return true;
    }
  });

  const getStatusBadge = (rawStatus: string) => {
    const s = String(rawStatus || '').toLowerCase();
    if (s === 'confirmed' || s === 'booked') return <Badge label="CONFIRMED" variant="available" />;
    if (s === 'active' || s === 'in_progress' || s === 'slot assigned' || s === 'checked in')
      return <Badge label="ACTIVE NOW" variant="reserved" />;
    if (s === 'completed' || s === 'checked out')
      return <Badge label="COMPLETED" variant="neutral" />;
    if (s === 'cancelled' || s === 'expired')
      return <Badge label="CANCELLED" variant="occupied" />;
    return <Badge label={String(rawStatus || 'UNKNOWN').toUpperCase()} variant="neutral" />;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Scheduled';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getHubName = (b: Booking): string => {
    if (typeof b.parkingHubId === 'object' && b.parkingHubId?.parkingName) {
      return b.parkingHubId.parkingName;
    }
    return b.locationName || b.hubName || 'Drivix Smart Facility';
  };

  const getHubAddress = (b: Booking): string => {
    if (typeof b.parkingHubId === 'object' && b.parkingHubId?.address) {
      return b.parkingHubId.address;
    }
    return 'Campus Smart Facility';
  };

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const s = String(item.status || '').toLowerCase();
    const isUpcoming = s === 'confirmed' || s === 'pending' || s === 'booked';
    const isActive =
      s === 'active' ||
      s === 'in_progress' ||
      s === 'occupied' ||
      s === 'slot assigned' ||
      s === 'checked in';

    return (
      <Card style={styles.bookingCard}>
        {/* Header row: Hub name & Status */}
        <View style={styles.cardHeader}>
          <View style={styles.hubTitleWrap}>
            <Building2 size={18} color={Colors.textPrimary} style={{ marginRight: 6 }} />
            <Text style={styles.hubName} numberOfLines={1}>
              {getHubName(item)}
            </Text>
          </View>
          {getStatusBadge(item.status)}
        </View>

        {/* Location */}
        <View style={styles.locationRow}>
          <MapPin size={13} color={Colors.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {getHubAddress(item)}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Schedule & Slot details */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>SCHEDULE</Text>
            <View style={styles.scheduleRow}>
              <Clock size={12} color={Colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.infoVal}>
                {formatDate(item.entryDate || item.startTime || item.bookingDate)}
              </Text>
            </View>
            <Text style={styles.infoSub}>Duration: {item.duration || 2} Hours</Text>
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>ALLOCATION</Text>
            <View style={styles.scheduleRow}>
              <Layers size={12} color={Colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.infoVal}>
                {item.floor || item.floorName || (item.floorNumber ? `Floor ${item.floorNumber}` : 'Capacity Reserved')}
              </Text>
            </View>
            <Text style={styles.infoSub}>
              Slot: {item.slotNumber || (typeof item.slotId === 'object' && item.slotId?.slotNumber) || (isActive ? 'Assigned' : 'On Arrival')}
            </Text>
          </View>
        </View>

        {/* Vehicle & Price */}
        <View style={styles.bottomRow}>
          <View style={styles.vehiclePill}>
            <Car size={13} color={Colors.textPrimary} />
            <Text style={styles.vehicleText}>{item.vehicleNumber || 'Vehicle'}</Text>
          </View>
          <View style={styles.priceWrap}>
            <Text style={styles.priceLabel}>Total:</Text>
            <Text style={styles.priceVal}>
              ₹{item.totalCost ?? item.totalAmount ?? item.basePrice ?? 0}
            </Text>
          </View>
        </View>

        {/* Action Buttons based on state */}
        <View style={styles.actionRow}>
          {isUpcoming && (
            <>
              <Button
                title="View Pass & QR"
                variant="outline"
                size="sm"
                style={{ flex: 1, marginRight: Spacing.xs }}
                onPress={() => navigation.navigate('BookingConfirmation', { booking: item })}
              />
              <Button
                title="Navigate"
                variant="primary"
                size="sm"
                style={{ flex: 1 }}
                onPress={() => navigation.navigate('Navigation', { booking: item })}
              />
            </>
          )}

          {isActive && (
            <>
              <Button
                title="Active Session"
                variant="primary"
                size="sm"
                style={{ flex: 1, marginRight: Spacing.xs }}
                onPress={() => navigation.navigate('ActiveParking', { bookingId: item._id })}
              />
              <Button
                title="Show QR"
                variant="outline"
                size="sm"
                style={{ flex: 1 }}
                onPress={() => navigation.navigate('BookingConfirmation', { booking: item })}
              />
            </>
          )}

          {!isUpcoming && !isActive && (
            <Button
              title="View Summary"
              variant="outline"
              size="sm"
              style={{ flex: 1 }}
              onPress={() => navigation.navigate('BookingConfirmation', { booking: item })}
            />
          )}
        </View>
      </Card>
    );
  };

  const tabCounts = {
    UPCOMING: bookings.filter((b) => {
      const s = String(b.status || '').toLowerCase();
      return s === 'confirmed' || s === 'pending' || s === 'booked';
    }).length,
    ACTIVE: bookings.filter((b) => {
      const s = String(b.status || '').toLowerCase();
      return (
        s === 'active' ||
        s === 'in_progress' ||
        s === 'occupied' ||
        s === 'slot assigned' ||
        s === 'checked in'
      );
    }).length,
    COMPLETED: bookings.filter((b) => {
      const s = String(b.status || '').toLowerCase();
      return s === 'completed' || s === 'checked out';
    }).length,
    CANCELLED: bookings.filter((b) => {
      const s = String(b.status || '').toLowerCase();
      return s === 'cancelled' || s === 'rejected' || s === 'expired';
    }).length,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <RefreshCw size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as TabCategory[]).map((tab) => {
          const isActive = selectedTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </Text>
              {tabCounts[tab] > 0 && (
                <View style={[styles.badgeCount, isActive && styles.activeBadgeCount]}>
                  <Text style={[styles.badgeText, isActive && styles.activeBadgeText]}>
                    {tabCounts[tab]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primaryYellow} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            variant="primary"
            size="sm"
            onPress={fetchBookings}
            style={{ marginTop: Spacing.md }}
          />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderBookingCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primaryYellow]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title={`No ${selectedTab.toLowerCase()} bookings`}
              description={
                selectedTab === 'UPCOMING'
                  ? 'Reserve your smart parking spot ahead of time to guarantee your spot.'
                  : `You have no ${selectedTab.toLowerCase()} parking reservations.`
              }
              actionText={selectedTab === 'UPCOMING' ? 'Find Parking' : undefined}
              onActionPress={() => navigation.navigate('Find Parking')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  refreshBtn: {
    padding: Spacing.sm,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginRight: Spacing.xs,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.cardBackgroundAlt,
  },
  activeTabButton: {
    backgroundColor: Colors.primaryYellow,
  },
  tabText: {
    fontWeight: '600',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  activeTabText: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  badgeCount: {
    backgroundColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 4,
  },
  activeBadgeCount: {
    backgroundColor: Colors.textPrimary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeBadgeText: {
    color: Colors.primaryYellow,
  },
  listContent: {
    padding: Spacing.lg,
  },
  bookingCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hubTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  hubName: {
    fontWeight: '700',
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontWeight: '700',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  infoVal: {
    fontWeight: '600',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  infoSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  vehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackgroundAlt,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  vehicleText: {
    fontWeight: '600',
    fontSize: 11,
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  priceVal: {
    fontWeight: '800',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
  },
});
