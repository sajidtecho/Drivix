import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { 
  Zap, 
  Car, 
  CreditCard, 
  MapPin, 
  History, 
  Settings, 
  ArrowRight, 
  Plus, 
  ShieldCheck, 
  AlertTriangle,
  RefreshCw,
  TrendingUp
} from 'lucide-react-native';
import { api } from '@/services/api';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/AuthContext';

export default function FASTagTab() {
  const { user, refreshProfile } = useAuth();
  const colors = useTheme();

  // Primary lists
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [fastags, setFastags] = useState<any[]>([]);
  const [selectedTag, setSelectedTag] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [estimateLoading, setEstimateLoading] = useState(false);

  // Link Form Fields
  const [linkVehicleId, setLinkVehicleId] = useState('');
  const [linkBank, setLinkBank] = useState('ICICI');
  const [linkTagId, setLinkTagId] = useState('');

  // Recharge Form
  const [rechargePreset, setRechargePreset] = useState('');
  const [rechargeCustom, setRechargeCustom] = useState('');

  // Toll Estimator
  const [estSource, setEstSource] = useState('');
  const [estDestination, setEstDestination] = useState('');
  const [tollEstimation, setTollEstimation] = useState<any>(null);

  // Auto Recharge Settings
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoThreshold, setAutoThreshold] = useState('200');
  const [autoAmount, setAutoAmount] = useState('500');
  const [savingSettings, setSavingSettings] = useState(false);

  const bankOptions = ['ICICI', 'HDFC', 'Axis', 'SBI', 'Paytm', 'Airtel'];

  const getBankColor = (bankName: string) => {
    switch (bankName) {
      case 'ICICI': return '#003366'; // Navy
      case 'HDFC': return '#1c3f94';  // Blue
      case 'Axis': return '#861b36';  // Burgundy
      case 'SBI': return '#00a3e0';   // Light Blue
      case 'Paytm': return '#00baf2'; // Cyan
      case 'Airtel': return '#e31837'; // Red
      default: return '#1b1d25';
    }
  };

  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      // 1. Fetch user vehicles
      const resVehicles = await api.get('/vehicles');
      setVehicles(resVehicles.data || []);

      // 2. Fetch linked tags
      const resTags = await api.get('/fastags');
      const tagList = resTags.data || [];
      setFastags(tagList);

      // Select active tag
      if (tagList.length > 0) {
        // Keep selection if exists, else pick first
        const current = selectedTag 
          ? tagList.find((t: any) => t._id === selectedTag._id) || tagList[0]
          : tagList[0];
        setSelectedTag(current);
        
        // Load settings
        setAutoEnabled(current.autoRechargeEnabled);
        setAutoThreshold(String(current.thresholdLimit || 200));
        setAutoAmount(String(current.autoRechargeAmount || 500));

        // Load transaction history
        fetchTransactions(current._id);
      } else {
        setSelectedTag(null);
        // Autofill vehicle linkage form if vehicles exist
        if (resVehicles.data && resVehicles.data.length > 0) {
          setLinkVehicleId(resVehicles.data[0]._id || resVehicles.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading FASTag data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (tagId: string) => {
    setHistoryLoading(true);
    try {
      const res = await api.get(`/fastags/${tagId}/transactions`);
      setTransactions(res.data || []);
    } catch (err) {
      console.warn('Error fetching transactions:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLinkTag = async () => {
    if (!linkVehicleId || !linkBank) {
      Alert.alert('Fields Required', 'Please select a vehicle and a issuing bank.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post('/fastags', {
        vehicleId: linkVehicleId,
        bank: linkBank,
        tagId: linkTagId.trim() || undefined
      });
      if (res.data) {
        Alert.alert('FASTag Registered', `Your FASTag with balance Rs. ${res.data.balance} is successfully active.`);
        setLinkTagId('');
        await fetchData(true);
      }
    } catch (err: any) {
      console.error('Error linking FASTag:', err);
      const msg = err.response?.data?.message || 'Failed to link FASTag.';
      Alert.alert('Linkage Failed', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecharge = async () => {
    if (!selectedTag) return;
    const amount = Number(rechargePreset || rechargeCustom);

    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please select or enter a valid amount.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post(`/fastags/${selectedTag._id}/recharge`, { amount });
      if (res.data) {
        Alert.alert('Recharge Successful!', `Rs. ${amount} added to FASTag ${selectedTag.vehicleNumber}.`);
        setRechargePreset('');
        setRechargeCustom('');
        await refreshProfile(); // Refresh Drivix wallet balance
        await fetchData(false); // Silent reload tag balance
      }
    } catch (err: any) {
      console.error('Recharge failed:', err);
      const msg = err.response?.data?.message || 'Failed to complete recharge.';
      Alert.alert('Recharge Failed', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEstimateToll = async () => {
    if (!estSource.trim() || !estDestination.trim()) {
      Alert.alert('Locations Required', 'Please enter both source and destination.');
      return;
    }

    setEstimateLoading(true);
    setTollEstimation(null);
    try {
      const res = await api.post('/fastags/estimate', {
        source: estSource.trim(),
        destination: estDestination.trim()
      });
      setTollEstimation(res.data);
    } catch (err: any) {
      console.error('Estimation error:', err);
      Alert.alert('Estimation Failed', 'Could not compute toll estimation.');
    } finally {
      setEstimateLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedTag) return;

    setSavingSettings(true);
    try {
      const res = await api.put(`/fastags/${selectedTag._id}/auto-recharge`, {
        autoRechargeEnabled: autoEnabled,
        thresholdLimit: Number(autoThreshold),
        autoRechargeAmount: Number(autoAmount)
      });
      if (res.data) {
        Alert.alert('Settings Saved', 'Your FASTag auto-recharge settings have been updated.');
        await fetchData(false);
      }
    } catch (err: any) {
      console.error('Error saving settings:', err);
      Alert.alert('Update Failed', 'Failed to update auto recharge parameters.');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ffce00" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading FASTag Vault...</Text>
      </View>
    );
  }

  // ──── CASE 1: NO LINKED TAGS YET ────
  if (fastags.length === 0) {
    // Filter out vehicles that already have tags linked
    const unlinkedVehicles = vehicles; 

    return (
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <View style={styles.activationHeader}>
            <Zap size={32} color="#ffce00" />
            <Text style={[styles.cardTitle, { color: colors.text, marginTop: 12 }]}>Activate FASTag Manager</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              Monitor real-time balances, estimate toll highway fees, and set up automatic reminders across your vehicles.
            </Text>
          </View>

          {unlinkedVehicles.length === 0 ? (
            <View style={styles.warningBox}>
              <AlertTriangle size={18} color="#ff6b35" />
              <Text style={styles.warningText}>
                Please register a vehicle in your Drivix Profile (Garage section) before activating a FASTag.
              </Text>
              <TouchableOpacity 
                style={styles.registerVehicleBtn}
                onPress={() => Alert.alert('Add Vehicle', 'Go to the Vehicles tab in Explore section to register your vehicle number.')}
              >
                <Text style={styles.registerVehicleBtnText}>Register Vehicle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Select Registered Vehicle</Text>
              <View style={[styles.dropdownContainer, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}>
                <Car size={16} color={colors.textSecondary} style={styles.dropdownIcon} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollSelector}>
                  {unlinkedVehicles.map((v) => (
                    <TouchableOpacity
                      key={v._id || v.id}
                      style={[
                        styles.selectorBtn,
                        linkVehicleId === (v._id || v.id) && styles.selectorBtnActive,
                      ]}
                      onPress={() => setLinkVehicleId(v._id || v.id)}
                    >
                      <Text style={[styles.selectorBtnText, { color: colors.text }, linkVehicleId === (v._id || v.id) && styles.selectorBtnTextActive]}>
                        {v.plate || v.vehicleNumber} ({v.model})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>Select Issuing Bank</Text>
              <View style={styles.bankGrid}>
                {bankOptions.map((bank) => (
                  <TouchableOpacity
                    key={bank}
                    style={[
                      styles.bankBtn,
                      { borderColor: colors.borderGlass, backgroundColor: colors.backgroundSelected },
                      linkBank === bank && { borderColor: getBankColor(bank), borderWidth: 2 }
                    ]}
                    onPress={() => setLinkBank(bank)}
                  >
                    <View style={[styles.bankMarker, { backgroundColor: getBankColor(bank) }]} />
                    <Text style={[styles.bankBtnText, { color: colors.text }]}>{bank}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>FASTag Wallet ID (Optional)</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.borderGlass, backgroundColor: colors.backgroundSelected }]}
                placeholder="e.g. FT987654321"
                placeholderTextColor={colors.textSecondary}
                value={linkTagId}
                onChangeText={setLinkTagId}
              />

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleLinkTag}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#0b0c10" size="small" />
                ) : (
                  <>
                    <Plus size={16} color="#0b0c10" />
                    <Text style={styles.submitBtnText}>Link & Activate Tag</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  // ──── CASE 2: ACTIVE FASTAG DASHBOARD ────
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      
      {/* ── Multi-vehicle Selector dropdown ── */}
      {fastags.length > 1 && (
        <View style={styles.tagSelectorWrapper}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Switch Active Tag</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
            {fastags.map((tag) => (
              <TouchableOpacity
                key={tag._id}
                style={[
                  styles.selectorChip,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass },
                  selectedTag?._id === tag._id && { borderColor: colors.primary, backgroundColor: 'rgba(255, 206, 0, 0.04)' }
                ]}
                onPress={() => {
                  setSelectedTag(tag);
                  setAutoEnabled(tag.autoRechargeEnabled);
                  setAutoThreshold(String(tag.thresholdLimit || 200));
                  setAutoAmount(String(tag.autoRechargeAmount || 500));
                  fetchTransactions(tag._id);
                }}
              >
                <Car size={13} color={selectedTag?._id === tag._id ? colors.primary : colors.textSecondary} />
                <Text style={[styles.selectorChipText, { color: colors.text }, selectedTag?._id === tag._id && { color: colors.primary, fontWeight: 'bold' }]}>
                  {tag.vehicleNumber}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── FASTag Visual Card Mockup ── */}
      {selectedTag && (
        <View style={[styles.fastagCardMock, { backgroundColor: getBankColor(selectedTag.bank) }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardBankName}>{selectedTag.bank} FASTAG</Text>
              <Text style={styles.cardTagId}>ID: {selectedTag.tagId}</Text>
            </View>
            <View style={[styles.statusBadge, selectedTag.status === 'Active' ? styles.statusActive : styles.statusWarning]}>
              <Text style={styles.statusText}>{selectedTag.status.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardPlateNumber}>{selectedTag.vehicleNumber}</Text>
            <View style={styles.cardBalanceWrapper}>
              <Text style={styles.cardBalanceLabel}>Available Balance</Text>
              <Text style={styles.cardBalanceAmount}>₹{selectedTag.balance}</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Simulated Wallet Recharge Flow ── */}
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
        <View style={styles.cardSectionHeader}>
          <CreditCard size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Recharge</Text>
        </View>
        <Text style={[styles.cardLabelText, { color: colors.textSecondary }]}>Select Preset Amount</Text>
        <View style={styles.presetsRow}>
          {['200', '500', '1000'].map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[
                styles.presetBtn,
                { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass },
                rechargePreset === amt && styles.activePresetBtn,
              ]}
              onPress={() => {
                setRechargePreset(amt);
                setRechargeCustom('');
              }}
            >
              <Text style={[styles.presetText, { color: colors.text }, rechargePreset === amt && styles.activePresetText]}>
                ₹{amt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.cardLabelText, { color: colors.textSecondary, marginTop: 12 }]}>Or Custom Amount</Text>
        <View style={styles.customInputRow}>
          <TextInput
            style={[styles.customInput, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass, color: colors.text }]}
            placeholder="Rs."
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={rechargeCustom}
            onChangeText={(val) => {
              setRechargeCustom(val);
              setRechargePreset('');
            }}
          />
          <TouchableOpacity
            style={[styles.rechargeBtn, { backgroundColor: colors.primary }]}
            onPress={handleRecharge}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#0b0c10" size="small" />
            ) : (
              <Text style={styles.rechargeBtnText}>Recharge</Text>
            )}
          </TouchableOpacity>
        </View>
        <Text style={[styles.miniNote, { color: colors.textSecondary }]}>
          Charges will be debited from Drivix Wallet. Balance: Rs. {user?.walletBalance ?? 0}
        </Text>
      </View>

      {/* ── Toll Cost Planner & Route Estimator ── */}
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
        <View style={styles.cardSectionHeader}>
          <TrendingUp size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Highway Toll Cost Planner</Text>
        </View>
        <Text style={[styles.miniDesc, { color: colors.textSecondary }]}>
          Planning a highway trip? Enter your destinations to estimate toll costs and tag viability.
        </Text>
        <View style={styles.estimateInputContainer}>
          <TextInput
            style={[styles.estInput, { color: colors.text, borderColor: colors.borderGlass, backgroundColor: colors.backgroundSelected }]}
            placeholder="Starting Point (e.g. Noida)"
            placeholderTextColor={colors.textSecondary}
            value={estSource}
            onChangeText={setEstSource}
          />
          <TextInput
            style={[styles.estInput, { color: colors.text, borderColor: colors.borderGlass, backgroundColor: colors.backgroundSelected, marginTop: 8 }]}
            placeholder="Destination Plaza (e.g. Agra)"
            placeholderTextColor={colors.textSecondary}
            value={estDestination}
            onChangeText={setEstDestination}
          />
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary, marginTop: 12 }]}
            onPress={handleEstimateToll}
            disabled={estimateLoading}
          >
            {estimateLoading ? (
              <ActivityIndicator color="#0b0c10" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Calculate Toll Cost</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Toll Estimation Results */}
        {tollEstimation && selectedTag && (
          <View style={[styles.resultsCard, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}>
            <View style={styles.resultHeader}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>Estimation Summary</Text>
              <Text style={[styles.resultDistance, { color: colors.textSecondary }]}>{tollEstimation.distance} km</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Estimated Toll Cost:</Text>
              <Text style={[styles.resultValue, { color: colors.primary }]}>₹{tollEstimation.estimatedToll}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Current Tag Balance:</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>₹{selectedTag.balance}</Text>
            </View>

            <View style={styles.resultSeparator} />

            {selectedTag.balance < tollEstimation.estimatedToll ? (
              <View style={styles.warningStatusRow}>
                <AlertTriangle size={16} color="#ff6b35" />
                <Text style={[styles.statusAlertText, { color: '#ff6b35' }]}>
                  Recharge recommended. Tag balance is low for this route.
                </Text>
              </View>
            ) : (
              <View style={styles.warningStatusRow}>
                <ShieldCheck size={16} color="#00cc6a" />
                <Text style={[styles.statusAlertText, { color: '#00cc6a' }]}>
                  Tag Balance is sufficient for this trip!
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── Auto Recharge Configuration ── */}
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
        <View style={styles.cardSectionHeader}>
          <Settings size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Auto-Recharge Settings</Text>
        </View>
        <View style={styles.settingsSwitchRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchTitle, { color: colors.text }]}>Enable Auto Recharge Alert</Text>
            <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>
              Deduct funds from Drivix wallet automatically when balance drops below threshold.
            </Text>
          </View>
          <Switch
            value={autoEnabled}
            onValueChange={setAutoEnabled}
            trackColor={{ false: '#2c2d35', true: '#ffce00' }}
            thumbColor={autoEnabled ? '#0b0c10' : '#8b8e96'}
          />
        </View>

        {autoEnabled && (
          <View style={styles.settingsFieldsContainer}>
            <View style={styles.fieldRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Minimum Threshold</Text>
                <TextInput
                  style={[styles.settingsInput, { color: colors.text, borderColor: colors.borderGlass, backgroundColor: colors.backgroundSelected }]}
                  keyboardType="numeric"
                  value={autoThreshold}
                  onChangeText={setAutoThreshold}
                />
              </View>
              <View style={{ width: 16 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Auto-Recharge Amount</Text>
                <TextInput
                  style={[styles.settingsInput, { color: colors.text, borderColor: colors.borderGlass, backgroundColor: colors.backgroundSelected }]}
                  keyboardType="numeric"
                  value={autoAmount}
                  onChangeText={setAutoAmount}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSaveSettings}
              disabled={savingSettings}
            >
              {savingSettings ? (
                <ActivityIndicator color="#0b0c10" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Auto Recharge Settings</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Transaction History Listing ── */}
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
        <View style={styles.cardSectionHeader}>
          <History size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Transaction History</Text>
        </View>

        {historyLoading ? (
          <ActivityIndicator size="small" color="#ffce00" style={{ marginVertical: 20 }} />
        ) : transactions.length > 0 ? (
          <View style={styles.transactionList}>
            {transactions.map((tx) => {
              const isCredit = tx.type === 'Credit';
              const dateStr = new Date(tx.createdAt || tx.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <View key={tx._id} style={[styles.txItem, { borderBottomColor: colors.borderGlass }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.txDescription, { color: colors.text }]}>{tx.description}</Text>
                    <Text style={[styles.txDate, { color: colors.textSecondary }]}>{dateStr}</Text>
                  </View>
                  <Text style={[styles.txAmount, isCredit ? styles.txCreditText : styles.txDebitText]}>
                    {isCredit ? '+' : '-'} ₹{tx.amount}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.emptyHistory, { color: colors.textSecondary }]}>No toll payments found on this tag yet.</Text>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 120,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  tagSelectorWrapper: {
    marginBottom: 16,
  },
  selectorScroll: {
    gap: 8,
  },
  selectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#15161e',
  },
  selectorChipText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  fastagCardMock: {
    borderRadius: 16,
    padding: 20,
    height: 160,
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardBankName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardTagId: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: 'rgba(0,204,106,0.1)',
    borderColor: '#00cc6a',
  },
  statusWarning: {
    backgroundColor: 'rgba(255,206,0,0.1)',
    borderColor: '#ffce00',
  },
  statusText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardPlateNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  cardBalanceWrapper: {
    alignItems: 'flex-end',
  },
  cardBalanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  cardBalanceAmount: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  activationHeader: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  warningBox: {
    backgroundColor: 'rgba(255, 107, 53, 0.04)',
    borderColor: 'rgba(255, 107, 53, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  warningText: {
    color: '#ff6b35',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
  registerVehicleBtn: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 12,
  },
  registerVehicleBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  formContainer: {
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  dropdownIcon: {
    marginRight: 10,
  },
  scrollSelector: {
    alignItems: 'center',
    gap: 8,
  },
  selectorBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectorBtnActive: {
    backgroundColor: '#ffce00',
    borderColor: '#ffce00',
  },
  selectorBtnText: {
    fontSize: 12,
  },
  selectorBtnTextActive: {
    color: '#0b0c10',
    fontWeight: 'bold',
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
    minWidth: '47%',
  },
  bankMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bankBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  textInput: {
    borderRadius: 10,
    borderWidth: 1,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  submitBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: '#0b0c10',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardLabelText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetBtn: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePresetBtn: {
    backgroundColor: 'rgba(255,206,0,0.08)',
    borderColor: '#ffce00',
    borderWidth: 1.5,
  },
  presetText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  activePresetText: {
    color: '#ffce00',
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  customInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  rechargeBtn: {
    paddingHorizontal: 20,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rechargeBtnText: {
    color: '#0b0c10',
    fontSize: 13,
    fontWeight: 'bold',
  },
  miniNote: {
    fontSize: 10,
    marginTop: 10,
  },
  miniDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  estimateInputContainer: {
    gap: 4,
  },
  estInput: {
    borderRadius: 10,
    borderWidth: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  resultsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultDistance: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  resultLabel: {
    fontSize: 12,
  },
  resultValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  resultSeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 10,
  },
  warningStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusAlertText: {
    fontSize: 11,
    fontWeight: 'bold',
    flex: 1,
  },
  settingsSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  switchDesc: {
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
    paddingRight: 20,
  },
  settingsFieldsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 16,
  },
  fieldRow: {
    flexDirection: 'row',
  },
  fieldLabel: {
    fontSize: 10,
    marginBottom: 6,
  },
  settingsInput: {
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  saveBtn: {
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#0b0c10',
    fontSize: 12,
    fontWeight: 'bold',
  },
  transactionList: {
    marginTop: 10,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  txDescription: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  txDate: {
    fontSize: 10,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  txCreditText: {
    color: '#00cc6a',
  },
  txDebitText: {
    color: '#ff4b4b',
  },
  emptyHistory: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
