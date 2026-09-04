import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Zap, BatteryCharging, Power, Clock } from 'lucide-react-native';

interface EVChargingCardProps {
  vehicleModel?: string;
  colors: any;
}

export const EVChargingCard: React.FC<EVChargingCardProps> = ({
  vehicleModel = 'EV Vehicle',
  colors,
}) => {
  const [batteryPercent, setBatteryPercent] = useState(68);
  const [chargingSpeed, setChargingSpeed] = useState(22.4); // kW
  const [isCharging, setIsCharging] = useState(true);

  useEffect(() => {
    if (!isCharging) return;
    const interval = setInterval(() => {
      setBatteryPercent((prev) => {
        if (prev >= 100) {
          setIsCharging(false);
          return 100;
        }
        return prev + 1;
      });
      setChargingSpeed(+(22.0 + Math.random() * 0.8).toFixed(1));
    }, 4000);

    return () => clearInterval(interval);
  }, [isCharging]);

  const handleToggleCharging = () => {
    if (isCharging) {
      Alert.alert(
        'Stop Charging Session',
        'Are you sure you want to stop the EV charging session?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Stop Charging', style: 'destructive', onPress: () => setIsCharging(false) },
        ]
      );
    } else {
      setIsCharging(true);
      Alert.alert('Charging Resumed', 'EV charging session has been resumed.');
    }
  };

  const minutesRemaining = Math.max(0, Math.round((100 - batteryPercent) * 1.2));

  return (
    <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Zap size={13} color="#10b981" />
          <Text style={styles.badgeText}>EV LIVE CHARGING</Text>
        </View>
        <TouchableOpacity
          style={[styles.powerBtn, { backgroundColor: isCharging ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)' }]}
          onPress={handleToggleCharging}
        >
          <Power size={13} color={isCharging ? '#ef4444' : '#10b981'} />
          <Text style={[styles.powerBtnText, { color: isCharging ? '#ef4444' : '#10b981' }]}>
            {isCharging ? 'Stop' : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.batteryBlock}>
          <BatteryCharging size={24} color="#10b981" />
          <View style={{ marginLeft: 10 }}>
            <Text style={[styles.batteryPercentText, { color: colors.text }]}>{batteryPercent}%</Text>
            <Text style={[styles.subtext, { color: colors.subtext }]}>{vehicleModel}</Text>
          </View>
        </View>

        <View style={styles.statsBlock}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{chargingSpeed} kW</Text>
            <Text style={[styles.subtext, { color: colors.subtext }]}>Speed</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={12} color="#10b981" />
              <Text style={[styles.statValue, { color: colors.text }]}>{minutesRemaining}m</Text>
            </View>
            <Text style={[styles.subtext, { color: colors.subtext }]}>To 100%</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${batteryPercent}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  powerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  powerBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  batteryBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryPercentText: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtext: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
});

export default EVChargingCard;
