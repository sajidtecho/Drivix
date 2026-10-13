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
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
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
      if (res.success && res.data) {
        setBookings(res.data);
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

  // Categorize bookings
  const filteredBookings = bookings.filter((b) => {
    const status = b.status?.toLowerCase();
    switch (selectedTab) {
      case 'UPCOMING':
        return status === 'confirmed' || status === 'pending';
      case 'ACTIVE':
        return status === 'active' || status === 'in_progress' || status === 'occupied';
      case 'COMPLETED':
        return status === 'completed' || status === 'checked out' || status === 'checked_out';
      case 'CANCELLED':
        return status === 'cancelled' || status === 'rejected' || status === 'expired';
      default:
        return true;
    }
  });

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'confirmed') return <Badge text="CONFIRMED" variant="success" />;
    if (s === 'active' || s === 'in_progress') return <Badge text="ACTIVE NOW" variant="warning" />;
    if (s === 'completed' || s === 'checked out' || s === 'checked_out') return <Badge text="COMPLETED" variant="neutral" />;
    if (s === 'cancelled') return <Badge text="CANCELLED" variant="danger" />;
    return <Badge text={status?.toUpperCase() || 'UNKNOWN'} variant="neutral" />;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
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

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const isUpcoming = item.status === 'confirmed' || item.status === 'pending';
    const isActive = item.status === 'active' || item.status === 'in_progress' || item.status === 'occupied';

    return (
      <Card style={styles.bookingCard}>
        {/* Header row: Hub name & Status */}
        <View style={styles.cardHeader}>
          <View style={styles.hubTitleWrap}>
            <Ionicons name="business" size={18} color={colors.textPrimary} style={{ marginRight: 6 }} />
            <Text style={styles.hubName} numberOfLines={1}>
              {item.facilityId?.name || item.hubName || 'Drivix Smart Parking'}
            </Text>
          </View>
          {getStatusBadge(item.status)}
        </View>

        {/* Reference & Location */}
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.facilityId?.address?.locality || item.facilityId?.address?.city || 'Campus Smart Facility'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Schedule & Slot details */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>SCHEDULE</Text>
            <Text style={styles.infoVal}>{formatDate(item.startTime)}</Text>
            <Text style={styles.infoSub}>to {formatDate(item.endTime)}</Text>
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>ALLOCATION</Text>
            <Text style={styles.infoVal}>
              Floor: {item.floorName || item.floorNumber ? `Floor ${item.floorNumber}` : 'Capacity Reserved'}
            </Text>
            <Text style={styles.infoSub}>
              Slot: {item.slotId?.slotNumber || item.slotNumber || (isActive ? 'Assigned' : 'On Arrival')}
            </Text>
          </View>
        </View>

        {/* Vehicle & Price */}
        <View style={styles.bottomRow}>
          <View style={styles.vehiclePill}>
            <Ionicons name="car-outline" size={14} color={colors.textPrimary} />
            <Text style={styles.vehicleText}>{item.vehicleNumber || 'Vehicle'}</Text>
          </View>
          <View style={styles.priceWrap}>
            <Text style={styles.priceLabel}>Total:</Text>
            <Text style={styles.priceVal}>₹{item.totalAmount ?? item.basePrice ?? 0}</Text>
          </View>
        </View>

        {/* Action Buttons based on state */}
        <View style={styles.actionRow}>
          {isUpcoming && (
            <>
              <Button
                title="View Pass & QR"
                variant="outline"
                size="small"
                style={{ flex: 1, marginRight: spacing.xs }}
                onPress={() => navigation.navigate('BookingConfirmation', { booking: item })}
              />
              <Button
                title="Navigate"
                variant="primary"
                size="small"
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
                size="small"
                style={{ flex: 1, marginRight: spacing.xs }}
                onPress={() => navigation.navigate('ActiveParking', { bookingId: item._id })}
              />
              <Button
                title="Show QR"
                variant="outline"
                size="small"
                style={{ flex: 1 }}
                onPress={() => navigation.navigate('BookingConfirmation', { booking: item })}
              />
            </>
          )}

          {!isUpcoming && !isActive && (
            <Button
              title="View Details"
              variant="outline"
              size="small"
              style={{ flex: 1 }}
              onPress={() => navigation.navigate('BookingConfirmation', { booking: item })}
            />
          )}
        </View>
      </Card>
    );
  };

  const tabCounts = {
    UPCOMING: bookings.filter((b) => b.status?.toLowerCase() === 'confirmed' || b.status?.toLowerCase() === 'pending').length,
    ACTIVE: bookings.filter((b) => b.status?.toLowerCase() === 'active' || b.status?.toLowerCase() === 'in_progress').length,
    COMPLETED: bookings.filter((b) => b.status?.toLowerCase() === 'completed' || b.status?.toLowerCase() === 'checked out').length,
    CANCELLED: bookings.filter((b) => b.status?.toLowerCase() === 'cancelled' || b.status?.toLowerCase() === 'rejected').length,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color={colors.textPrimary} />
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
          <ActivityIndicator size="large" color={colors.primaryYellow} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Retry" variant="primary" size="small" onPress={fetchBookings} style={{ marginTop: spacing.md }} />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderBookingCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primaryYellow]} />}
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: typography.fontBold,
    fontSize: typography.fontSizes.xxl,
    color: colors.textPrimary,
  },
  refreshBtn: {
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  activeTabButton: {
    backgroundColor: colors.primaryYellow,
  },
  tabText: {
    fontFamily: typography.fontMedium,
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  activeTabText: {
    fontFamily: typography.fontBold,
    color: colors.textPrimary,
  },
  badgeCount: {
    backgroundColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 4,
  },
  activeBadgeCount: {
    backgroundColor: colors.textPrimary,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: typography.fontBold,
    color: colors.textSecondary,
  },
  activeBadgeText: {
    color: colors.primaryYellow,
  },
  listContent: {
    padding: spacing.lg,
  },
  bookingCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
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
    marginRight: spacing.sm,
  },
  hubName: {
    fontFamily: typography.fontBold,
    fontSize: typography.fontSizes.md,
    color: colors.textPrimary,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontFamily: typography.fontRegular,
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: typography.fontBold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  infoVal: {
    fontFamily: typography.fontMedium,
    fontSize: typography.fontSizes.sm,
    color: colors.textPrimary,
    marginTop: 2,
  },
  infoSub: {
    fontFamily: typography.fontRegular,
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  vehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vehicleText: {
    fontFamily: typography.fontMedium,
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    marginLeft: 4,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontFamily: typography.fontRegular,
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginRight: 4,
  },
  priceVal: {
    fontFamily: typography.fontBold,
    fontSize: typography.fontSizes.md,
    color: colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontFamily: typography.fontRegular,
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  errorText: {
    fontFamily: typography.fontRegular,
    fontSize: typography.fontSizes.sm,
    color: colors.error,
    textAlign: 'center',
  },
});
