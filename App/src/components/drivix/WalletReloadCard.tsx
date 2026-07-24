import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

interface WalletReloadCardProps {
  user: any;
  loading: boolean;
  onAddMoney: (amount: number) => Promise<void>;
}

export default function WalletReloadCard({ user, loading, onAddMoney }: WalletReloadCardProps) {
  const [reloadAmount, setReloadAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customFocus, setCustomFocus] = useState(false);
  const colors = useTheme();

  const handleAddMoneyPress = async () => {
    const amount = Number(reloadAmount || customAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please select or enter a valid amount.');
      return;
    }

    await onAddMoney(amount);
    // Clear inputs upon success
    setReloadAmount('');
    setCustomAmount('');
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
      {/* Card Mockup */}
      <View style={styles.walletCardMock}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>DRIVIX PREMIUM PASS</Text>
        </View>
        <Text style={styles.walletBalanceText}>Rs. {user.walletBalance ?? 0}</Text>
        <Text style={styles.cardHolder}>{user.name.toUpperCase()}</Text>
      </View>

      {/* Add Money Form */}
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Select Top-Up Amount</Text>
      <View style={styles.presetsRow}>
        {['100', '200', '500', '1000'].map((amt) => (
          <TouchableOpacity
            key={amt}
            style={[
              styles.presetBtn,
              { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass },
              reloadAmount === amt && styles.activePresetBtn,
            ]}
            onPress={() => {
              setReloadAmount(amt);
              setCustomAmount('');
            }}
          >
            <Text
              style={[
                styles.presetText,
                { color: colors.text },
                reloadAmount === amt && styles.activePresetText,
              ]}
            >
              Rs. {amt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Or Enter Custom Amount</Text>
      <View style={styles.customInputRow}>
        <TextInput
          style={[styles.customInput, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass, color: colors.text }, customFocus && styles.customInputFocused]}
          placeholder="Enter amount in Rs."
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={customAmount}
          onChangeText={(val) => {
            setCustomAmount(val);
            setReloadAmount('');
          }}
          onFocus={() => setCustomFocus(true)}
          onBlur={() => setCustomFocus(false)}
        />
        <TouchableOpacity
          style={styles.addMoneyBtn}
          onPress={handleAddMoneyPress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0b0c10" size="small" />
          ) : (
            <Text style={styles.addMoneyBtnText}>Load Wallet</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#15161e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginBottom: 20,
  },
  walletCardMock: {
    backgroundColor: '#1b1d25',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ffce00', // Gold border glow
    padding: 20,
    height: 150,
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#ffce00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    color: '#ffce00',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  walletBalanceText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardHolder: {
    color: '#a0aab2',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  inputLabel: {
    color: '#a0aab2',
    fontSize: 13,
    marginBottom: 10,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  activePresetBtn: {
    backgroundColor: 'rgba(255, 206, 0, 0.05)',
    borderColor: '#ffce00',
  },
  presetText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  activePresetText: {
    color: '#ffce00',
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 8,
    color: '#ffffff',
    paddingHorizontal: 12,
    height: 48,
    fontSize: 14,
  },
  customInputFocused: {
    borderColor: '#00f2ff', // Cyber Cyan focus glow
  },
  addMoneyBtn: {
    backgroundColor: '#ffce00',
    borderRadius: 24, // rounded-xl from Aura Kinetic
    height: 48,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffce00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addMoneyBtnText: {
    color: '#0b0c10',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
