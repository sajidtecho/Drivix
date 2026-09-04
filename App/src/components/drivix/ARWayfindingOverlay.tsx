import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ImageBackground } from 'react-native';
import { Compass, Navigation, X, MapPin, ArrowUp, ArrowRight, ShieldCheck } from 'lucide-react-native';

interface ARWayfindingOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  slotNumber?: string;
  floorName?: string;
  facilityName?: string;
  colors: any;
}

export const ARWayfindingOverlay: React.FC<ARWayfindingOverlayProps> = ({
  isVisible,
  onClose,
  slotNumber = 'B-14',
  floorName = 'Floor 2',
  facilityName = 'Drivix Smart Facility',
  colors,
}) => {
  const [distanceMeters, setDistanceMeters] = useState(28);
  const [currentStepText, setCurrentStepText] = useState('Drive 15m straight down Row B');

  useEffect(() => {
    if (!isVisible) return;
    setDistanceMeters(28);
    setCurrentStepText('Drive 15m straight down Row B');

    const interval = setInterval(() => {
      setDistanceMeters((prev) => {
        if (prev <= 3) {
          setCurrentStepText(`You arrived at Slot ${slotNumber}!`);
          return 0;
        }
        const next = prev - 4;
        if (next <= 12) {
          setCurrentStepText(`Turn Right into Bay ${slotNumber}`);
        }
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible, slotNumber]);

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* AR Camera Backdrop View Simulation */}
        <ImageBackground
          source={require('../../../assets/images/parking_bg.jpg')}
          style={StyleSheet.absoluteFill}
          imageStyle={{ resizeMode: 'cover' }}
        >
          {/* Dark Overlay Tint for AR HUD contrast */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8, 12, 20, 0.65)' }]} />

          {/* AR Top Header HUD */}
          <View style={styles.topHudBar}>
            <View style={styles.facilityBlock}>
              <MapPin size={16} color="#ffce00" />
              <View>
                <Text style={styles.facilityName}>{facilityName}</Text>
                <Text style={styles.facilitySub}>{floorName} • Indoor AR Wayfinding</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* AR 3D Center Arrow Target Overlay */}
          <View style={styles.arCenterHUD}>
            <View style={styles.arTargetRing}>
              {distanceMeters > 12 ? (
                <ArrowUp size={44} color="#ffce00" />
              ) : distanceMeters > 0 ? (
                <ArrowRight size={44} color="#00cc6a" />
              ) : (
                <ShieldCheck size={44} color="#00cc6a" />
              )}
            </View>

            <View style={styles.distanceBadge}>
              <Compass size={14} color="#000" />
              <Text style={styles.distanceBadgeText}>
                {distanceMeters > 0 ? `${distanceMeters}m to Slot ${slotNumber}` : `ARRIVED AT SLOT ${slotNumber}`}
              </Text>
            </View>
          </View>

          {/* AR Bottom Navigation Guidance Card */}
          <View style={styles.bottomHudCard}>
            <View style={styles.stepHeaderRow}>
              <Navigation size={18} color="#ffce00" />
              <Text style={styles.stepText}>{currentStepText}</Text>
            </View>

            <View style={styles.slotTargetRow}>
              <View style={styles.slotPill}>
                <Text style={styles.slotPillLabel}>ASSIGNED SLOT</Text>
                <Text style={styles.slotPillVal}>{slotNumber}</Text>
              </View>
              <View style={styles.slotPill}>
                <Text style={styles.slotPillLabel}>LEVEL</Text>
                <Text style={styles.slotPillVal}>{floorName}</Text>
              </View>

              <TouchableOpacity style={styles.finishBtn} onPress={onClose}>
                <Text style={styles.finishBtnText}>Close AR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topHudBar: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 15, 24, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  facilityBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  facilityName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  facilitySub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arCenterHUD: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arTargetRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 2.5,
    borderColor: '#ffce00',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#ffce00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffce00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  distanceBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  bottomHudCard: {
    marginHorizontal: 16,
    marginBottom: 36,
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'rgba(10, 15, 24, 0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 206, 0, 0.3)',
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  stepText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  slotTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  slotPill: {
    alignItems: 'flex-start',
  },
  slotPillLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.5,
  },
  slotPillVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffce00',
    marginTop: 2,
  },
  finishBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  finishBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default ARWayfindingOverlay;
