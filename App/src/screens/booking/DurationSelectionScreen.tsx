import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
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
  Check,
  X,
  Truck,
  Car,
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

const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8, 12, 24];

const POPULAR_TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
];

interface DateOption {
  dateString: string; // 'YYYY-MM-DD'
  dayLabel: string;   // 'TODAY', 'TOMORROW', 'THU'
  dayNumber: string;  // '14'
  monthLabel: string; // 'OCT'
}

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
  const [selectedDate, setSelectedDate] = useState<string>(entryDate || new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>(entryTime || '12:00');
  const [usageType, setUsageType] = useState<'personal' | 'commercial'>('personal');

  // Custom Time Input Modal State
  const [customTimeModalVisible, setCustomTimeModalVisible] = useState<boolean>(false);
  const [customHoursInput, setCustomHoursInput] = useState<string>('12');
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('00');
  const [customAmPm, setCustomAmPm] = useState<'AM' | 'PM'>('PM');

  // Generate next 7 booking dates dynamically
  const dateOptions: DateOption[] = useMemo(() => {
    const list: DateOption[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      let dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      if (i === 0) dayLabel = 'TODAY';
      else if (i === 1) dayLabel = 'TOMORROW';

      list.push({
        dateString,
        dayLabel,
        dayNumber: String(d.getDate()),
        monthLabel: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      });
    }
    return list;
  }, []);

  useEffect(() => {
    setTimeAndDuration(selectedDate, selectedTime, selectedDuration);
    refreshPriceQuote();
  }, [selectedDuration, selectedDate, selectedTime]);

  const handleSelectNowTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(Math.ceil(now.getMinutes() / 15) * 15 % 60).padStart(2, '0');
    setSelectedTime(`${hours}:${minutes}`);
  };

  const handleApplyCustomTime = () => {
    let h = parseInt(customHoursInput, 10);
    if (isNaN(h) || h < 1 || h > 12) h = 12;

    let m = parseInt(customMinutesInput, 10);
    if (isNaN(m) || m < 0 || m > 59) m = 0;

    let hour24 = h;
    if (customAmPm === 'PM' && h < 12) hour24 = h + 12;
    if (customAmPm === 'AM' && h === 12) hour24 = 0;

    const formatted = `${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setSelectedTime(formatted);
    setCustomTimeModalVisible(false);
  };

  const formatDisplayTime = (timeStr: string): string => {
    if (!timeStr) return 'Select Time';
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`;
  };

  const calculatedBaseRate = selectedHub?.hourlyPrice || 60;
  const quoteHourlyPrice = pricingQuote ? pricingQuote.recommendedPrice : calculatedBaseRate;
  const estimatedTotal = quoteHourlyPrice * selectedDuration;

  // Calculate projected departure time
  const departureTime = useMemo(() => {
    if (!selectedTime) return '--:--';
    const [h, m] = selectedTime.split(':').map(Number);
    const endH = (h + selectedDuration) % 24;
    const period = endH >= 12 ? 'PM' : 'AM';
    const hour12 = endH % 12 === 0 ? 12 : endH % 12;
    return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`;
  }, [selectedTime, selectedDuration]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Schedule & Duration"
        subtitle={selectedHub?.parkingName || 'Step 3 of 5'}
        onBack={onBack}
      />

      <StepIndicator currentStep={3} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerInfo}>
          <Text style={styles.heading}>Choose Date, Time & Hours</Text>
          <Text style={styles.subheading}>
            Select your planned parking window. Authoritative rates are dynamically quoted based on demand.
          </Text>
        </View>

        {/* ─── 1. DATE SELECTION ─── */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithIcon}>
            <Calendar size={18} color={Colors.textPrimary} />
            <Text style={styles.sectionTitle}>1. Select Parking Date</Text>
          </View>
          <Text style={styles.selectedDateBadgeText}>
            {selectedDate}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScrollContainer}
        >
          {dateOptions.map((opt) => {
            const isSelected = selectedDate === opt.dateString;
            return (
              <TouchableOpacity
                key={opt.dateString}
                activeOpacity={0.85}
                onPress={() => setSelectedDate(opt.dateString)}
                style={[styles.dateCard, isSelected && styles.dateCardSelected]}
              >
                <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                  {opt.dayLabel}
                </Text>
                <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                  {opt.dayNumber}
                </Text>
                <Text style={[styles.monthLabel, isSelected && styles.monthLabelSelected]}>
                  {opt.monthLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── 2. ARRIVAL TIME SELECTION ─── */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithIcon}>
            <Clock size={18} color={Colors.textPrimary} />
            <Text style={styles.sectionTitle}>2. Select Arrival Time</Text>
          </View>

          <TouchableOpacity
            style={styles.nowBtn}
            onPress={handleSelectNowTime}
            activeOpacity={0.8}
          >
            <Zap size={13} color="#171717" style={{ marginRight: 3 }} />
            <Text style={styles.nowBtnText}>Now</Text>
          </TouchableOpacity>
        </View>

        {/* Popular Time Slots Grid */}
        <View style={styles.timeGrid}>
          {POPULAR_TIME_SLOTS.map((timeStr) => {
            const isSelected = selectedTime === timeStr;
            return (
              <TouchableOpacity
                key={timeStr}
                activeOpacity={0.8}
                onPress={() => setSelectedTime(timeStr)}
                style={[styles.timeChip, isSelected && styles.timeChipSelected]}
              >
                <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                  {formatDisplayTime(timeStr)}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.customTimeChip, customTimeModalVisible && styles.timeChipSelected]}
            onPress={() => setCustomTimeModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.customTimeChipText}>Custom Time ✎</Text>
          </TouchableOpacity>
        </View>

        {/* ─── 3. DURATION SELECTION ─── */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithIcon}>
            <TrendingUp size={18} color={Colors.textPrimary} />
            <Text style={styles.sectionTitle}>3. Parking Duration</Text>
          </View>
          <Text style={styles.selectedHoursBadgeText}>
            {selectedDuration} {selectedDuration === 1 ? 'Hour' : 'Hours'}
          </Text>
        </View>

        <View style={styles.durationGrid}>
          {DURATION_OPTIONS.map((hrs) => {
            const isSelected = selectedDuration === hrs;
            return (
              <TouchableOpacity
                key={hrs}
                activeOpacity={0.85}
                onPress={() => setSelectedDuration(hrs)}
                style={[styles.durationChip, isSelected && styles.durationChipSelected]}
              >
                <Text style={[styles.durationNumber, isSelected && styles.durationNumberSelected]}>
                  {hrs}
                </Text>
                <Text style={[styles.durationUnit, isSelected && styles.durationUnitSelected]}>
                  {hrs === 1 ? 'hr' : 'hrs'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── 4. VEHICLE USAGE TYPE ─── */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithIcon}>
            <Car size={18} color={Colors.textPrimary} />
            <Text style={styles.sectionTitle}>4. Vehicle Usage Type</Text>
          </View>
        </View>

        <View style={styles.usageRow}>
          <TouchableOpacity
            style={[styles.usageChip, usageType === 'personal' && styles.usageChipSelected]}
            onPress={() => setUsageType('personal')}
            activeOpacity={0.85}
          >
            <Car size={16} color={usageType === 'personal' ? '#171717' : Colors.textSecondary} />
            <Text style={[styles.usageChipText, usageType === 'personal' && styles.usageChipTextSelected]}>
              Personal / Family
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.usageChip, usageType === 'commercial' && styles.usageChipSelected]}
            onPress={() => setUsageType('commercial')}
            activeOpacity={0.85}
          >
            <Truck size={16} color={usageType === 'commercial' ? '#171717' : Colors.textSecondary} />
            <Text style={[styles.usageChipText, usageType === 'commercial' && styles.usageChipTextSelected]}>
              Commercial
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── LIVE SCHEDULE & PRICING BREAKDOWN ─── */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.aiBadge}>
              <Sparkles size={14} color="#B45309" />
              <Text style={styles.aiBadgeText}>LIVE SCHEDULE QUOTE</Text>
            </View>

            {isCalculatingPrice ? (
              <ActivityIndicator size="small" color={Colors.primaryYellow} />
            ) : pricingQuote?.isSurgeActive ? (
              <Badge label="Surge Active" variant="surge" />
            ) : (
              <Badge label="Confirmed Slot" variant="available" />
            )}
          </View>

          <View style={styles.scheduleSummaryBox}>
            <View style={styles.summaryItemCol}>
              <Text style={styles.summaryItemLabel}>ARRIVAL</Text>
              <Text style={styles.summaryItemVal}>{selectedDate}</Text>
              <Text style={styles.summaryItemSub}>{formatDisplayTime(selectedTime)}</Text>
            </View>

            <View style={styles.summaryArrowWrap}>
              <ArrowRight size={16} color={Colors.textSecondary} />
            </View>

            <View style={styles.summaryItemCol}>
              <Text style={styles.summaryItemLabel}>DEPARTURE</Text>
              <Text style={styles.summaryItemVal}>{selectedDuration}h Duration</Text>
              <Text style={styles.summaryItemSub}>Around {departureTime}</Text>
            </View>
          </View>

          <View style={styles.priceBreakdownCol}>
            <View style={styles.priceRow}>
              <Text style={styles.priceRowLabel}>Quoted Hourly Rate</Text>
              <Text style={styles.priceRowVal}>₹{quoteHourlyPrice}/hr</Text>
            </View>

            <View style={styles.dividerHorizontal} />

            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalMainLabel}>Total Estimated Cost</Text>
                <Text style={styles.totalSub}>
                  {selectedDuration}h parking at {selectedFloor?.floorName ? `Floor ${selectedFloor.floorName}` : 'Designated Floor'}
                </Text>
              </View>
              <Text style={styles.totalPriceText}>₹{estimatedTotal}</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* ─── Footer Action ─── */}
      <View style={styles.footerContainer}>
        <View style={styles.footerTotalCol}>
          <Text style={styles.footerTotalValue}>₹{estimatedTotal}</Text>
          <Text style={styles.footerTotalLabel}>
            {selectedDate} • {formatDisplayTime(selectedTime)}
          </Text>
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

      {/* ─── Custom Time Modal ─── */}
      <Modal
        visible={customTimeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCustomTimeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Specific Arrival Time</Text>
              <TouchableOpacity onPress={() => setCustomTimeModalVisible(false)}>
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Specify your arrival hour and minute:
            </Text>

            <View style={styles.timeInputRow}>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>HOUR (1-12)</Text>
                <TextInput
                  style={styles.numericInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={customHoursInput}
                  onChangeText={setCustomHoursInput}
                />
              </View>

              <Text style={styles.timeColon}>:</Text>

              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>MIN (00-59)</Text>
                <TextInput
                  style={styles.numericInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={customMinutesInput}
                  onChangeText={setCustomMinutesInput}
                />
              </View>

              <View style={styles.amPmCol}>
                <TouchableOpacity
                  style={[styles.amPmBtn, customAmPm === 'AM' && styles.amPmBtnSelected]}
                  onPress={() => setCustomAmPm('AM')}
                >
                  <Text style={[styles.amPmText, customAmPm === 'AM' && styles.amPmTextSelected]}>
                    AM
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.amPmBtn, customAmPm === 'PM' && styles.amPmBtnSelected]}
                  onPress={() => setCustomAmPm('PM')}
                >
                  <Text style={[styles.amPmText, customAmPm === 'PM' && styles.amPmTextSelected]}>
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title="Apply Arrival Time"
              variant="primary"
              onPress={handleApplyCustomTime}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  selectedDateBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryYellow,
    backgroundColor: '#171717',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  selectedHoursBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    backgroundColor: '#FFF9E6',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  nowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryYellow,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  nowBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171717',
  },
  dateScrollContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 6,
    marginBottom: Spacing.md,
  },
  dateCard: {
    width: 66,
    height: 84,
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dateCardSelected: {
    backgroundColor: '#FFFDF0',
    borderColor: Colors.primaryYellow,
    borderWidth: 2,
    elevation: 2,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  dayLabelSelected: {
    color: '#171717',
    fontWeight: '800',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  dayNumberSelected: {
    color: '#171717',
  },
  monthLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  monthLabelSelected: {
    color: '#171717',
    fontWeight: '800',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  timeChip: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
  },
  timeChipSelected: {
    backgroundColor: Colors.primaryYellow,
    borderColor: Colors.primaryYellow,
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  timeChipTextSelected: {
    color: '#171717',
    fontWeight: '800',
  },
  customTimeChip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  customTimeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  durationChip: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  durationChipSelected: {
    backgroundColor: '#FFFDF0',
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
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  durationUnitSelected: {
    color: '#171717',
  },
  usageRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  usageChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
  },
  usageChipSelected: {
    backgroundColor: '#FFFDF0',
    borderColor: Colors.primaryYellow,
    borderWidth: 2,
  },
  usageChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  usageChipTextSelected: {
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: '#FFFDF5',
    borderColor: Colors.primaryYellow,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  scheduleSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  summaryItemCol: {
    flex: 1,
  },
  summaryItemLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryItemVal: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  summaryItemSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  summaryArrowWrap: {
    paddingHorizontal: 8,
  },
  priceBreakdownCol: {
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceRowLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  priceRowVal: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  dividerHorizontal: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalMainLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  totalSub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  totalPriceText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerTotalCol: {
    flex: 1,
  },
  footerTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  footerTotalLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  continueBtn: {
    minWidth: 160,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inputCol: {
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  numericInput: {
    width: 64,
    height: 52,
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  timeColon: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 14,
  },
  amPmCol: {
    flexDirection: 'column',
    gap: 6,
    marginTop: 14,
  },
  amPmBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  amPmBtnSelected: {
    backgroundColor: Colors.primaryYellow,
    borderColor: Colors.primaryYellow,
  },
  amPmText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  amPmTextSelected: {
    color: '#171717',
  },
});
