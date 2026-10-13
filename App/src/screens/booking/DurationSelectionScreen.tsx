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
  Clock,
  Calendar,
  Zap,
  ArrowRight,
  TrendingUp,
  Percent,
  Sparkles,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { Header, Card, Button, Badge, StepIndicator } from '../../components/common';
import { useBooking } from '../../store/BookingContext';

export interface DurationSelectionScreenProps {
  onBack: () => void;
  onProceed: () => void;
}

const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8, 12];

export const DurationSelectionScreen: React.FC<DurationSelectionScreenProps> = ({
  onBack,
  onProceed,
}) => {
  const {
    selectedHub,
    selectedFloor,
    entryDate,
    entryTime,
    durationHours,
    setTimeAndDuration,
    pricingQuote,
    refreshPriceQuote,
    isCalculatingPrice,
  } = useBooking();

  const [selectedDuration, setSelectedDuration] = useState<number>(durationHours || 2);
  const [selectedDate, setSelectedDate] = useState<string>(entryDate);
  const [selectedTime, setSelectedTime] = useState<string>(entryTime);

  useEffect(() => {
    setTimeAndDuration(selectedDate, selectedTime, selectedDuration);
    refreshPriceQuote();
  }, [selectedDuration, selectedDate, selectedTime]);

  const handleSelectDuration = (hours: number) => {
    setSelectedDuration(hours);
  };

  const calculatedBaseRate = selectedHub?.hourlyPrice || 60;
  const quoteHourlyPrice = pricingQuote ? pricingQuote.recommendedPrice : calculatedBaseRate;
  const estimatedTotal = quoteHourlyPrice * selectedDuration;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Duration & Pricing"
        subtitle={selectedHub?.parkingName || 'Step 3 of 5'}
        onBack={onBack}
      />

      <StepIndicator currentStep={3} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerInfo}>
          <Text style={styles.heading}>Select Duration & Arrival</Text>
          <Text style={styles.subheading}>
            Prices are dynamically calibrated based on real-time occupancy and peak arrival hours.
          </Text>
        </View>

        {/* ─── Arrival Schedule Summary ─── */}
        <Card style={styles.scheduleCard}>
          <Text style={styles.cardHeaderTitle}>Arrival Schedule</Text>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Calendar size={18} color={Colors.textSecondary} />
              <View>
                <Text style={styles.scheduleItemLabel}>Booking Date</Text>
                <Text style={styles.scheduleItemValue}>{selectedDate || 'Today'}</Text>
              </View>
            </View>

            <View style={styles.dividerVertical} />

            <View style={styles.scheduleItem}>
              <Clock size={18} color={Colors.textSecondary} />
              <View>
                <Text style={styles.scheduleItemLabel}>Entry Time</Text>
                <Text style={styles.scheduleItemValue}>{selectedTime || 'Immediate'}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* ─── Duration Buttons Grid ─── */}
        <Text style={styles.sectionLabel}>Parking Duration (Hours)</Text>
        <View style={styles.durationGrid}>
          {DURATION_OPTIONS.map((hrs) => {
            const isSelected = selectedDuration === hrs;
            return (
              <TouchableOpacity
                key={hrs}
                activeOpacity={0.85}
                onPress={() => handleSelectDuration(hrs)}
                style={[
                  styles.durationChip,
                  isSelected && styles.durationChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.durationNumber,
                    isSelected && styles.durationNumberSelected,
                  ]}
                >
                  {hrs}
                </Text>
                <Text
                  style={[
                    styles.durationUnit,
                    isSelected && styles.durationUnitSelected,
                  ]}
                >
                  {hrs === 1 ? 'hour' : 'hours'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── AI Dynamic Pricing Quote Breakdown ─── */}
        <Card style={styles.quoteCard}>
          <View style={styles.quoteHeaderRow}>
            <View style={styles.aiTagRow}>
              <Sparkles size={16} color="#B45309" />
              <Text style={styles.aiTagText}>AI DYNAMIC PRICING QUOTE</Text>
            </View>

            {isCalculatingPrice ? (
              <ActivityIndicator size="small" color={Colors.primaryYellow} />
            ) : pricingQuote?.isSurgeActive ? (
              <Badge label="Surge Active" variant="surge" />
            ) : pricingQuote && pricingQuote.multiplier < 1.0 ? (
              <Badge label="15% Off-Peak" variant="discount" />
            ) : (
              <Badge label="Standard Rate" variant="available" />
            )}
          </View>

          <View style={styles.quoteDetailsCol}>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteRowLabel}>Base Hourly Rate</Text>
              <Text style={styles.quoteRowValue}>₹{calculatedBaseRate}/hr</Text>
            </View>

            <View style={styles.quoteRow}>
              <Text style={styles.quoteRowLabel}>Dynamic Rate Multiplier</Text>
              <Text style={styles.quoteRowValue}>
                {pricingQuote ? `${pricingQuote.multiplier}x` : '1.0x'}
              </Text>
            </View>

            <View style={styles.quoteRow}>
              <Text style={styles.quoteRowLabel}>Quoted Hourly Price</Text>
              <Text style={styles.quoteRowValueHighlight}>
                ₹{quoteHourlyPrice}/hr
              </Text>
            </View>

            <View style={styles.dividerHorizontal} />

            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Total Estimated Price</Text>
                <Text style={styles.totalSublabel}>
                  For {selectedDuration} {selectedDuration === 1 ? 'hour' : 'hours'} reservation
                </Text>
              </View>
              <Text style={styles.totalAmount}>₹{estimatedTotal}</Text>
            </View>
          </View>

          {pricingQuote?.pricingAlert && (
            <View style={styles.alertBanner}>
              <Text style={styles.alertBannerText}>{pricingQuote.pricingAlert}</Text>
            </View>
          )}
        </Card>
      </ScrollView>

      {/* ─── Footer CTA ─── */}
      <View style={styles.footerContainer}>
        <View style={styles.footerTotalCol}>
          <Text style={styles.footerTotalValue}>₹{estimatedTotal}</Text>
          <Text style={styles.footerTotalLabel}>Total for {selectedDuration}h</Text>
        </View>

        <Button
          title="Vehicle Details"
          variant="primary"
          icon={<ArrowRight size={18} color="#171717" />}
          iconPosition="right"
          onPress={onProceed}
          style={styles.continueBtn}
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
  headerInfo: {
    marginBottom: Spacing.lg,
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
  scheduleCard: {
    marginBottom: Spacing.lg,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  scheduleItemLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  scheduleItemValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  dividerVertical: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.xl,
  },
  durationChip: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  durationChipSelected: {
    backgroundColor: Colors.accentYellowLight,
    borderColor: Colors.primaryYellow,
    borderWidth: 2,
  },
  durationNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  durationNumberSelected: {
    color: '#171717',
  },
  durationUnit: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  durationUnitSelected: {
    color: '#171717',
    fontWeight: '700',
  },
  quoteCard: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FEF08A',
    borderWidth: 1.5,
  },
  quoteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  aiTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  quoteDetailsCol: {
    gap: 8,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteRowLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  quoteRowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  quoteRowValueHighlight: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  dividerHorizontal: {
    height: 1,
    backgroundColor: '#FEF08A',
    marginVertical: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  totalSublabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  alertBanner: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255, 201, 40, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  alertBannerText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerTotalCol: {
    marginRight: Spacing.md,
  },
  footerTotalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  footerTotalLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  continueBtn: {
    flex: 1,
    maxWidth: 220,
  },
});
