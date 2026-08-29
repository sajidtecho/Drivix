import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShieldAlert, Video, Info, Zap, AlertTriangle, Play, Square, Volume2, VolumeX } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { detectFaces } from 'vision-camera-face-detector';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { Audio } from 'expo-av';
import { Worklets } from 'react-native-worklets-core';
import socketService from '@/services/socket';

const { width } = Dimensions.get('window');

export default function DriverCopilotScreen() {
  const router = useRouter();
  const colors = useTheme();
  const device = useCameraDevice('front'); // Use front-facing camera for driver monitoring

  // Component UI State
  const [isActive, setIsActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<string>('undetermined');
  const [leftEyeProb, setLeftEyeProb] = useState(1.0);
  const [rightEyeProb, setRightEyeProb] = useState(1.0);
  const [phoneDetected, setPhoneDetected] = useState(false);
  const [drowsyAlert, setDrowsyAlert] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [usePythonLink, setUsePythonLink] = useState(false);

  // Audio Ref
  const soundRef = useRef<Audio.Sound | null>(null);

  // Load YOLO TFLite Phone Detector Model (COCO dataset containing phone, or specialized)
  const yoloModel = useTensorflowModel(
    require('../../assets/models/yolo11n.tflite')
  );

  // Request camera permission on mount
  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setCameraPermission(status);
    })();
  }, []);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      cleanupSound();
      socketService.off('safetyAlertReceived');
    };
  }, []);

  const cleanupSound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (err) {
        // Ignore cleanup errors
      }
      soundRef.current = null;
    }
  };

  // Run on JS Thread to update states & trigger alarms
  const updateAlertStates = Worklets.createRunOnJS((
    leftProb: number,
    rightProb: number,
    isPhone: boolean,
    isDrowsy: boolean
  ) => {
    setLeftEyeProb(leftProb);
    setRightEyeProb(rightProb);
    setPhoneDetected(isPhone);
    setDrowsyAlert(isDrowsy);

    // Broadcast live telemetry to socket stream for cross-platform radar sync
    socketService.emitCopilotTelemetry({
      source: 'mobile',
      leftEyeOpen: leftProb,
      rightEyeOpen: rightProb,
      avgEyeOpenness: ((leftProb + rightProb) / 2) * 100,
      phoneDetected: isPhone,
      drowsyAlert: isDrowsy,
      timestamp: new Date().toISOString()
    });

    if (soundEnabled && (isDrowsy || isPhone)) {
      playAlarm();
    } else {
      stopAlarm();
    }
  });

  const playAlarm = async () => {
    if (soundRef.current) return; // Already playing
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/audio/eye_alert.mp3'),
        { shouldPlay: true, isLooping: true }
      );
      soundRef.current = sound;
    } catch (error) {
      console.warn('Sound alarm failed to load', error);
    }
  };

  const stopAlarm = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (err) {}
      soundRef.current = null;
    }
  };

  // Real-Time Frame Processor running in C++ Worklet Thread
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    let leftProb = 1.0;
    let rightProb = 1.0;
    let isPhone = false;
    let isDrowsy = false;

    // 1. Run Drowsiness Detection using Google ML Kit Native Face Detector
    const faces = detectFaces(frame);
    if (faces.length > 0) {
      const face = faces[0];
      leftProb = face.leftEyeOpenProbability ?? 1.0;
      rightProb = face.rightEyeOpenProbability ?? 1.0;

      // Drowsiness logic: both eyes closed (< 15% open probability)
      if (leftProb < 0.15 && rightProb < 0.15) {
        isDrowsy = true;
      }
    }

    // 2. Run Phone Detection using YOLOv11 TFLite
    if (yoloModel.state === 'loaded') {
      const tensor = frame.toArrayBuffer();
      const output = yoloModel.model.run([tensor]);
      
      const classes = output[0]; // Output indexes
      const confidences = output[1]; // Bounding box confidences
      
      // COCO Class Index 67 is 'cell phone'
      for (let i = 0; i < classes.length; i++) {
        if (classes[i] === 67 && confidences[i] > 0.50) {
          isPhone = true;
          break;
        }
      }
    }

    // Push calculations back to React Native JS UI thread
    updateAlertStates(leftProb, rightProb, isPhone, isDrowsy);
  }, [yoloModel, soundEnabled]);

  const handleOnboardAlert = (data: { alertType: string; duration: number }) => {
    if (data.alertType === 'PHONE') {
      setPhoneDetected(true);
      setDrowsyAlert(false);
      setLeftEyeProb(1.0);
      setRightEyeProb(1.0);
      if (soundEnabled) {
        playAlarm();
      }
    } else if (data.alertType === 'EYE') {
      setDrowsyAlert(true);
      setPhoneDetected(false);
      setLeftEyeProb(0.05);
      setRightEyeProb(0.05);
      if (soundEnabled) {
        playAlarm();
      }
    } else {
      setPhoneDetected(false);
      setDrowsyAlert(false);
      setLeftEyeProb(1.0);
      setRightEyeProb(1.0);
      stopAlarm();
    }
  };

  const toggleCopilot = () => {
    if (usePythonLink) {
      const targetActive = !isActive;
      setIsActive(targetActive);
      if (targetActive) {
        socketService.connect();
        socketService.joinCopilotRoom();
        socketService.on('safetyAlertReceived', handleOnboardAlert);
      } else {
        socketService.off('safetyAlertReceived', handleOnboardAlert);
        cleanupSound();
        setDrowsyAlert(false);
        setPhoneDetected(false);
        setLeftEyeProb(1.0);
        setRightEyeProb(1.0);
      }
    } else {
      if (cameraPermission !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to launch Drivix Assistant.');
        return;
      }
      const targetActive = !isActive;
      setIsActive(targetActive);
      if (targetActive) {
        socketService.connect();
        socketService.joinCopilotRoom();
      } else {
        cleanupSound();
        setDrowsyAlert(false);
        setPhoneDetected(false);
      }
    }
  };

  // Calculate Average Eye Status Percentage
  const avgEyeOpen = ((leftEyeProb + rightEyeProb) / 2) * 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderGlass }]}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]} 
          onPress={() => {
            cleanupSound();
            router.back();
          }}
          activeOpacity={0.8}
        >
          <ChevronLeft size={20} color="#ffce00" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Drivix Assistant</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>AI Drowsiness & Distraction Alert</Text>
        </View>
        <TouchableOpacity
          style={[styles.volBtn, { borderColor: colors.borderGlass }]}
          onPress={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? <Volume2 size={20} color="#ffce00" /> : <VolumeX size={20} color="#ff4b4b" />}
        </TouchableOpacity>
      </View>

      {/* Main Preview / HUD Area */}
      <View style={styles.previewContainer}>
        {isActive ? (
          usePythonLink ? (
            <View style={[styles.placeholderWrapper, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
              <View style={[
                styles.hudRadarPulse, 
                { borderColor: drowsyAlert || phoneDetected ? '#ff4b4b' : '#00cc6a' }
              ]} />
              <ShieldAlert size={48} color={drowsyAlert ? '#ff4b4b' : phoneDetected ? '#ffce00' : '#00cc6a'} style={{ marginBottom: 12 }} />
              <Text style={[styles.placeholderTitle, { color: colors.text }]}>
                {drowsyAlert ? '⚠️ DROWSINESS ALERT (ONBOARD) ⚠️' : phoneDetected ? '📱 PHONE DETECTED (ONBOARD) 📱' : 'ONBOARD TELEMETRY ACTIVE'}
              </Text>
              <Text style={[styles.placeholderDesc, { color: colors.textSecondary, marginTop: 4 }]}>
                Streaming real-time driver alert logs from the Python onboard safety camera.
              </Text>
            </View>
          ) : (
            device && cameraPermission === 'granted' && (
              <View style={styles.cameraWrapper}>
                <Camera
                  style={StyleSheet.absoluteFill}
                  device={device}
                  isActive={isActive}
                  frameProcessor={frameProcessor}
                  pixelFormat="yuv"
                />
                <View style={styles.hudOverlayGrid} />
              </View>
            )
          )
        ) : (
          <View style={[styles.placeholderWrapper, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
            <Video size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
            <Text style={[styles.placeholderTitle, { color: colors.text }]}>Drivix Assistant Standby</Text>
            <Text style={[styles.placeholderDesc, { color: colors.textSecondary }]}>
              Secure your phone on a dashboard mount pointing at your face, then press Start.
            </Text>
          </View>
        )}

        {/* Real-time Alerts HUD Overlay */}
        {isActive && (
          <View style={styles.hudOverlayContainer}>
            {drowsyAlert && (
              <View style={[styles.hudAlertCapsule, { backgroundColor: 'rgba(255, 75, 75, 0.95)' }]}>
                <ShieldAlert size={20} color="#fff" />
                <Text style={styles.hudAlertText}>⚠️ DROWSINESS ALARM: WAKE UP! ⚠️</Text>
              </View>
            )}

            {phoneDetected && (
              <View style={[styles.hudAlertCapsule, { backgroundColor: 'rgba(255, 174, 0, 0.95)' }]}>
                <AlertTriangle size={20} color="#000" />
                <Text style={[styles.hudAlertText, { color: '#000' }]}>📱 DISTRACTION: CELL PHONE USE 📱</Text>
              </View>
            )}

            {!drowsyAlert && !phoneDetected && (
              <View style={[styles.hudAlertCapsule, { backgroundColor: 'rgba(0, 204, 106, 0.9)' }]}>
                <Zap size={20} color="#fff" />
                <Text style={styles.hudAlertText}>🟢 ACTIVE MONITORING SAFE</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Telemetry Dashboard Data */}
      <View style={[styles.dashboardCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>👁️ Live Telemetry HUD</Text>
        
        <View style={styles.telemetryGrid}>
          <View style={[styles.telemetryItem, { borderBottomColor: colors.borderGlass }]}>
            <Text style={[styles.telemetryLabel, { color: colors.textSecondary }]}>Left Eye State</Text>
            <Text style={[styles.telemetryValue, { color: leftEyeProb > 0.3 ? '#00cc6a' : '#ff4b4b' }]}>
              {isActive ? `${(leftEyeProb * 100).toFixed(0)}% Open` : '--'}
            </Text>
          </View>
          <View style={[styles.telemetryItem, { borderBottomColor: colors.borderGlass }]}>
            <Text style={[styles.telemetryLabel, { color: colors.textSecondary }]}>Right Eye State</Text>
            <Text style={[styles.telemetryValue, { color: rightEyeProb > 0.3 ? '#00cc6a' : '#ff4b4b' }]}>
              {isActive ? `${(rightEyeProb * 100).toFixed(0)}% Open` : '--'}
            </Text>
          </View>
          <View style={[styles.telemetryItem, { borderBottomColor: colors.borderGlass }]}>
            <Text style={[styles.telemetryLabel, { color: colors.textSecondary }]}>Attention Index</Text>
            <Text style={[styles.telemetryValue, { color: avgEyeOpen > 30 ? '#00cc6a' : '#ff4b4b' }]}>
              {isActive ? `${avgEyeOpen.toFixed(0)}% Focused` : '--'}
            </Text>
          </View>
          <View style={styles.telemetryItem}>
            <Text style={[styles.telemetryLabel, { color: colors.textSecondary }]}>Distraction Status</Text>
            <Text style={[styles.telemetryValue, { color: phoneDetected ? '#ff4b4b' : '#00cc6a' }]}>
              {isActive ? (phoneDetected ? 'PHONE DETECTED' : 'CLEAR') : '--'}
            </Text>
          </View>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.footerActions}>
        {!isActive && (
          <View style={{ flexDirection: 'row', gap: 8, width: '100%', marginBottom: 16 }}>
            <TouchableOpacity 
              style={{
                flex: 1,
                height: 40,
                borderRadius: 12,
                borderWidth: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: !usePythonLink ? 'rgba(0, 242, 255, 0.1)' : 'transparent',
                borderColor: !usePythonLink ? '#00f2ff' : colors.borderGlass,
              }}
              onPress={() => setUsePythonLink(false)}
            >
              <Text style={{ color: !usePythonLink ? '#00f2ff' : colors.textSecondary, fontSize: 12, fontWeight: 'bold' }}>
                📷 Phone Camera
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{
                flex: 1,
                height: 40,
                borderRadius: 12,
                borderWidth: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: usePythonLink ? 'rgba(0, 204, 106, 0.1)' : 'transparent',
                borderColor: usePythonLink ? '#00cc6a' : colors.borderGlass,
              }}
              onPress={() => setUsePythonLink(true)}
            >
              <Text style={{ color: usePythonLink ? '#00cc6a' : colors.textSecondary, fontSize: 12, fontWeight: 'bold' }}>
                🔗 Onboard Python AI
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.controlBtn,
            isActive 
              ? { backgroundColor: '#ff4b4b', borderColor: '#ff4b4b' } 
              : { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}
          onPress={toggleCopilot}
          activeOpacity={0.8}
        >
          {isActive ? <Square size={20} color="#fff" /> : <Play size={20} color="#000" />}
          <Text style={[styles.controlBtnText, isActive ? { color: '#fff' } : { color: '#000' }]}>
            {isActive ? 'Stop Co-Pilot' : 'Start Co-Pilot'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  volBtn: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  previewContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  cameraWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  hudOverlayGrid: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 206, 0, 0.15)',
    borderStyle: 'dashed',
    margin: 20,
    borderRadius: 16,
  },
  placeholderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    padding: 30,
  },
  hudRadarPulse: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    opacity: 0.15,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  placeholderDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  hudOverlayContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  hudAlertCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  hudAlertText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  dashboardCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  telemetryGrid: {
    gap: 12,
  },
  telemetryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  telemetryLabel: {
    fontSize: 13,
  },
  telemetryValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  footerActions: {
    padding: 20,
    alignItems: 'center',
  },
  controlBtn: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
  },
  controlBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
