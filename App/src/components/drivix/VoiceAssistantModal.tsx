import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Animated } from 'react-native';
import { Mic, X, Sparkles, Navigation, CreditCard, AlertTriangle } from 'lucide-react-native';

interface VoiceAssistantModalProps {
  isVisible: boolean;
  onClose: () => void;
  onCommandRecognized: (command: string, actionType: 'SEARCH' | 'FASTAG' | 'CHALLAN' | 'COPILOT') => void;
  colors: any;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isVisible,
  onClose,
  onCommandRecognized,
  colors,
}) => {
  const [isListening, setIsListening] = useState(true);
  const [transcript, setTranscript] = useState('Listening... Say something like "Find parking near me"');
  const [animatedValue] = useState(new Animated.Value(1));

  useEffect(() => {
    if (isVisible) {
      setIsListening(true);
      setTranscript('Listening... Say "Find parking" or "Recharge FASTag"');

      // Pulse animation for mic orb
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animatedValue, isVisible]);

  const handleSimulateVoiceCommand = (cmd: string, actionType: 'SEARCH' | 'FASTAG' | 'CHALLAN' | 'COPILOT') => {
    setIsListening(false);
    setTranscript(`"${cmd}"`);
    setTimeout(() => {
      onCommandRecognized(cmd, actionType);
      onClose();
    }, 1200);
  };

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: '#0f1420', borderColor: 'rgba(255, 206, 0, 0.3)' }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={18} color="rgba(255, 255, 255, 0.7)" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Sparkles size={18} color="#ffce00" />
            <Text style={styles.title}>Hey Drivix Voice AI</Text>
          </View>

          {/* Animated Mic Orb */}
          <View style={styles.orbContainer}>
            <Animated.View
              style={[
                styles.orbPulseRing,
                { transform: [{ scale: animatedValue }], backgroundColor: 'rgba(255, 206, 0, 0.15)' },
              ]}
            />
            <View style={styles.micCircle}>
              <Mic size={28} color="#000000" />
            </View>
          </View>

          <Text style={styles.transcriptText}>{transcript}</Text>

          {/* Voice Wave Graphic */}
          {isListening && (
            <View style={styles.waveRow}>
              {[12, 24, 38, 20, 32, 16, 28, 14].map((h, i) => (
                <View key={i} style={[styles.waveBar, { height: h, backgroundColor: '#ffce00' }]} />
              ))}
            </View>
          )}

          {/* Quick Voice Command Pills */}
          <Text style={styles.suggestionsLabel}>TRY SAYING:</Text>
          <View style={styles.suggestionsContainer}>
            <TouchableOpacity
              style={styles.suggestionPill}
              onPress={() => handleSimulateVoiceCommand('Find nearest parking', 'SEARCH')}
            >
              <Navigation size={12} color="#ffce00" />
              <Text style={styles.suggestionText}>"Find nearest parking"</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.suggestionPill}
              onPress={() => handleSimulateVoiceCommand('Recharge FASTag wallet', 'FASTAG')}
            >
              <CreditCard size={12} color="#ffce00" />
              <Text style={styles.suggestionText}>"Recharge FASTag"</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.suggestionPill}
              onPress={() => handleSimulateVoiceCommand('Check pending challans', 'CHALLAN')}
            >
              <AlertTriangle size={12} color="#ffce00" />
              <Text style={styles.suggestionText}>"Check challans"</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 14, 0.82)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  modalCard: {
    width: '90%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#ffce00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  orbContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  orbPulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  micCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffce00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcriptText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginVertical: 14,
    paddingHorizontal: 12,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    marginBottom: 16,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  suggestionsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 10,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default VoiceAssistantModal;
