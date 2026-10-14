import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  Layers,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Wind,
  Gauge,
  Zap,
  Check,
  Plus,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { Header, Card, Button, Badge, StepIndicator } from '../../components/common';
import { useBooking } from '../../store/BookingContext';
import { useAuth } from '../../store/AuthContext';
import { Booking } from '../../types';
import { IN_HUB_VEHICLE_SERVICES } from '../../services/vehicleCareServices';

export interface BookingReviewScreenProps {
  onBack: () => void;
  onBookingSuccess: (booking: Booking) => void;
  onRequireAuth: () => void;
}

export const BookingReviewScreen: React.FC<BookingReviewScreenProps> = ({
  onBack,
  onBookingSuccess,
  onRequireAuth,
}) => {
  const { user, isAuthenticated } = useAuth();
  const {
    selectedHub,
    selectedFloor,
    entryDate,
    entryTime,
    durationHours,
    vehicleNumber,
    vehicleName,
    pricingQuote,
    totalCost,
    selectedServices,
    servicesCost,
    toggleService,
    confirmBooking,
    isSubmittingBooking,
  } = useBooking();

  const [paymentMode, setPaymentMode] = useState<'PAY_AFTER_CHECKOUT' | 'PAY_NOW'>('PAY_AFTER_CHECKOUT');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Calculate estimated exit time
  const calculateExitTime = (): string => {
    if (!entryTime) return '--:--';
    const [h, m] = entryTime.split(':').map(Number);
    const endH = (h + durationHours) % 24;
    return `${String(endH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
  };

  const handleConfirm = async () => {
    if (!isAuthenticated || !user) {
      onRequireAuth();
      return;
    }

    setErrorMsg('');
    try {
      const created = await confirmBooking(paymentMode, {
        name: user.name || 'Drivix User',
        mobile: user.mobile || user.phone || '',
      });
      onBookingSuccess(created);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Unable to complete reservation. Capacity may have filled up.';
      setErrorMsg(msg);
      Alert.alert('Booking Error', msg);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Review & Confirm"
        subtitle="Step 5 of 5"
        onBack={onBack}
      />

      <StepIndicator currentStep={5} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── Parking Hub & Floor Summary ─── */}
        <Card style={styles.summaryCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.hubTitleCol}>
              <Text style={styles.hubTitle}>{selectedHub?.parkingName || 'Parking Hub'}</Text>
              <View style={styles.addressRow}>
                <MapPin size={14} color={Colors.textSecondary} />
                <Text style={styles.addressText} numberOfLines={2}>
                  {selectedHub?.address}
                </Text>
              </View>
            </View>
            <Badge label="Confirmed Hub" variant="available" />
          </View>

          <View style={styles.divider} />

          {/* Reserved Floor */}
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Layers size={18} color={Colors.textSecondary} />
              <Text style={styles.detailLabel}>Reserved Level</Text>
            </View>
            <Text style={styles.detailValue}>
              Floor {selectedFloor?.floorName || 'Ground'} (Capacity Reserved)
            </Text>
          </View>

          {/* Schedule Window */}
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Calendar size={18} color={Colors.textSecondary} />
              <Text style={styles.detailLabel}>Schedule Date</Text>
            </View>
            <Text style={styles.detailValue}>{entryDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Clock size={18} color={Colors.textSecondary} />
              <Text style={styles.detailLabel}>Reserved Window</Text>
            </View>
            <Text style={styles.detailValue}>
              {entryTime} – {calculateExitTime()} ({durationHours} hours)
            </Text>
          </View>

          {/* Vehicle Plate */}
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Car size={18} color={Colors.textSecondary} />
              <Text style={styles.detailLabel}>Vehicle Plate</Text>
            </View>
            <Text style={styles.detailValueBold}>{vehicleNumber}</Text>
          </View>
        </Card>

        {/* ─── While-You-Park Vehicle Care Add-ons ─── */}
        <View style={styles.servicesHeaderContainer}>
          <View style={styles.servicesTitleRowHeader}>
            <View style={styles.servicesIconGlow}>
              <Sparkles size={16} color={Colors.primaryYellow} />
            </View>
            <View>
              <Text style={styles.servicesSectionMainTitle}>While-You-Park Vehicle Care</Text>
              <Text style={styles.servicesSectionSub}>Serviced right in your assigned parking bay</Text>
            </View>
          </View>
        </View>

        <View style={styles.servicesListContainer}>
          {IN_HUB_VEHICLE_SERVICES.map((service) => {
            const isSelected = selectedServices.some((s) => s.id === service.id);
            return (
              <TouchableOpacity
                key={service.id}
                activeOpacity={0.88}
                onPress={() => toggleService(service)}
                style={[
                  styles.serviceCardBox,
                  isSelected && styles.serviceCardBoxSelected,
                ]}
              >
                <View
                  style={[
                    styles.serviceIconContainer,
                    isSelected && styles.serviceIconContainerSelected,
                  ]}
                >
                  {service.category === 'wash' && <Sparkles size={18} color={isSelected ? '#171717' : Colors.primaryYellow} />}
                  {service.category === 'detail' && <Wind size={18} color={isSelected ? '#171717' : '#38BDF8'} />}
                  {service.category === 'maintenance' && <Gauge size={18} color={isSelected ? '#171717' : '#F59E0B'} />}
                  {service.category === 'ev' && <Zap size={18} color={isSelected ? '#171717' : '#10B981'} />}
                </View>

                <View style={styles.serviceTextColumn}>
                  <View style={styles.serviceHeadingRow}>
                    <Text style={[styles.serviceCardTitle, isSelected && styles.serviceCardTitleSelected]}>
                      {service.name}
                    </Text>
                    {service.popular && (
                      <View style={styles.popularBadgeWrap}>
                        <Text style={styles.popularBadgeLabel}>POPULAR</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.serviceTaglineText} numberOfLines={2}>
                    {service.tagline}
                  </Text>
                  <Text style={styles.serviceDurationLabel}>⚡ Est. time: ~{service.durationMinutes} mins</Text>
                </View>

                <View style={styles.serviceRightPriceCol}>
                  <Text style={[styles.servicePriceDigit, isSelected && styles.servicePriceDigitSelected]}>
                    +₹{service.price}
                  </Text>
                  <View style={[styles.serviceCheckToggle, isSelected && styles.serviceCheckToggleActive]}>
                    {isSelected ? (
                      <Check size={13} color="#171717" strokeWidth={3} />
                    ) : (
                      <Plus size={13} color={Colors.textSecondary} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Price & Cost Breakdown Card ─── */}
        <Card style={styles.pricingCard}>
          <View style={styles.pricingHeaderRow}>
            <Text style={styles.pricingSectionTitle}>Payment Summary</Text>
            {pricingQuote?.isSurgeActive && (
              <Badge label="AI Surge Active" variant="surge" />
            )}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceRowLabel}>Base Parking Rate</Text>
            <Text style={styles.priceRowValue}>₹{selectedHub?.hourlyPrice || 60}/hr</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceRowLabel}>Pricing Multiplier</Text>
            <Text style={styles.priceRowValue}>
              {pricingQuote ? `${pricingQuote.multiplier}x` : '1.0x'}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceRowLabel}>Duration</Text>
            <Text style={styles.priceRowValue}>{durationHours} hours</Text>
          </View>

          {selectedServices.length > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceRowLabel, { color: Colors.primaryYellow, fontWeight: '700' }]}>
                In-Bay Care ({selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'})
              </Text>
              <Text style={[styles.priceRowValue, { color: Colors.primaryYellow, fontWeight: '800' }]}>
                +₹{servicesCost}
              </Text>
            </View>
          )}

          <View style={styles.dividerBold} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Quoted Cost</Text>
            <Text style={styles.totalValue}>₹{totalCost}</Text>
          </View>
        </Card>

        {/* ─── Payment Mode Selection ─── */}
        <Text style={styles.sectionHeading}>Payment Preference</Text>
        <View style={styles.paymentModeRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setPaymentMode('PAY_AFTER_CHECKOUT')}
            style={[
              styles.paymentOption,
              paymentMode === 'PAY_AFTER_CHECKOUT' && styles.paymentOptionSelected,
            ]}
          >
            <CreditCard size={20} color={paymentMode === 'PAY_AFTER_CHECKOUT' ? '#171717' : Colors.textSecondary} />
            <Text style={[styles.paymentTitle, paymentMode === 'PAY_AFTER_CHECKOUT' && styles.paymentTitleSelected]}>
              Pay on Exit
            </Text>
            <Text style={styles.paymentSub}>Pay after parking ends</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setPaymentMode('PAY_NOW')}
            style={[
              styles.paymentOption,
              paymentMode === 'PAY_NOW' && styles.paymentOptionSelected,
            ]}
          >
            <Sparkles size={20} color={paymentMode === 'PAY_NOW' ? '#171717' : Colors.textSecondary} />
            <Text style={[styles.paymentTitle, paymentMode === 'PAY_NOW' && styles.paymentTitleSelected]}>
              Prepay Now
            </Text>
            <Text style={styles.paymentSub}>Fastest gate exit</Text>
          </TouchableOpacity>
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <AlertCircle size={18} color={Colors.error} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Guarantee Banner */}
        <View style={styles.guaranteeBox}>
          <ShieldCheck size={18} color="#15803D" />
          <Text style={styles.guaranteeText}>
            Drivix Capacity Guarantee: Capacity on Floor {selectedFloor?.floorName || '1'} is held exclusively for you. Your physical slot is assigned automatically upon arrival.
          </Text>
        </View>
      </ScrollView>

      {/* ─── Sticky Confirm Footer ─── */}
      <View style={styles.footerContainer}>
        <View style={styles.footerPriceCol}>
          <Text style={styles.footerTotalVal}>₹{totalCost}</Text>
          <Text style={styles.footerTotalSub}>Total Payable</Text>
        </View>

        <Button
          title={isSubmittingBooking ? 'Reserving Capacity...' : 'Confirm Booking'}
          variant="primary"
          loading={isSubmittingBooking}
          icon={<CheckCircle2 size={18} color="#171717" />}
          iconPosition="right"
          onPress={handleConfirm}
          style={styles.confirmBtn}
        />
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
    paddingBottom: 110,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  hubTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  hubTitle: {
    fontSize: 18,
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
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  detailValueBold: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  pricingCard: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FEF08A',
    borderWidth: 1.5,
    marginBottom: Spacing.lg,
  },
  pricingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  pricingSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  priceRowLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  priceRowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dividerBold: {
    height: 1.5,
    backgroundColor: '#FEF08A',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  paymentModeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  paymentOption: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  paymentOptionSelected: {
    backgroundColor: Colors.accentYellowLight,
    borderColor: Colors.primaryYellow,
    borderWidth: 2,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 6,
  },
  paymentTitleSelected: {
    fontWeight: '800',
  },
  paymentSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 10,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600',
    flex: 1,
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 10,
    marginTop: 4,
  },
  guaranteeText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerPriceCol: {
    marginRight: Spacing.md,
  },
  footerTotalVal: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  footerTotalSub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    maxWidth: 220,
  },
  servicesHeaderContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  servicesTitleRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  servicesIconGlow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 201, 40, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 40, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  servicesSectionMainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  servicesSectionSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  servicesListContainer: {
    gap: 10,
    marginBottom: Spacing.lg,
  },
  serviceCardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2333',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  serviceCardBoxSelected: {
    backgroundColor: '#262D42',
    borderColor: Colors.primaryYellow,
    shadowColor: Colors.primaryYellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconContainerSelected: {
    backgroundColor: Colors.primaryYellow,
  },
  serviceTextColumn: {
    flex: 1,
  },
  serviceHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  serviceCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  serviceCardTitleSelected: {
    color: Colors.primaryYellow,
  },
  popularBadgeWrap: {
    backgroundColor: 'rgba(255, 201, 40, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  popularBadgeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryYellow,
    letterSpacing: 0.5,
  },
  serviceTaglineText: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 15,
  },
  serviceDurationLabel: {
    fontSize: 10,
    color: '#A1A1AA',
    fontWeight: '600',
    marginTop: 4,
  },
  serviceRightPriceCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  servicePriceDigit: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  servicePriceDigitSelected: {
    color: Colors.primaryYellow,
  },
  serviceCheckToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceCheckToggleActive: {
    backgroundColor: Colors.primaryYellow,
  },
});
