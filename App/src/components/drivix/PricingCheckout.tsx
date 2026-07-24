import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ChevronLeft, Clock, Car, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

interface PricingCheckoutProps {
  selectedSlot: any;
  selectedLocation: any;
  pricing: any;
  timer: number;
  user: any;
  duration: string;
  setDuration: (val: string) => void;
  vehicleNumber: string;
  setVehicleNumber: (val: string) => void;
  vehicleName: string;
  setVehicleName: (val: string) => void;
  loading: boolean;
  onConfirm: (paymentOption: 'PAY_NOW' | 'PAY_AFTER_CHECKOUT', additionalServices: string[]) => Promise<void>;
  onRelease: () => void;
  userVehicles?: any[];
}

export default function PricingCheckout({
  selectedSlot,
  selectedLocation,
  pricing,
  timer,
  user,
  duration,
  setDuration,
  vehicleNumber,
  setVehicleNumber,
  vehicleName,
  setVehicleName,
  loading,
  onConfirm,
  onRelease,
  userVehicles = [],
}: PricingCheckoutProps) {
  const [paymentOption, setPaymentOption] = useState<'PAY_NOW' | 'PAY_AFTER_CHECKOUT'>('PAY_NOW');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const colors = useTheme();

  const SERVICE_PRICES = {
    'Rest Area': 150,
    'EV Charging': 250,
    'Car Wash': 300,
    'Food & Beverages': 200,
  };

  const basePrice = pricing ? pricing.basePrice * Number(duration || 1) : 0;
  const servicesCost = selectedServices.reduce((sum, srv) => sum + (SERVICE_PRICES[srv as keyof typeof SERVICE_PRICES] || 0), 0);
  const totalAmount = (pricing ? pricing.finalPrice * Number(duration || 1) : 0) + servicesCost;
  const isSurge = pricing ? pricing.surgeMultiplier > 1 : false;
  const walletBalance = user?.walletBalance || 0;
  const insufficientBalance = paymentOption === 'PAY_NOW' && walletBalance < totalAmount;

  const handleSubmit = () => {
    if (!vehicleNumber.trim()) {
      Alert.alert('Details Missing', 'Please enter your vehicle plate number.');
      return;
    }
    if (!vehicleName.trim()) {
      Alert.alert('Details Missing', 'Please enter your vehicle model/name.');
      return;
    }
    if (insufficientBalance) {
      Alert.alert('Insufficient Balance', 'Please reload your wallet from the profile tab.');
      return;
    }

    onConfirm(paymentOption, selectedServices);
  };

  return (
    <View style={[styles.flexContainer, { backgroundColor: colors.background }]}>
      {/* Sub Header */}
      <View style={styles.subHeader}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]} onPress={onRelease}>
          <ChevronLeft size={20} color="#ffce00" />
        </TouchableOpacity>
        <View style={styles.subHeaderTitles}>
          <Text style={[styles.subHeaderTitle, { color: colors.text }]}>Checkout Booking</Text>
          <Text style={[styles.subHeaderSubtitle, { color: colors.textSecondary }]}>Confirm slot & pricing details</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Soft-lock countdown badge */}
        <View style={styles.timerBadge}>
          <Clock size={16} color="#ffce00" />
          <Text style={styles.timerText}>
            Reservation expires in: {Math.floor(timer / 60)}:
            {String(timer % 60).padStart(2, '0')}
          </Text>
        </View>

        {/* Selected Spot Detail */}
        <View style={[styles.summaryCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>LOCATION</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{selectedLocation.parkingName}</Text>
            </View>
            <View style={styles.spotIndicator}>
              <Text style={styles.spotIndicatorLabel}>SLOT</Text>
              <Text style={styles.spotIndicatorVal}>{selectedSlot?.label || selectedSlot?.number}</Text>
            </View>
          </View>
        </View>

        {/* Form Inputs */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Booking Details</Text>
        <View style={styles.formSection}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Expected Duration (hours)</Text>
          <View style={styles.formRow}>
            <Clock size={18} color={colors.textSecondary} style={styles.rowIcon} />
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass, color: colors.text }]}
              placeholder="e.g. 2"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={duration}
              onChangeText={(val) => setDuration(val.replace(/[^0-9]/g, ''))}
            />
            <Text style={[styles.unitText, { color: colors.text }]}>Hours</Text>
          </View>

          {/* Registered Vehicle Selector Slider */}
          {userVehicles && userVehicles.length > 0 && (
            <View style={styles.vehicleSelectorWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 8 }]}>
                Select from Registered Vehicles
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleScroll}>
                {userVehicles.map((veh) => {
                  const isSelected = vehicleNumber.trim().toUpperCase() === veh.plate.trim().toUpperCase();
                  return (
                    <TouchableOpacity
                      key={veh._id || veh.id}
                      style={[
                        styles.vehicleSelectItem,
                        { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass },
                        isSelected && { borderColor: '#ffce00', backgroundColor: 'rgba(255, 206, 0, 0.05)' }
                      ]}
                      onPress={() => {
                        setVehicleNumber(veh.plate);
                        setVehicleName(veh.model);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.vehicleSelectHeader}>
                        <Text style={[styles.vehicleSelectPlate, { color: isSelected ? '#ffce00' : colors.text }]}>
                          {veh.plate}
                        </Text>
                        {veh.isPrimary && (
                          <View style={styles.miniPrimaryBadge}>
                            <Text style={styles.miniPrimaryBadgeText}>PRIMARY</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.vehicleSelectModel, { color: colors.textSecondary }]}>
                        {veh.model}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                
                <TouchableOpacity
                  style={[
                    styles.vehicleSelectItem,
                    { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }
                  ]}
                  onPress={() => {
                    setVehicleNumber('');
                    setVehicleName('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.vehicleSelectPlate, { color: colors.text, fontStyle: 'italic' }]}>
                    New Vehicle
                  </Text>
                  <Text style={[styles.vehicleSelectModel, { color: colors.textSecondary }]}>
                    Type manually below
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Vehicle Number Plate</Text>
          <View style={styles.formRow}>
            <Car size={18} color={colors.textSecondary} style={styles.rowIcon} />
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass, color: colors.text }]}
              placeholder="e.g. DL 3C AY 4321"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
            />
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Vehicle Name / Model</Text>
          <View style={styles.formRow}>
            <Car size={18} color={colors.textSecondary} style={styles.rowIcon} />
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass, color: colors.text }]}
              placeholder="e.g. Honda City"
              placeholderTextColor={colors.textSecondary}
              value={vehicleName}
              onChangeText={setVehicleName}
            />
          </View>
        </View>

        {/* Optional Services Selection */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Optional Services</Text>
        <View style={styles.formSection}>
          {[
            { name: 'Rest Area', price: 150, desc: 'Access to premium waiting lounge with Wi-Fi & refreshments', icon: '🛋️' },
            { name: 'EV Charging', price: 250, desc: 'High-speed EV charging slot setup', icon: '⚡' },
            { name: 'Car Wash', price: 300, desc: 'Full exterior foam wash & internal vacuuming', icon: '🧼' },
            { name: 'Food & Beverages', price: 200, desc: 'Pre-ordered snack & beverage package delivered to car', icon: '🍔' }
          ].map((srv) => {
            const isChecked = selectedServices.includes(srv.name);
            return (
              <TouchableOpacity
                key={srv.name}
                style={[
                  styles.serviceCheckItem,
                  { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass },
                  isChecked && styles.serviceCheckItemActive
                ]}
                onPress={() => {
                  if (isChecked) {
                    setSelectedServices(selectedServices.filter(s => s !== srv.name));
                  } else {
                    setSelectedServices([...selectedServices, srv.name]);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.serviceCheckIconCircle, { backgroundColor: isChecked ? 'rgba(255, 206, 0, 0.15)' : 'rgba(255,255,255,0.05)' }]}>
                  <Text style={{ fontSize: 18 }}>{srv.icon}</Text>
                </View>
                <View style={styles.serviceCheckDetails}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.serviceCheckTitle, { color: colors.text }]}>{srv.name}</Text>
                    <Text style={styles.serviceCheckPrice}>+Rs. {srv.price}</Text>
                  </View>
                  <Text style={[styles.serviceCheckSubtitle, { color: colors.textSecondary }]}>{srv.desc}</Text>
                </View>
                <View style={[
                  styles.checkboxBox,
                  { borderColor: isChecked ? '#ffce00' : 'rgba(255,255,255,0.3)' },
                  isChecked && { backgroundColor: '#ffce00' }
                ]}>
                  {isChecked && <Text style={{ color: '#0b0c10', fontSize: 10, fontWeight: 'bold' }}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Pricing Calculator */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Fare breakdown</Text>
        <View style={[styles.pricingCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <View style={styles.pricingHeader}>
            <Text style={[styles.pricingTitle, { color: colors.text }]}>Smart dynamic rate</Text>
            {isSurge && (
              <View style={styles.surgeBadge}>
                <Text style={styles.surgeBadgeText}>🚀 SURGE RATE ACTIVE</Text>
              </View>
            )}
          </View>

          <View style={styles.pricingRow}>
            <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>Base Fare ({duration} hrs)</Text>
            <Text style={[styles.pricingVal, { color: colors.text }]}>Rs. {basePrice}</Text>
          </View>

          <View style={styles.pricingRow}>
            <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>AI Dynamic Pricing Multiplier</Text>
            <Text style={[styles.pricingVal, { color: colors.text }, isSurge && { color: '#ffce00' }]}>
              {pricing ? pricing.surgeMultiplier : 1.0}x
            </Text>
          </View>

          {servicesCost > 0 && (
            <View style={styles.pricingRow}>
              <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>Additional Services</Text>
              <Text style={[styles.pricingVal, { color: '#ffce00' }]}>
                +Rs. {servicesCost}
              </Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.borderGlass }]} />

          <View style={styles.pricingRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Grand Total</Text>
            <Text style={[styles.totalVal, { color: colors.primary }]}>Rs. {totalAmount}</Text>
          </View>
        </View>

        {/* Payment Options Selection */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Select Billing Method</Text>
        <View style={styles.formSection}>
          <TouchableOpacity
            style={[styles.radioItem, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }, paymentOption === 'PAY_NOW' && styles.radioItemActive]}
            onPress={() => setPaymentOption('PAY_NOW')}
          >
            <View style={[styles.radioCircle, paymentOption === 'PAY_NOW' && styles.radioCircleActive]} />
            <View style={styles.radioDetails}>
              <Text style={[styles.radioTitle, { color: colors.text }]}>Pay Now (Pre-book Wallet Debit)</Text>
              <Text style={[styles.radioSubtitle, { color: colors.textSecondary }]}>Deduct Rs. {totalAmount} instantly from balance.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.radioItem, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }, paymentOption === 'PAY_AFTER_CHECKOUT' && styles.radioItemActive]}
            onPress={() => setPaymentOption('PAY_AFTER_CHECKOUT')}
          >
            <View style={[styles.radioCircle, paymentOption === 'PAY_AFTER_CHECKOUT' && styles.radioCircleActive]} />
            <View style={styles.radioDetails}>
              <Text style={[styles.radioTitle, { color: colors.text }]}>Pay Later (At ANPR Gate Exit)</Text>
              <Text style={[styles.radioSubtitle, { color: colors.textSecondary }]}>Verify details on exit & debit wallet then.</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Wallet Balance Alerts */}
        <View style={[styles.walletAlert, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}>
          <ShieldCheck size={16} color="#ffce00" />
          <Text style={[styles.walletAlertText, { color: colors.text }]}>Your wallet balance: Rs. {walletBalance}</Text>
        </View>

        {insufficientBalance && (
          <View style={styles.balanceError}>
            <AlertCircle size={16} color="#ff4b4b" />
            <Text style={styles.balanceErrorText}>Insufficient balance. Please reload.</Text>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.confirmBtn, insufficientBalance && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={loading || insufficientBalance}
        >
          {loading ? (
            <ActivityIndicator color="#0b0c10" size="small" />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm and Book</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  vehicleSelectorWrapper: {
    marginBottom: 16,
    marginTop: 8,
  },
  vehicleScroll: {
    gap: 8,
    paddingRight: 10,
  },
  vehicleSelectItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 140,
    justifyContent: 'center',
  },
  vehicleSelectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  vehicleSelectPlate: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  vehicleSelectModel: {
    fontSize: 11,
    marginTop: 2,
  },
  miniPrimaryBadge: {
    backgroundColor: '#ffce00',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniPrimaryBadgeText: {
    color: '#0b0c10',
    fontSize: 7,
    fontWeight: 'bold',
  },
  flexContainer: {
    flex: 1,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
    backgroundColor: '#15161e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  subHeaderTitles: {
    flex: 1,
  },
  subHeaderTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subHeaderSubtitle: {
    color: '#a0aab2',
    fontSize: 13,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 206, 0, 0.05)',
    borderColor: 'rgba(255, 206, 0, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    marginVertical: 10,
    gap: 8,
  },
  timerText: {
    color: '#ffce00',
    fontSize: 13,
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: '#15161e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#a0aab2',
    fontSize: 10,
    letterSpacing: 1,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  spotIndicator: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 242, 255, 0.05)',
    borderColor: '#00f2ff',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  spotIndicatorLabel: {
    color: '#00f2ff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  spotIndicatorVal: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  sectionHeader: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  formSection: {
    backgroundColor: 'rgba(21, 22, 30, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    marginBottom: 16,
  },
  inputLabel: {
    color: '#a0aab2',
    fontSize: 12,
    marginBottom: 6,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 4,
    height: 52,
    marginBottom: 16,
  },
  rowIcon: {
    marginRight: 12,
  },
  formInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    height: '100%',
  },
  unitText: {
    color: '#a0aab2',
    fontSize: 13,
    marginLeft: 8,
  },
  pricingCard: {
    backgroundColor: 'rgba(21, 22, 30, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 206, 0, 0.2)',
    padding: 16,
    marginBottom: 20,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pricingTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  surgeBadge: {
    backgroundColor: 'rgba(255, 75, 75, 0.1)',
    borderColor: 'rgba(255, 75, 75, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  surgeBadgeText: {
    color: '#ff4b4b',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pricingLabel: {
    color: '#a0aab2',
    fontSize: 13,
  },
  pricingVal: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
  },
  totalLabel: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  totalVal: {
    color: '#ffce00',
    fontWeight: 'bold',
    fontSize: 18,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  radioItemActive: {
    borderColor: '#ffce00',
    backgroundColor: 'rgba(255, 206, 0, 0.03)',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#a0aab2',
    marginRight: 12,
  },
  radioCircleActive: {
    borderColor: '#ffce00',
    backgroundColor: '#ffce00',
  },
  radioDetails: {
    flex: 1,
  },
  radioTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  radioSubtitle: {
    color: '#a0aab2',
    fontSize: 12,
    marginTop: 2,
  },
  walletAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 12,
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
  },
  walletAlertText: {
    color: '#a0aab2',
    fontSize: 12,
  },
  balanceError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(255, 75, 75, 0.05)',
    padding: 12,
    borderRadius: 12,
    borderColor: 'rgba(255, 75, 75, 0.15)',
    borderWidth: 1,
  },
  balanceErrorText: {
    color: '#ff4b4b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  confirmBtn: {
    backgroundColor: '#ffce00',
    height: 52,
    borderRadius: 24, // rounded-xl from Aura Kinetic
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#ffce00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmBtnText: {
    color: '#0b0c10',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  disabledBtn: {
    backgroundColor: 'rgba(255, 206, 0, 0.25)',
  },
  serviceCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  serviceCheckItemActive: {
    borderColor: '#ffce00',
    backgroundColor: 'rgba(255, 206, 0, 0.03)',
  },
  serviceCheckIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceCheckDetails: {
    flex: 1,
  },
  serviceCheckTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  serviceCheckPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffce00',
  },
  serviceCheckSubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});
