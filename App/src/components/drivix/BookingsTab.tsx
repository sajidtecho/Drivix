import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { Calendar, MapPin, Clock, Plus, LogOut, RefreshCw } from 'lucide-react-native';
import { api } from '@/services/api';
import { useTheme } from '@/hooks/use-theme';

interface Booking {
  _id: string;
  bookingId: string;
  slotId: string;
  floor: string;
  locationName: string;
  entryDate: string;
  entryTime: string;
  durationHours?: number;
  duration?: number;
  totalCost: number;
  status: string;
}

// ─── Active Booking Card Sub-Component ──────────────────
function BookingCard({
  booking,
  onRefresh,
}: {
  booking: Booking;
  onRefresh: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);
  const [fineAmount, setFineAmount] = useState(0);
  const [showExtendInput, setShowExtendInput] = useState(false);
  const [extendHours, setExtendHours] = useState('1');
  const [extending, setExtending] = useState(false);
  const [vacating, setVacating] = useState(false);

  // Checkout Billing & Payment States
  const [showBillModal, setShowBillModal] = useState(false);
  const [billDetails, setBillDetails] = useState<any>(null);
  const [fetchingBill, setFetchingBill] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wallet' | 'cash'>('wallet');

  const colors = useTheme();

  const duration = booking.durationHours || booking.duration || 1;

  useEffect(() => {
    const calculateTime = () => {
      if (booking.status === 'completed') return;

      try {
        const [year, month, day] = booking.entryDate.split('-').map(Number);
        const [hour, minute] = booking.entryTime.split(':').map(Number);

        const startTime = new Date(year, month - 1, day, hour, minute);
        const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
        const now = new Date();

        const diff = endTime.getTime() - now.getTime();

        if (diff <= 0) {
          setIsOverdue(true);
          const overdueHours = Math.ceil(Math.abs(diff) / (1000 * 60 * 60));
          setFineAmount(overdueHours * 50); // Rs 50/hr fine
          setTimeLeft('EXPIRED');
        } else {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${h}h ${m}m ${s}s`);
          setIsOverdue(false);
        }
      } catch (err) {
        console.warn('Time calculations failed:', err);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [booking, duration]);

  const handleVacate = async () => {
    setFetchingBill(true);
    try {
      const res = await api.get(`/bookings/${booking._id}/calculate-bill`);
      setBillDetails(res.data);
      setShowBillModal(true);
    } catch (err: any) {
      console.error('Fetch bill error:', err);
      if (Platform.OS === 'web') {
        alert('Error: Failed to fetch checkout bill details.');
      } else {
        Alert.alert('Error', 'Failed to fetch checkout bill details.');
      }
    } finally {
      setFetchingBill(false);
    }
  };

  const confirmCheckout = async () => {
    setVacating(true);
    try {
      const paymentMethod = billDetails?.amountDue > 0 ? selectedPaymentMethod : undefined;
      const res = await api.put(`/bookings/${booking._id}/vacate`, { paymentMethod });
      if (res.data) {
        setShowBillModal(false);
        if (Platform.OS === 'web') {
          alert('Check Out Successful: Thank you for using Drivix! Slot released successfully.');
        } else {
          Alert.alert('Check Out Successful', 'Thank you for using Drivix! Slot released successfully.');
        }
        onRefresh();
      }
    } catch (err: any) {
      console.error('Vacate error:', err);
      const errMsg = err.response?.data?.message || 'Failed to release slot.';
      if (Platform.OS === 'web') {
        alert(`Error: ${errMsg}`);
      } else {
        Alert.alert('Error', errMsg);
      }
    } finally {
      setVacating(false);
    }
  };

  const handleExtend = async () => {
    const hours = Number(extendHours);
    if (!hours || hours <= 0) {
      if (Platform.OS === 'web') {
        alert('Invalid Input: Please enter a valid number of hours.');
      } else {
        Alert.alert('Invalid Input', 'Please enter a valid number of hours.');
      }
      return;
    }

    const rate = booking.totalCost / duration;
    const additionalCost = hours * rate;

    const confirmExtend = async () => {
      setExtending(true);
      try {
        const res = await api.put(`/bookings/${booking._id}/extend`, {
          additionalHours: hours,
          additionalCost,
        });
        if (res.data) {
          if (Platform.OS === 'web') {
            alert(`Extended: Booking extended successfully by ${hours} hours.`);
          } else {
            Alert.alert('Extended', `Booking extended successfully by ${hours} hours.`);
          }
          setShowExtendInput(false);
          onRefresh();
        }
      } catch (err: any) {
        console.error('Extension error:', err);
        const errMsg = err.response?.data?.message || 'Failed to extend booking.';
        if (Platform.OS === 'web') {
          alert(`Extension Failed: ${errMsg}`);
        } else {
          Alert.alert('Extension Failed', errMsg);
        }
      } finally {
        setExtending(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm(`Extend your booking by ${hours} hours for Rs. ${additionalCost}?`);
      if (confirm) {
        confirmExtend();
      }
    } else {
      Alert.alert(
        'Extend Reservation',
        `Extend your booking by ${hours} hours for Rs. ${additionalCost}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm Extension',
            onPress: confirmExtend,
          },
        ]
      );
    }
  };

  const isActive = booking.status === 'booked';
  const displayId = booking._id ? `#${booking._id.substring(Math.max(0, booking._id.length - 6)).toUpperCase()}` : '#TICKET';

  return (
    <View style={[styles.bookingCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }, isOverdue && isActive && styles.overdueCard]}>
      {/* Accent Strip */}
      <View style={[styles.accentStrip, isOverdue && isActive ? styles.overdueAccent : styles.activeAccent]} />

      <View style={styles.cardHeader}>
        <View style={styles.headerMeta}>
          <Text style={[styles.ticketId, { color: colors.text }]}>{displayId}</Text>
          <View
            style={[
              styles.statusTag,
              booking.status === 'completed' && styles.completedTag,
              isOverdue && isActive && styles.overdueTag,
            ]}
          >
            <Text
              style={[
                styles.statusTagText,
                booking.status === 'completed' && styles.completedTagText,
                isOverdue && isActive && styles.overdueTagText,
              ]}
            >
              {booking.status === 'completed' ? 'COMPLETED' : isOverdue ? 'OVERDUE' : 'ACTIVE'}
            </Text>
          </View>
        </View>
        <Text style={[styles.costText, { color: colors.text }]}>Rs. {booking.totalCost}</Text>
      </View>

      <Text style={[styles.slotLabel, { color: colors.text }]}>
        Slot {booking.slotId} • Floor {booking.floor}
      </Text>

      <View style={styles.detailsBlock}>
        <View style={styles.detailRow}>
          <MapPin size={13} color="#00f2ff" />
          <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>{booking.locationName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={13} color="#00f2ff" />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {booking.entryTime} ({duration} hrs)
          </Text>
        </View>
      </View>

      {isActive && (
        <View style={styles.timerRow}>
          <View style={[styles.timerContainer, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }, isOverdue && styles.overdueTimerContainer]}>
            <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>Time Remaining</Text>
            <Text style={[styles.timerValue, isOverdue && styles.overdueTimerValue]}>
              {timeLeft}
            </Text>
          </View>
          {isOverdue && (
            <View style={styles.fineContainer}>
              <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>Penalty fine</Text>
              <Text style={styles.fineValue}>+ Rs. {fineAmount}</Text>
            </View>
          )}
        </View>
      )}

      {/* Booking Actions */}
      {isActive && (
        <View style={styles.actionsContainer}>
          {!showExtendInput ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.extendBtn}
                onPress={() => setShowExtendInput(true)}
              >
                <Plus size={14} color="#ffce00" />
                <Text style={styles.extendBtnText}>Extend</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.vacateBtn}
                onPress={handleVacate}
                disabled={fetchingBill}
              >
                {fetchingBill ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <LogOut size={14} color="#ffffff" />
                    <Text style={styles.vacateBtnText}>Out</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.extendInputContainer}>
              <TextInput
                style={styles.extendInput}
                keyboardType="numeric"
                value={extendHours}
                onChangeText={(val) => setExtendHours(val.replace(/[^0-9]/g, ''))}
                placeholder="Hours"
                placeholderTextColor="#60646c"
              />
              <TouchableOpacity
                style={styles.saveExtendBtn}
                onPress={handleExtend}
                disabled={extending}
              >
                {extending ? (
                  <ActivityIndicator size="small" color="#0b0c10" />
                ) : (
                  <Text style={styles.saveExtendBtnText}>Confirm</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelExtendBtn}
                onPress={() => setShowExtendInput(false)}
              >
                <Text style={styles.cancelExtendBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Checkout Billing & Payment Modal */}
      {showBillModal && billDetails && (
        <Modal
          visible={showBillModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowBillModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.85)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          }}>
            <View style={{
              backgroundColor: '#1c1d25',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(255, 206, 0, 0.15)',
              width: '100%',
              maxWidth: 380,
              padding: 20,
              gap: 16
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff' }}>🧾 Exit Checkout Bill</Text>
                <TouchableOpacity onPress={() => setShowBillModal(false)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 16, color: '#8b8e96', fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Bill Details */}
              <View style={{ gap: 8, backgroundColor: '#13141b', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#2c2d35' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#8b8e96', fontSize: 12 }}>Parked Duration:</Text>
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>{billDetails.hoursParked} hours</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#8b8e96', fontSize: 12 }}>Rate:</Text>
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>₹{billDetails.hourlyRate}/hr</Text>
                </View>
                {billDetails.servicesCost > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#8b8e96', fontSize: 12 }}>Services Cost:</Text>
                    <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>₹{billDetails.servicesCost}</Text>
                  </View>
                )}
                <View style={{ height: 1, backgroundColor: '#2c2d35', marginVertical: 4 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#8b8e96', fontSize: 12 }}>Subtotal:</Text>
                  <Text style={{ color: '#ffffff', fontSize: 12 }}>₹{billDetails.finalCost}</Text>
                </View>
                {billDetails.prepaidAmount > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#8b8e96', fontSize: 12 }}>Prepaid Amount:</Text>
                    <Text style={{ color: '#4CAF50', fontSize: 12 }}>-₹{billDetails.prepaidAmount}</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold' }}>Balance Due:</Text>
                  <Text style={{ color: '#ffce00', fontSize: 15, fontWeight: 'bold' }}>₹{billDetails.amountDue}</Text>
                </View>
              </View>

              {/* Payment Methods */}
              {billDetails.amountDue > 0 && (
                <View style={{ gap: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffce00', textTransform: 'uppercase', letterSpacing: 0.5 }}>Select Exit Payment Option</Text>
                  
                  {/* Pay via Wallet */}
                  <TouchableOpacity
                    onPress={() => setSelectedPaymentMethod('wallet')}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: selectedPaymentMethod === 'wallet' ? '#ffce00' : '#2c2d35',
                      backgroundColor: selectedPaymentMethod === 'wallet' ? 'rgba(255, 206, 0, 0.08)' : '#13141b',
                      opacity: billDetails.walletBalance < billDetails.amountDue ? 0.6 : 1
                    }}
                  >
                    <View>
                      <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold' }}>💳 Pay using Wallet</Text>
                      <Text style={{ color: '#8b8e96', fontSize: 11, marginTop: 2 }}>Balance: ₹{billDetails.walletBalance}</Text>
                    </View>
                    {selectedPaymentMethod === 'wallet' && (
                      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#ffce00', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#0b0c10' }} />
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Pay at Exit Gate */}
                  <TouchableOpacity
                    onPress={() => setSelectedPaymentMethod('cash')}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: selectedPaymentMethod === 'cash' ? '#ffce00' : '#2c2d35',
                      backgroundColor: selectedPaymentMethod === 'cash' ? 'rgba(255, 206, 0, 0.08)' : '#13141b'
                    }}
                  >
                    <View>
                      <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold' }}>💵 Pay Cash/Card at Exit Gate</Text>
                      <Text style={{ color: '#8b8e96', fontSize: 11, marginTop: 2 }}>Pay agent at the booth</Text>
                    </View>
                    {selectedPaymentMethod === 'cash' && (
                      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#ffce00', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#0b0c10' }} />
                      </View>
                    )}
                  </TouchableOpacity>

                  {selectedPaymentMethod === 'wallet' && billDetails.walletBalance < billDetails.amountDue && (
                    <Text style={{ color: '#ff4b4b', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                      ⚠️ Insufficient wallet balance. Please pay at exit or add money to wallet.
                    </Text>
                  )}
                </View>
              )}

              {/* Confirm / Action Buttons */}
              <TouchableOpacity
                onPress={confirmCheckout}
                disabled={vacating || (billDetails.amountDue > 0 && selectedPaymentMethod === 'wallet' && billDetails.walletBalance < billDetails.amountDue)}
                style={{
                  backgroundColor: (billDetails.amountDue > 0 && selectedPaymentMethod === 'wallet' && billDetails.walletBalance < billDetails.amountDue) ? '#2c2d35' : '#ffce00',
                  height: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 8
                }}
              >
                {vacating ? (
                  <ActivityIndicator size="small" color="#0b0c10" />
                ) : (
                  <Text style={{ color: '#0b0c10', fontSize: 14, fontWeight: 'bold' }}>
                    {billDetails.amountDue > 0 ? 'Pay & Check Out' : 'Check Out Now'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
}

// ─── Main BookingsTab Component ──────────────────
export default function BookingsTab() {
  const [subTab, setSubTab] = useState<'active' | 'history'>('active');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const colors = useTheme();

  const fetchBookings = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const response = await api.get('/bookings/my');
      setBookings(response.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookings(false);
  }, []);

  const activeBookings = bookings.filter((b) => b.status === 'booked');
  const historyBookings = bookings.filter((b) => b.status === 'completed');
  const displayed = subTab === 'active' ? activeBookings : historyBookings;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sub Tabs Switcher */}
      <View style={[styles.tabSwitcher, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
        <TouchableOpacity
          style={[styles.tabBtn, subTab === 'active' && styles.activeTabBtn]}
          onPress={() => setSubTab('active')}
        >
          <Text style={[styles.tabBtnText, { color: colors.textSecondary }, subTab === 'active' && styles.activeTabBtnText]}>
            Active ({activeBookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, subTab === 'history' && styles.activeTabBtn]}
          onPress={() => setSubTab('history')}
        >
          <Text style={[styles.tabBtnText, { color: colors.textSecondary }, subTab === 'history' && styles.activeTabBtnText]}>
            History ({historyBookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchBookings(true)}>
          <RefreshCw size={14} color="#ffce00" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#ffce00" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading tickets...</Text>
        </View>
      ) : displayed.length > 0 ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
          {displayed.map((booking) => (
            <BookingCard key={booking._id} booking={booking} onRefresh={fetchBookings} />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.emptyContainer, { borderColor: colors.borderGlass, backgroundColor: colors.backgroundSelected }]}>
          <Calendar size={48} color={colors.textSecondary} style={styles.emptyIcon} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No bookings found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {subTab === 'active'
              ? "You don't have any active parking tickets right now."
              : 'Your past parking history will appear here.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(21, 22, 30, 0.75)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 4,
    marginBottom: 16,
    alignItems: 'center',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 16,
  },
  activeTabBtn: {
    backgroundColor: '#ffce00',
  },
  tabBtnText: {
    color: '#a0aab2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeTabBtnText: {
    color: '#0b0c10',
  },
  refreshBtn: {
    paddingHorizontal: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    color: '#a0aab2',
    fontSize: 13,
    marginTop: 12,
  },
  listContainer: {
    paddingBottom: 24,
  },
  bookingCard: {
    backgroundColor: 'rgba(21, 22, 30, 0.75)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    paddingLeft: 22,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  overdueCard: {
    borderColor: 'rgba(255, 75, 75, 0.3)',
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  activeAccent: {
    backgroundColor: '#00f2ff',
  },
  overdueAccent: {
    backgroundColor: '#ff4b4b',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketId: {
    color: '#ffce00',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statusTag: {
    backgroundColor: 'rgba(0, 242, 255, 0.05)',
    borderColor: '#00f2ff',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusTagText: {
    color: '#00f2ff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  completedTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  completedTagText: {
    color: '#a0aab2',
  },
  overdueTag: {
    backgroundColor: 'rgba(255, 75, 75, 0.05)',
    borderColor: '#ff4b4b',
  },
  overdueTagText: {
    color: '#ff4b4b',
  },
  costText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  slotLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 6,
  },
  detailsBlock: {
    marginTop: 10,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    color: '#a0aab2',
    fontSize: 12,
    flex: 1,
  },
  timerRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 12,
  },
  timerContainer: {
    backgroundColor: 'rgba(0, 242, 255, 0.03)',
    borderColor: 'rgba(0, 242, 255, 0.12)',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  overdueTimerContainer: {
    backgroundColor: 'rgba(255, 75, 75, 0.03)',
    borderColor: 'rgba(255, 75, 75, 0.12)',
  },
  timerLabel: {
    color: '#a0aab2',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  timerValue: {
    color: '#00f2ff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  overdueTimerValue: {
    color: '#ff4b4b',
  },
  fineContainer: {
    backgroundColor: 'rgba(255, 75, 75, 0.05)',
    borderColor: 'rgba(255, 75, 75, 0.15)',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  fineValue: {
    color: '#ff4b4b',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  actionsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  extendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#ffce00',
    backgroundColor: 'rgba(255, 206, 0, 0.05)',
    height: 38,
    borderRadius: 8,
    flex: 1,
  },
  extendBtnText: {
    color: '#ffce00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vacateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ff4b4b',
    height: 38,
    borderRadius: 8,
    flex: 1,
  },
  vacateBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  extendInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  extendInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    color: '#ffffff',
    height: 38,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  saveExtendBtn: {
    backgroundColor: '#ffce00',
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveExtendBtnText: {
    color: '#0b0c10',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cancelExtendBtn: {
    height: 38,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelExtendBtnText: {
    color: '#a0aab2',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  emptyIcon: {
    opacity: 0.3,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubtitle: {
    color: '#a0aab2',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 24,
  },
});
