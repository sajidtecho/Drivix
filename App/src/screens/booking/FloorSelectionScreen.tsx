import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Layers,
  Zap,
  Accessibility,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Navigation,
  AlertTriangle,
  Box,
  ListFilter,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { Header, Card, Button, Badge, StepIndicator } from '../../components/common';
import { ParkingBuilding3DVisualizer } from '../../components/parking';
import { useBooking } from '../../store/BookingContext';
import { parkingApi } from '../../api/parkingApi';
import { ParkingFloor } from '../../types';
import { checkIsOnlineBookingAllowed } from '../../services/bookingEligibility';
import { launchMobileLiveGpsNavigation } from '../../services/navigation';

export interface FloorSelectionScreenProps {
  onBack: () => void;
  onProceed: () => void;
}

export const FloorSelectionScreen: React.FC<FloorSelectionScreenProps> = ({
  onBack,
  onProceed,
}) => {
  const { selectedHub, selectedFloor, selectFloor } = useBooking();
  const [floors, setFloors] = useState<ParkingFloor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [viewFormat, setViewFormat] = useState<'3D' | 'list'>('3D');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedHub) return;
    const fetchFloors = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await parkingApi.getFloorsForLocation(selectedHub._id);
        const validFloors = Array.isArray(data) ? data : [];
        setFloors(validFloors);
        if (validFloors.length > 0 && !selectedFloor) {
          selectFloor(validFloors[0]);
        }
      } catch (err: any) {
        console.warn('[FloorSelectionScreen] Error fetching floors:', err);
        setFloors([]);
        setError('Could not retrieve live floor capacity.');
      } finally {
        setLoading(false);
      }
    };
    fetchFloors();
  }, [selectedHub?._id]);

  const handleContinue = () => {
    if (!selectedFloor) return;
    onProceed();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Select Parking Floor"
        subtitle={selectedHub ? selectedHub.parkingName : 'Step 2 of 5'}
        onBack={onBack}
      />

      <StepIndicator currentStep={2} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.bannerInfo}>
          <View style={styles.bannerTitleRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.heading}>Choose Your Level</Text>
              <Text style={styles.subheading}>
                Interactive 3D building visualizer with real-time floor capacity.
              </Text>
            </View>

            {floors.length > 0 && (
              <View style={styles.viewToggleGroup}>
                <TouchableOpacity
                  style={[styles.viewToggleBtn, viewFormat === '3D' && styles.viewToggleBtnActive]}
                  onPress={() => setViewFormat('3D')}
                  activeOpacity={0.7}
                >
                  <Box size={14} color={viewFormat === '3D' ? '#171717' : Colors.textSecondary} />
                  <Text style={[styles.viewToggleText, viewFormat === '3D' && styles.viewToggleTextActive]}>
                    3D Twin
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.viewToggleBtn, viewFormat === 'list' && styles.viewToggleBtnActive]}
                  onPress={() => setViewFormat('list')}
                  activeOpacity={0.7}
                >
                  <ListFilter size={14} color={viewFormat === 'list' ? '#171717' : Colors.textSecondary} />
                  <Text style={[styles.viewToggleText, viewFormat === 'list' && styles.viewToggleTextActive]}>
                    List
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {!checkIsOnlineBookingAllowed(selectedHub) ? (
          <Card style={[styles.emptyCard, { borderColor: 'rgba(245, 158, 11, 0.4)', backgroundColor: 'rgba(245, 158, 11, 0.08)' }]}>
            <AlertTriangle size={32} color="#FFAD00" style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: '#FFAD00' }]}>On-Site Entry Only</Text>
            <Text style={[styles.emptyDesc, { color: Colors.textSecondary, marginBottom: 18 }]}>
              {selectedHub?.parkingName || 'This parking facility'} does not support online slot reservations. Entry is managed directly at the on-site barrier gate.
            </Text>
            <Button
              title="Navigate to Location (GPS)"
              variant="primary"
              icon={<Navigation size={18} color="#171717" />}
              iconPosition="right"
              onPress={() => {
                if (selectedHub) {
                  launchMobileLiveGpsNavigation({
                    latitude: selectedHub.latitude,
                    longitude: selectedHub.longitude,
                    locationName: selectedHub.parkingName,
                  });
                }
              }}
              style={{ width: '100%' }}
            />
          </Card>
        ) : loading ? (
          <ActivityIndicator size="large" color={Colors.primaryYellow} style={{ marginTop: 40 }} />
        ) : error ? (
          <Card style={styles.errorCard}>
            <AlertCircle size={22} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : floors.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Layers size={24} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Open Floor Lot</Text>
            <Text style={styles.emptyDesc}>
              This parking hub operates on a single open-level capacity plan.
            </Text>
            <Button
              title="Continue with Ground Level"
              variant="primary"
              onPress={() => {
                selectFloor({
                  _id: 'default_ground',
                  parkingHubId: selectedHub?._id || '',
                  floorName: 'Ground',
                  totalSlots: selectedHub?.totalSlots || 50,
                  availableSlots: selectedHub?.availableSlots || 25,
                });
                onProceed();
              }}
              style={{ marginTop: 12 }}
            />
          </Card>
        ) : (
          <>
            {/* Interactive 3D Building Digital Twin Visualizer */}
            {viewFormat === '3D' ? (
              <ParkingBuilding3DVisualizer
                floors={floors}
                selectedFloor={selectedFloor}
                onSelectFloor={(floor) => selectFloor(floor)}
                selectedSlot={selectedSlotId}
                onSelectSlot={(slotId) => setSelectedSlotId(slotId)}
                buildingName={selectedHub?.parkingName}
              />
            ) : (
              /* Traditional List View */
              <View>
                {(Array.isArray(floors) ? floors : []).map((floor) => {
                  const isSelected = selectedFloor?._id === floor._id;
                  const occupancyPct = floor.totalSlots > 0
                    ? Math.round(((floor.totalSlots - floor.availableSlots) / floor.totalSlots) * 100)
                    : 0;
                  const isFull = floor.availableSlots <= 0;

                  return (
                    <Card
                      key={floor._id}
                      selected={isSelected}
                      onPress={() => !isFull && selectFloor(floor)}
                      style={[styles.floorItemCard, isFull && styles.floorCardFull]}
                    >
                      <View style={styles.floorCardHeader}>
                        <View style={styles.floorBadgeContainer}>
                          <View style={[styles.floorBadge, isSelected && styles.floorBadgeSelected]}>
                            <Text style={[styles.floorBadgeText, isSelected && styles.floorBadgeTextSelected]}>
                              {floor.floorName}
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.floorTitle}>Floor {floor.floorName}</Text>
                            <Text style={styles.floorCapacitySub}>
                              {isFull ? 'No capacity available' : `${floor.availableSlots} of ${floor.totalSlots} slots free`}
                            </Text>
                          </View>
                        </View>

                        <Badge
                          label={isFull ? 'Floor Full' : `${floor.availableSlots} Free`}
                          variant={isFull ? 'occupied' : floor.availableSlots > 5 ? 'available' : 'reserved'}
                        />
                      </View>

                      {/* Occupancy visual bar */}
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressBar,
                            {
                              width: `${Math.min(100, occupancyPct)}%`,
                              backgroundColor: isFull ? Colors.occupied : occupancyPct > 80 ? Colors.warning : Colors.available,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.occupancyText}>{occupancyPct}% Occupancy</Text>

                      {/* Supported floor amenities */}
                      <View style={styles.floorFeaturesRow}>
                        {floor.evSlots ? (
                          <View style={styles.featureBadge}>
                            <Zap size={12} color="#15803D" />
                            <Text style={styles.featureText}>{floor.evSlots} EV Charging Bays</Text>
                          </View>
                        ) : null}
                        {floor.accessibilitySlots ? (
                          <View style={styles.featureBadge}>
                            <Accessibility size={12} color="#1E40AF" />
                            <Text style={styles.featureText}>Accessible Bays</Text>
                          </View>
                        ) : null}
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Action Footer */}
      <View style={styles.footerContainer}>
        {checkIsOnlineBookingAllowed(selectedHub) ? (
          <Button
            title={selectedFloor ? `Proceed with Floor ${selectedFloor.floorName}` : 'Select a Floor'}
            variant="primary"
            disabled={!selectedFloor || selectedFloor.availableSlots <= 0}
            icon={<ArrowRight size={18} color="#171717" />}
            iconPosition="right"
            onPress={handleContinue}
            style={styles.continueBtn}
          />
        ) : (
          <Button
            title="Navigate directly to Location"
            variant="primary"
            icon={<Navigation size={18} color="#171717" />}
            iconPosition="right"
            onPress={() => {
              if (selectedHub) {
                launchMobileLiveGpsNavigation({
                  latitude: selectedHub.latitude,
                  longitude: selectedHub.longitude,
                  locationName: selectedHub.parkingName,
                });
              }
            }}
            style={styles.continueBtn}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  bannerInfo: {
    marginBottom: Spacing.lg,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  viewToggleBtnActive: {
    backgroundColor: Colors.primaryYellow,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  viewToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  viewToggleTextActive: {
    color: '#171717',
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  floorItemCard: {
    marginBottom: Spacing.md,
  },
  floorCardFull: {
    opacity: 0.6,
  },
  floorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  floorBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floorBadge: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  floorBadgeSelected: {
    backgroundColor: Colors.primaryYellow,
    borderColor: '#171717',
  },
  floorBadgeText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  floorBadgeTextSelected: {
    color: '#171717',
  },
  floorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  floorCapacitySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  occupancyText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'right',
  },
  floorFeaturesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  errorCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  continueBtn: {
    width: '100%',
  },
});
