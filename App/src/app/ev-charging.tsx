import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  Alert,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Zap,
  BatteryCharging,
  Gauge,
  Clock,
  DollarSign,
  MapPin,
  Sliders,
  Power,
  Navigation,
  Activity,
  Info,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

interface EVChargingScreenProps {
  onBack?: () => void;
  vehicleModel?: string;
}

export default function EVChargingScreen({ onBack, vehicleModel = 'Tata Nexon EV Max' }: EVChargingScreenProps) {
  const router = useRouter();
  const colors = useTheme();

  // Charging State
  const [isCharging, setIsCharging] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(78);
  const [chargingPower, setChargingPower] = useState(68.5); // kW
  const [energyDelivered, setEnergyDelivered] = useState(34.2); // kWh
  const [cost, setCost] = useState(239.40); // ₹
  const [targetLimit, setTargetLimit] = useState<80 | 90 | 100>(80);
  const [chargeMode, setChargeMode] = useState<'FAST_DC' | 'HYPER' | 'ECO'>('FAST_DC');

  // Animation values for 3D concentric ring HUD & pulse waves
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isCharging) {
      // Loop pulse scale animation
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      );

      // Loop continuous rotation animation for 3D ring
      const rotateLoop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
          easing: Easing.linear,
        })
      );

      // Loop glow pulse
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.9,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );

      pulseLoop.start();
      rotateLoop.start();
      glowLoop.start();

      return () => {
        pulseLoop.stop();
        rotateLoop.stop();
        glowLoop.stop();
      };
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0.3);
    }
  }, [isCharging, pulseAnim, rotateAnim, glowAnim]);

  // Live telemetry ticker when charging
  useEffect(() => {
    let interval: any;
    if (isCharging) {
      interval = setInterval(() => {
        setBatteryLevel((prev) => {
          if (prev >= targetLimit) {
            setIsCharging(false);
            Alert.alert('Charging Complete', `Battery reached target limit of ${targetLimit}%.`);
            return targetLimit;
          }
          return Number((prev + 0.1).toFixed(1));
        });
        setEnergyDelivered((prev) => Number((prev + 0.05).toFixed(2)));
        setCost((prev) => Number((prev + 0.35).toFixed(2)));
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isCharging, targetLimit]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleToggleCharging = () => {
    if (isCharging) {
      setIsCharging(false);
      Alert.alert('Charging Session Paused', 'Power flow stopped. You can resume anytime.');
    } else {
      setIsCharging(true);
      Alert.alert('Charging Session Resumed', 'High-speed CCS2 Fast DC power flow re-established.');
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const counterSpin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const nearbyStations = [
    {
      id: 'st-1',
      name: 'DLF CyberHub EV Supercharger Hub',
      distance: '0.2 km',
      address: 'Level B1, E-Zone Bay 4',
      portsAvailable: '4/6 Free',
      maxKw: '150 kW DC',
      connectorType: 'CCS2 & Type 2',
      pricing: '₹7.0/kWh',
    },
    {
      id: 'st-2',
      name: 'Ambience Mall HyperCharge EV Station',
      distance: '2.4 km',
      address: 'Basement P2, Pillar 42',
      portsAvailable: '2/4 Free',
      maxKw: '120 kW DC',
      connectorType: 'CCS2',
      pricing: '₹6.8/kWh',
    },
    {
      id: 'st-3',
      name: 'Horizon Center Fast EV Park',
      distance: '3.1 km',
      address: 'Golf Course Road, Hub 2',
      portsAvailable: '6/8 Free',
      maxKw: '60 kW DC',
      connectorType: 'CCS2 & GB/T',
      pricing: '₹6.5/kWh',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: '#07090e' }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>EV Live Telemetry</Text>
          <Text style={styles.headerSubtitle}>{vehicleModel} • Gun #2 CCS2</Text>
        </View>
        <TouchableOpacity
          style={styles.infoBtn}
          onPress={() => Alert.alert('Station Info', 'DLF CyberHub EV Station\nCCS2 150 kW Dual Gun Fast Charger')}
        >
          <Info size={18} color="#10b981" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── 3D Interactive Telemetry Metering HUD ── */}
        <View style={styles.hudContainer}>
          {/* Outer glowing ambient halo */}
          <Animated.View style={[styles.hudHalo, { opacity: glowAnim }]} />

          {/* 3D Rotating Outer Tech Ring */}
          <Animated.View style={[styles.hudRing3D, { transform: [{ rotate: spin }] }]}>
            <View style={styles.hudRingDot1} />
            <View style={styles.hudRingDot2} />
          </Animated.View>

          {/* 3D Counter-Rotating Inner Ring */}
          <Animated.View style={[styles.hudInnerRing3D, { transform: [{ rotate: counterSpin }] }]} />

          {/* Center Pulsing Energy Orb & Live Readout */}
          <Animated.View style={[styles.centerOrb, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.orbInner}>
              <BatteryCharging size={26} color={isCharging ? '#10b981' : '#64748b'} />
              <Text style={styles.batteryPercentText}>{batteryLevel}%</Text>
              <View style={styles.statusBadgeRow}>
                <View style={[styles.statusDot, { backgroundColor: isCharging ? '#10b981' : '#ef4444' }]} />
                <Text style={[styles.statusBadgeText, { color: isCharging ? '#10b981' : '#94a3b8' }]}>
                  {isCharging ? 'FAST DC CHARGING' : 'SESSION PAUSED'}
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* ── Primary Charging Speed Banner ── */}
        <View style={styles.speedBanner}>
          <View style={styles.speedBannerCol}>
            <Text style={styles.speedBannerLabel}>POWER OUTPUT</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={styles.speedBannerVal}>{isCharging ? chargingPower : 0}</Text>
              <Text style={styles.speedBannerUnit}>kW</Text>
            </View>
          </View>

          <View style={styles.speedBannerDivider} />

          <View style={styles.speedBannerCol}>
            <Text style={styles.speedBannerLabel}>ESTIMATED SPEED</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={styles.speedBannerVal}>{isCharging ? '+340' : '0'}</Text>
              <Text style={styles.speedBannerUnit}>km/h</Text>
            </View>
          </View>

          <View style={styles.speedBannerDivider} />

          <View style={styles.speedBannerCol}>
            <Text style={styles.speedBannerLabel}>TIME TO 80%</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={styles.speedBannerVal}>{isCharging ? '12' : '--'}</Text>
              <Text style={styles.speedBannerUnit}>min</Text>
            </View>
          </View>
        </View>

        {/* ── Live Telemetry Grid ── */}
        <Text style={styles.sectionHeading}>LIVE METERING METRICS</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <Zap size={16} color="#10b981" />
            </View>
            <Text style={styles.metricLabel}>Voltage</Text>
            <Text style={styles.metricVal}>415.8 V</Text>
            <Text style={styles.metricSub}>3-Phase AC-DC</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: 'rgba(0, 242, 255, 0.12)' }]}>
              <Activity size={16} color="#00f2ff" />
            </View>
            <Text style={styles.metricLabel}>Current</Text>
            <Text style={styles.metricVal}>164.7 A</Text>
            <Text style={styles.metricSub}>Active Peak</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: 'rgba(255, 206, 0, 0.12)' }]}>
              <Gauge size={16} color="#ffce00" />
            </View>
            <Text style={styles.metricLabel}>Energy Delivered</Text>
            <Text style={styles.metricVal}>{energyDelivered} kWh</Text>
            <Text style={styles.metricSub}>Session Total</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: 'rgba(167, 139, 250, 0.12)' }]}>
              <DollarSign size={16} color="#a78bfa" />
            </View>
            <Text style={styles.metricLabel}>Session Cost</Text>
            <Text style={styles.metricVal}>₹{cost}</Text>
            <Text style={styles.metricSub}>₹7.00 / kWh</Text>
          </View>
        </View>

        {/* ── Interactive Power & Target Limit Controls ── */}
        <Text style={styles.sectionHeading}>CHARGING SPEED & TARGET LIMIT</Text>
        <View style={styles.controlsCard}>
          {/* Charge Mode Selector */}
          <Text style={styles.controlSubHeading}>Select Charge Mode</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[
                styles.modePill,
                chargeMode === 'FAST_DC' && styles.modePillActive,
              ]}
              onPress={() => {
                setChargeMode('FAST_DC');
                setChargingPower(68.5);
              }}
            >
              <Zap size={14} color={chargeMode === 'FAST_DC' ? '#000' : '#10b981'} />
              <Text style={[styles.modePillText, chargeMode === 'FAST_DC' && styles.modePillTextActive]}>
                120 kW Fast DC
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modePill,
                chargeMode === 'HYPER' && styles.modePillActive,
              ]}
              onPress={() => {
                setChargeMode('HYPER');
                setChargingPower(150.0);
              }}
            >
              <Sliders size={14} color={chargeMode === 'HYPER' ? '#000' : '#00f2ff'} />
              <Text style={[styles.modePillText, chargeMode === 'HYPER' && styles.modePillTextActive]}>
                150 kW Hyper
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modePill,
                chargeMode === 'ECO' && styles.modePillActive,
              ]}
              onPress={() => {
                setChargeMode('ECO');
                setChargingPower(22.0);
              }}
            >
              <Clock size={14} color={chargeMode === 'ECO' ? '#000' : '#a78bfa'} />
              <Text style={[styles.modePillText, chargeMode === 'ECO' && styles.modePillTextActive]}>
                22 kW Eco AC
              </Text>
            </TouchableOpacity>
          </View>

          {/* Target Limit Selector */}
          <Text style={[styles.controlSubHeading, { marginTop: 16 }]}>Set Max Battery Charge Target</Text>
          <View style={styles.targetRow}>
            {([80, 90, 100] as const).map((limit) => (
              <TouchableOpacity
                key={limit}
                style={[
                  styles.targetBox,
                  targetLimit === limit && styles.targetBoxActive,
                ]}
                onPress={() => setTargetLimit(limit)}
              >
                <Text style={[styles.targetBoxVal, targetLimit === limit && styles.targetBoxValActive]}>
                  {limit}%
                </Text>
                <Text style={[styles.targetBoxSub, targetLimit === limit && styles.targetBoxSubActive]}>
                  {limit === 80 ? 'Optimal Life' : limit === 90 ? 'Daily Range' : 'Max Trip'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Main Start/Stop Charging Trigger ── */}
        <TouchableOpacity
          style={[
            styles.mainActionBtn,
            { backgroundColor: isCharging ? 'rgba(239, 68, 68, 0.15)' : '#10b981', borderColor: isCharging ? '#ef4444' : '#10b981' },
          ]}
          onPress={handleToggleCharging}
          activeOpacity={0.85}
        >
          <Power size={20} color={isCharging ? '#ef4444' : '#000000'} />
          <Text style={[styles.mainActionBtnText, { color: isCharging ? '#ef4444' : '#000000' }]}>
            {isCharging ? 'STOP CHARGING SESSION' : 'START CHARGING NOW'}
          </Text>
        </TouchableOpacity>

        {/* ── Nearby High-Speed EV Station Locator ── */}
        <Text style={styles.sectionHeading}>NEARBY FAST CHARGING STATIONS</Text>
        {nearbyStations.map((station) => (
          <View key={station.id} style={styles.stationCard}>
            <View style={{ flex: 1 }}>
              <View style={styles.stationTitleRow}>
                <Text style={styles.stationName}>{station.name}</Text>
                <View style={styles.distBadge}>
                  <MapPin size={11} color="#10b981" />
                  <Text style={styles.distBadgeText}>{station.distance}</Text>
                </View>
              </View>
              <Text style={styles.stationAddr}>{station.address}</Text>
              <View style={styles.stationInfoBadges}>
                <Text style={styles.stationBadge1}>{station.portsAvailable}</Text>
                <Text style={styles.stationBadge2}>{station.maxKw}</Text>
                <Text style={styles.stationBadge3}>{station.pricing}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.stationNavBtn}
              onPress={() => Alert.alert('Navigating', `Launching directions to ${station.name}...`)}
            >
              <Navigation size={16} color="#10b981" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0a0d14',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 2,
  },
  infoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  /* 3D Metering HUD Styles */
  hudContainer: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  hudHalo: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
  },
  hudRing3D: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hudRingDot1: {
    position: 'absolute',
    top: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  hudRingDot2: {
    position: 'absolute',
    bottom: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00f2ff',
  },
  hudInnerRing3D: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(0, 242, 255, 0.4)',
  },
  centerOrb: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#0c1322',
    borderWidth: 2,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  orbInner: {
    alignItems: 'center',
  },
  batteryPercentText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* Speed Banner */
  speedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0d131f',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: 20,
  },
  speedBannerCol: {
    alignItems: 'center',
  },
  speedBannerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  speedBannerVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  speedBannerUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  speedBannerDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  /* Sections */
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },

  /* Metrics Grid */
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: '#0d131f',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },

  /* Controls */
  controlsCard: {
    backgroundColor: '#0d131f',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  controlSubHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 4,
  },
  modePillActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  modePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  modePillTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  targetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  targetBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  targetBoxActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  targetBoxVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  targetBoxValActive: {
    color: '#10b981',
  },
  targetBoxSub: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  targetBoxSubActive: {
    color: '#10b981',
  },

  /* Action Button */
  mainActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
    marginBottom: 24,
  },
  mainActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* Stations */
  stationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d131f',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  stationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stationName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    marginRight: 6,
  },
  distBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  distBadgeText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '700',
  },
  stationAddr: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
  },
  stationInfoBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  stationBadge1: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stationBadge2: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00f2ff',
    backgroundColor: 'rgba(0, 242, 255, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stationBadge3: {
    fontSize: 9,
    fontWeight: '700',
    color: '#a78bfa',
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stationNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});
