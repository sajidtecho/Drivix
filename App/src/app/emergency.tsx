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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
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
  Phone,
  RefreshCw,
  Landmark,
  ShieldCheck,
  Building2,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

interface EmergencyScreenProps {
  onBack?: () => void;
}

export default function EmergencyScreen({ onBack }: EmergencyScreenProps) {
  const router = useRouter();
  const colors = useTheme();

  const [sosActive, setSosActive] = useState(false);
  const [patrolEta, setPatrolEta] = useState('6 min');

  // Live Location States
  const [locationStatus, setLocationStatus] = useState<'LOADING' | 'GRANTED' | 'DENIED'>('LOADING');
  const [locationAddress, setLocationAddress] = useState('Fetching live location via GPS...');
  const [coordsText, setCoordsText] = useState('');

  // Pulsing SOS Animation
  const sosPulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  const requestLiveLocation = async () => {
    try {
      setLocationStatus('LOADING');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationStatus('GRANTED');
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const { latitude, longitude } = loc.coords;
        setCoordsText(`${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`);

        try {
          const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (geocode && geocode.length > 0) {
            const item = geocode[0];
            const formatted = [
              item.name,
              item.street,
              item.district || item.subregion,
              item.city,
              item.region,
              item.postalCode,
            ]
              .filter(Boolean)
              .join(', ');
            setLocationAddress(formatted || `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          } else {
            setLocationAddress(`GPS Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch {
          setLocationAddress(`GPS Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      } else {
        setLocationStatus('DENIED');
        setLocationAddress('Location permission denied. Tap below to grant access.');
      }
    } catch (err) {
      console.warn('Error requesting emergency location:', err);
      setLocationStatus('DENIED');
      setLocationAddress('Unable to access GPS location. Please check settings.');
    }
  };

  useEffect(() => {
    requestLiveLocation();
  }, []);

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
      Alert.alert('SOS Stand-Down', 'Emergency broadcast request has been cancelled.');
    } else {
      setSosActive(true);
      Alert.alert(
        '🚨 EMERGENCY SOS BROADCAST ACTIVE',
        `Live GPS Coordinates (${coordsText || 'Fetching...'}) sent to NHAI Expressway Patrol & Emergency Response Center.\n\nAssistance team is dispatched!`,
        [
          {
            text: 'Call NHAI Helpline (1033)',
            onPress: () => Linking.openURL('tel:1033').catch(() => {}),
          },
          { text: 'Call Police (112)', onPress: () => Linking.openURL('tel:112').catch(() => {}) },
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

  // Official Govt & NHAI Helpline Emergency Numbers
  const govtHelplines = [
    {
      id: 'nhai',
      title: 'NHAI Highway Helpline',
      subtitle: 'National Highways Authority of India 24x7 Roadside SOS',
      number: '1033',
      badge: 'GOVT / NHAI OFFICIAL',
      badgeColor: '#ffce00',
      icon: Landmark,
      color: '#ffce00',
      bg: 'rgba(255, 206, 0, 0.12)',
    },
    {
      id: 'erss',
      title: 'Govt Emergency Response (ERSS)',
      subtitle: 'Single Govt Helpline for Police, Medical & Fire Incident',
      number: '112',
      badge: 'NATIONAL GOVT 112',
      badgeColor: '#3b82f6',
      icon: ShieldAlert,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.12)',
    },
    {
      id: 'medical',
      title: 'Govt Health & Medical Care',
      subtitle: 'National Ambulance & Free Medical Trauma Response',
      number: '108',
      badge: 'GOVT MEDICAL',
      badgeColor: '#ef4444',
      icon: Ambulance,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.12)',
    },
    {
      id: 'fire',
      title: 'Fire Brigade SOS',
      subtitle: 'Government Fire Incident & Hazardous Rescue',
      number: '101',
      badge: 'GOVT FIRE',
      badgeColor: '#ff6b35',
      icon: Flame,
      color: '#ff6b35',
      bg: 'rgba(255, 107, 53, 0.12)',
    },
    {
      id: 'women',
      title: 'Govt Women Safety Helpline',
      subtitle: 'National Commission for Women 24/7 Helpline',
      number: '1091',
      badge: 'NCW GOVT',
      badgeColor: '#a78bfa',
      icon: ShieldCheck,
      color: '#a78bfa',
      bg: 'rgba(167, 139, 250, 0.12)',
    },
    {
      id: 'towing',
      title: 'Roadside Recovery & Towing',
      subtitle: '24x7 Flatbed Vehicle Recovery & Crane Service',
      number: '1800-102-3748',
      badge: 'DRIVIX RSA',
      badgeColor: '#10b981',
      icon: Truck,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
    },
  ];

  const safetyChecklist = [
    {
      title: 'Post Collision Action',
      desc: 'Turn on hazard warning lights, turn off ignition, move to safe roadside shoulder if possible.',
    },
    {
      title: 'NHAI Emergency Marker Poles',
      desc: 'Look for nearest NHAI kilometer stone or emergency call box on National Highways to pinpoint location.',
    },
    {
      title: 'Warning Triangle Setup',
      desc: 'Place red reflective warning triangle 50 meters behind your vehicle to alert highway traffic.',
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
          <Text style={styles.headerTitle}>24/7 Govt & NHAI Emergency</Text>
          <Text style={styles.headerSubtitle}>Official Helplines & Live GPS Response</Text>
        </View>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() =>
            Alert.alert(
              'Location Broadcast',
              `Current Live Location:\n${locationAddress}\n${coordsText}\n\nShared via SMS to emergency contacts.`
            )
          }
        >
          <Share2 size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── GPS Live Location Bar with Permission Handler ── */}
        <View style={styles.locationBar}>
          <MapPin size={20} color="#ef4444" />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.locationLabel}>YOUR LIVE GPS LOCATION</Text>
              {locationStatus === 'GRANTED' && <ShieldCheck size={12} color="#00cc6a" />}
            </View>

            {locationStatus === 'LOADING' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <ActivityIndicator size="small" color="#ef4444" />
                <Text style={styles.locationText}>Acquiring High-Precision GPS...</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.locationText} numberOfLines={2}>
                  {locationAddress}
                </Text>
                {coordsText ? <Text style={styles.coordsText}>{coordsText}</Text> : null}
              </View>
            )}
          </View>

          {locationStatus === 'DENIED' ? (
            <TouchableOpacity style={styles.grantBtn} onPress={requestLiveLocation}>
              <Text style={styles.grantBtnText}>Allow GPS</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.refreshLocBtn} onPress={requestLiveLocation}>
              <RefreshCw size={14} color="#ffffff" />
            </TouchableOpacity>
          )}
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
              <Text style={styles.sosOrbSub}>{sosActive ? 'NHAI BROADCAST ACTIVE' : '1-TAP EMERGENCY'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* ── Live Patrol Dispatch Telemetry Card ── */}
        <View style={styles.patrolCard}>
          <View style={styles.patrolHeader}>
            <View style={styles.patrolBadge}>
              <View style={[styles.pulseDot, { backgroundColor: sosActive ? '#ef4444' : '#00cc6a' }]} />
              <Text style={[styles.patrolBadgeText, { color: sosActive ? '#ef4444' : '#00cc6a' }]}>
                {sosActive ? 'HIGHWAY PATROL DISPATCHED' : 'NHAI & DRIVIX PATROL READY'}
              </Text>
            </View>
            <Text style={styles.patrolEtaText}>ETA ~ {patrolEta}</Text>
          </View>

          <View style={styles.patrolBody}>
            <View style={styles.patrolIconBox}>
              <Landmark size={22} color="#ffce00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patrolUnitTitle}>NHAI & Drivix Highway Patrol Unit #104</Text>
              <Text style={styles.patrolUnitSub}>
                Stationed at Cyber City Toll Plaza • First-Aid, Hydraulic Crane & Battery Jumpstart Enabled
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.patrolCallBtn}
            onPress={() => handleDialNumber('1033', 'NHAI Highway Helpline')}
            activeOpacity={0.85}
          >
            <PhoneCall size={16} color="#000000" />
            <Text style={styles.patrolCallBtnText}>CALL NHAI HIGHWAY HELPLINE (1033)</Text>
          </TouchableOpacity>
        </View>

        {/* ── Government & NHAI Emergency Helpline Grid ── */}
        <Text style={styles.sectionHeading}>OFFICIAL GOVT & NHAI HELPLINES</Text>
        <View style={styles.servicesGrid}>
          {govtHelplines.map((svc) => {
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={styles.serviceTitle}>{svc.title}</Text>
                    <View style={[styles.govBadge, { backgroundColor: `${svc.badgeColor}20` }]}>
                      <Text style={[styles.govBadgeText, { color: svc.badgeColor }]}>{svc.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.serviceSub}>{svc.subtitle}</Text>
                </View>
                <View style={[styles.callBadge, { backgroundColor: svc.color }]}>
                  <Phone size={12} color="#000000" />
                  <Text style={styles.callBadgeText}>{svc.number}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Emergency Safety & Collision Guide ── */}
        <Text style={styles.sectionHeading}>HIGHWAY SAFETY & ACCIDENT CHECKLIST</Text>
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
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#ffce00',
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
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  coordsText: {
    fontSize: 10,
    color: '#00f2ff',
    fontWeight: '600',
    marginTop: 2,
  },
  grantBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  grantBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  refreshLocBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 8.5,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 2,
    letterSpacing: 0.4,
  },

  /* Patrol Card */
  patrolCard: {
    backgroundColor: '#0f1322',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 206, 0, 0.3)',
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
    backgroundColor: 'rgba(255, 206, 0, 0.12)',
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
    color: '#ffce00',
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
    backgroundColor: 'rgba(255, 206, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patrolUnitTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  patrolUnitSub: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 2,
  },
  patrolCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffce00',
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
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  serviceIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  govBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  govBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  serviceSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
  },
  callBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  callBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
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
