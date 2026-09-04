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
  Linking,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  PhoneCall,
  AlertTriangle,
  ShieldAlert,
  Ambulance,
  Truck,
  Flame,
  MapPin,
  Share2,
  Clock,
  Phone,
  CheckCircle,
  HelpCircle,
  FileText,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

interface EmergencyScreenProps {
  onBack?: () => void;
  userLocationText?: string;
}

export default function EmergencyScreen({
  onBack,
  userLocationText = 'DLF Cyber City, Phase 2, Gurugram (28.4950° N, 77.0895° E)',
}: EmergencyScreenProps) {
  const router = useRouter();
  const colors = useTheme();

  const [sosActive, setSosActive] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [patrolEta, setPatrolEta] = useState('6 min');

  // Pulsing SOS Animation
  const sosPulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sosPulseAnim, {
          toValue: 1.12,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(sosPulseAnim, {
          toValue: 1.0,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    glowLoop.start();

    return () => {
      pulseLoop.stop();
      glowLoop.stop();
    };
  }, [sosPulseAnim, glowAnim]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleTriggerSOS = () => {
    if (sosActive) {
      setSosActive(false);
      Alert.alert('SOS Cancelled', 'Emergency broadcast request has been stand-down.');
    } else {
      setSosActive(true);
      Alert.alert(
        '🚨 EMERGENCY SOS BROADCAST SENT',
        `GPS Coordinates and Vehicle Telemetry sent to Drivix Highway Patrol Unit #104 & Local PCR Helpline.\n\nAssistance team is dispatched!`,
        [
          {
            text: 'Call Hotline (112)',
            onPress: () => Linking.openURL('tel:112').catch(() => {}),
          },
          { text: 'OK' },
        ]
      );
    }
  };

  const handleDialNumber = (number: string, label: string) => {
    Alert.alert('Calling Emergency Helpline', `Initiating call to ${label} (${number})...`, [
      { text: 'Call Now', onPress: () => Linking.openURL(`tel:${number}`).catch(() => {}) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const emergencyServices = [
    {
      id: 'medical',
      title: 'Medical Emergency',
      subtitle: 'Ambulance & Trauma Support',
      number: '108',
      icon: Ambulance,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.12)',
    },
    {
      id: 'police',
      title: 'Police & Traffic PCR',
      subtitle: 'Accident & Safety Response',
      number: '112',
      icon: ShieldAlert,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.12)',
    },
    {
      id: 'towing',
      title: 'Flatbed Towing Truck',
      subtitle: 'Accident & Vehicle Recovery',
      number: '1800-102-3748',
      icon: Truck,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
    },
    {
      id: 'fire',
      title: 'Fire Brigade SOS',
      subtitle: 'Thermal & Vehicle Fire',
      number: '101',
      icon: Flame,
      color: '#ff6b35',
      bg: 'rgba(255, 107, 53, 0.12)',
    },
  ];

  const safetyChecklist = [
    {
      title: 'Post Collision Action',
      desc: 'Turn on hazard warning lights, turn off ignition, move to safe roadside shoulder if possible.',
    },
    {
      title: 'Warning Triangle Setup',
      desc: 'Place red reflective warning triangle 50 meters behind your vehicle to alert highway traffic.',
    },
    {
      title: 'Medical Assistance Checklist',
      desc: 'Do not remove helmet or heavy clothing if spinal injury is suspected. Keep patient calm & warm.',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: '#07080d' }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>24/7 SOS Emergency Support</Text>
          <Text style={styles.headerSubtitle}>Instant Dispatch & Highway Response</Text>
        </View>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => Alert.alert('Location Shared', `Current coordinates shared via SMS to trusted emergency contacts.`)}
        >
          <Share2 size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── GPS Live Location Bar ── */}
        <View style={styles.locationBar}>
          <MapPin size={18} color="#ef4444" />
          <View style={{ flex: 1 }}>
            <Text style={styles.locationLabel}>YOUR LIVE GPS LOCATION</Text>
            <Text style={styles.locationText} numberOfLines={1}>{userLocationText}</Text>
          </View>
          <TouchableOpacity
            style={styles.copyLocBtn}
            onPress={() => Alert.alert('Copied', 'Exact GPS coordinates copied to clipboard.')}
          >
            <Text style={styles.copyLocText}>Copy</Text>
          </TouchableOpacity>
        </View>

        {/* ── 1-Tap Big Pulsing SOS Trigger Orb ── */}
        <View style={styles.sosContainer}>
          <Animated.View style={[styles.sosHalo, { opacity: glowAnim }]} />

          <Animated.View style={{ transform: [{ scale: sosPulseAnim }] }}>
            <TouchableOpacity
              style={[styles.sosOrb, sosActive && styles.sosOrbActive]}
              onPress={handleTriggerSOS}
              activeOpacity={0.8}
            >
              <AlertTriangle size={36} color="#ffffff" />
              <Text style={styles.sosOrbText}>{sosActive ? 'CANCEL SOS' : 'PRESS FOR SOS'}</Text>
              <Text style={styles.sosOrbSub}>{sosActive ? 'BROADCAST ACTIVE' : '1-TAP EMERGENCY'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* ── Live Patrol Dispatch Telemetry Card ── */}
        <View style={styles.patrolCard}>
          <View style={styles.patrolHeader}>
            <View style={styles.patrolBadge}>
              <View style={[styles.pulseDot, { backgroundColor: sosActive ? '#ef4444' : '#00cc6a' }]} />
              <Text style={[styles.patrolBadgeText, { color: sosActive ? '#ef4444' : '#00cc6a' }]}>
                {sosActive ? 'PATROL DISPATCHED' : 'NEARBY PATROL READY'}
              </Text>
            </View>
            <Text style={styles.patrolEtaText}>ETA ~ {patrolEta}</Text>
          </View>

          <View style={styles.patrolBody}>
            <View style={styles.patrolIconBox}>
              <ShieldAlert size={22} color="#00f2ff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patrolUnitTitle}>Drivix Rapid Response Patrol #104</Text>
              <Text style={styles.patrolUnitSub}>Stationed at Cyber City Toll Plaza • Equipped with First-Aid & Battery Jumpstart</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.patrolCallBtn}
            onPress={() => handleDialNumber('1800-374-849', 'Drivix Emergency Dispatch')}
            activeOpacity={0.85}
          >
            <PhoneCall size={16} color="#000000" />
            <Text style={styles.patrolCallBtnText}>CALL DISPATCH HOTLINE (TOLL FREE)</Text>
          </TouchableOpacity>
        </View>

        {/* ── Emergency Quick Dial Services ── */}
        <Text style={styles.sectionHeading}>DIRECT EMERGENCY SERVICES</Text>
        <View style={styles.servicesGrid}>
          {emergencyServices.map((svc) => {
            const IconComp = svc.icon;
            return (
              <TouchableOpacity
                key={svc.id}
                style={styles.serviceCard}
                onPress={() => handleDialNumber(svc.number, svc.title)}
                activeOpacity={0.8}
              >
                <View style={[styles.serviceIconCircle, { backgroundColor: svc.bg }]}>
                  <IconComp size={20} color={svc.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceTitle}>{svc.title}</Text>
                  <Text style={styles.serviceSub}>{svc.subtitle}</Text>
                </View>
                <View style={styles.callBadge}>
                  <Phone size={12} color="#ffffff" />
                  <Text style={styles.callBadgeText}>{svc.number}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Emergency Safety & Collision Guide ── */}
        <Text style={styles.sectionHeading}>SAFETY & ACCIDENT CHECKLIST</Text>
        <View style={styles.checklistCard}>
          {safetyChecklist.map((item, idx) => (
            <View key={idx} style={[styles.checkItem, idx > 0 && styles.checkItemBorder]}>
              <View style={styles.checkNumBox}>
                <Text style={styles.checkNumText}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkTitle}>{item.title}</Text>
                <Text style={styles.checkDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
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
    backgroundColor: '#0c0e17',
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
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 2,
  },
  shareBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  /* GPS Location Bar */
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1322',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    gap: 12,
    marginBottom: 20,
  },
  locationLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ef4444',
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 2,
  },
  copyLocBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  copyLocText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },

  /* SOS Orb */
  sosContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  sosHalo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 35,
  },
  sosOrb: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  sosOrbActive: {
    backgroundColor: '#991b1b',
    borderColor: '#ef4444',
  },
  sosOrbText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  sosOrbSub: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },

  /* Patrol Card */
  patrolCard: {
    backgroundColor: '#0f1322',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.2)',
    marginBottom: 20,
  },
  patrolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  patrolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 204, 106, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  patrolBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  patrolEtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00f2ff',
  },
  patrolBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  patrolIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patrolUnitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  patrolUnitSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  patrolCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00f2ff',
    height: 44,
    borderRadius: 12,
    gap: 8,
  },
  patrolCallBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.3,
  },

  /* Sections */
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },

  /* Services Grid */
  servicesGrid: {
    gap: 10,
    marginBottom: 20,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1322',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  serviceIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  serviceSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  callBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  callBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },

  /* Safety Checklist */
  checklistCard: {
    backgroundColor: '#0f1322',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
  },
  checkItemBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  checkNumBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ef4444',
  },
  checkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  checkDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 16,
  },
});
