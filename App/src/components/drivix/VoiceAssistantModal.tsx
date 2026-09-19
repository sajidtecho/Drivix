import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Animated, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Mic, X, Sparkles, Navigation, CreditCard, AlertTriangle, Send, Volume2 } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { processVoiceCommandWithGemini } from '@/services/geminiService';

interface VoiceAssistantModalProps {
  isVisible: boolean;
  onClose: () => void;
  onCommandRecognized: (command: string, actionType: string, params?: any, replyText?: string) => void;
  contextData?: {
    locations?: any[];
    userVehicles?: any[];
    walletBalance?: number;
    currentStep?: string;
    userName?: string;
  };
  colors: any;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isVisible,
  onClose,
  onCommandRecognized,
  contextData = {},
  colors,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [transcript, setTranscript] = useState('Ask me to find parking, book a spot, or check FASTag...');
  const [geminiReply, setGeminiReply] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [animatedValue] = useState(new Animated.Value(1));
  const recognitionRef = useRef<any>(null);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Clean raw markdown and special characters for clear natural pronunciation
  const cleanTextForSpeech = (text: string) => {
    if (!text) return '';
    return text
      .replace(/[*#_~`]/g, '')
      .replace(/[-•]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const stopAllAudio = () => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    try { Speech.stop(); } catch (e) {}
    setIsPlayingAudio(false);
  };

  // Ultra-Natural Human Voice engine (Google Neural Voice Stream + Web Speech Fallback)
  const speakResponse = (rawText: string) => {
    const text = cleanTextForSpeech(rawText);
    if (!text) return;

    stopAllAudio();

    // Language auto-detection: Hindi / Hinglish / Indian English
    const containsHindi = /[\u0900-\u097F]/.test(text) || /\b(aap|aapka|hai|kar|chahiye|dhundh|raha|hoon|sir|bataiye|paas|ho|rahi)\b/i.test(text);
    const lang = containsHindi ? 'hi' : 'en-IN';

    // 1. Try Google Neural Audio Stream for Hyper-Realistic Human Voice (Gemini / Assistant Voice Engine)
    if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
      try {
        const encodedText = encodeURIComponent(text.slice(0, 200));
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodedText}`;
        const audio = new Audio(ttsUrl);
        currentAudioRef.current = audio;

        audio.onplay = () => setIsPlayingAudio(true);
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => {
          console.warn('Google Neural Audio stream failed, falling back to Web Speech API');
          fallbackWebSpeech(text, lang);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Audio stream play blocked by browser, using Web Speech API:', err);
            fallbackWebSpeech(text, lang);
          });
        }
        return;
      } catch (e) {
        console.warn('Neural Audio stream error:', e);
      }
    }

    fallbackWebSpeech(text, lang);
  };

  // Voice Selector prioritizing high-definition Neural and Natural human voices
  const findUltraNaturalVoice = (voices: any[], isHindi: boolean) => {
    if (!voices || voices.length === 0) return null;

    // 1. Highest Priority: Neural / Natural Online voices (e.g. "Microsoft Neerja Online (Natural)", "Microsoft Swara Online (Natural)", "Google Natural")
    let voice = voices.find((v) =>
      (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Online')) &&
      (isHindi ? (v.lang.includes('hi') || v.name.includes('Swara') || v.name.includes('Hindi')) : (v.lang.includes('IN') || v.lang.includes('en')))
    );

    // 2. Second Priority: Google High Definition Voices (e.g., "Google हिन्दी", "Google US English", "Google UK English Female")
    if (!voice) {
      voice = voices.find((v) =>
        v.name.includes('Google') && (isHindi ? (v.lang.includes('hi') || v.name.includes('हिन्दी')) : (v.lang.includes('en') || v.lang.includes('IN')))
      );
    }

    // 3. Third Priority: Apple/Android HD Voices (e.g., "Samantha", "Rishi", "Veena", "Sangeeta", "Karen")
    if (!voice) {
      voice = voices.find((v) =>
        v.name.includes('Samantha') || v.name.includes('Rishi') || v.name.includes('Veena') || v.name.includes('Sangeeta') || v.name.includes('Karen')
      );
    }

    // 4. Any Indian Accent Voice
    if (!voice) {
      voice = voices.find((v) => v.lang.includes(isHindi ? 'hi' : 'IN') || v.lang.includes('en-IN'));
    }

    // 5. Fallback English
    if (!voice) {
      voice = voices.find((v) => v.lang.startsWith('en'));
    }

    return voice || voices[0];
  };

  const fallbackWebSpeech = (text: string, lang: string) => {
    const isWeb = Platform.OS === 'web' || (typeof window !== 'undefined' && 'speechSynthesis' in window);
    const isHindi = lang === 'hi';

    if (isWeb && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = isHindi ? 'hi-IN' : 'en-IN';

        utterance.onstart = () => setIsPlayingAudio(true);
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);

        const applyVoiceAndSpeak = () => {
          const voices = window.speechSynthesis.getVoices();
          const naturalVoice = findUltraNaturalVoice(voices, isHindi);

          if (naturalVoice) utterance.voice = naturalVoice;
          utterance.rate = 0.94; // Smooth conversational pace
          utterance.pitch = 1.04; // Friendly warm pitch
          utterance.volume = 1.0;
          window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length > 0) {
          applyVoiceAndSpeak();
        } else {
          window.speechSynthesis.onvoiceschanged = () => {
            applyVoiceAndSpeak();
          };
          applyVoiceAndSpeak();
        }
      } catch (err) {
        console.warn('Web Speech Synthesis error:', err);
      }
    } else {
      try {
        Speech.stop();
        Speech.speak(text, {
          language: isHindi ? 'hi-IN' : 'en-IN',
          pitch: 1.04,
          rate: 0.94,
          onStart: () => setIsPlayingAudio(true),
          onDone: () => setIsPlayingAudio(false),
          onError: () => setIsPlayingAudio(false),
        });
      } catch (e) {
        console.warn('Expo speech fallback error:', e);
      }
    }
  };

  // Process user input via Gemini API
  const handleProcessQuery = async (query: string) => {
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    setTranscript(`"${query}"`);
    setGeminiReply(null);

    try {
      const result = await processVoiceCommandWithGemini(query, contextData);
      setGeminiReply(result.replyText);
      speakResponse(result.replyText);

      // Execute app action after short delay for user to read/listen
      setTimeout(() => {
        onCommandRecognized(query, result.action, result.params, result.replyText);
        setIsProcessing(false);
      }, 1600);
    } catch (err) {
      console.warn('Voice AI processing error:', err);
      const fallbackReply = `I heard "${query}". Let me find the nearest parking option for you!`;
      setGeminiReply(fallbackReply);
      speakResponse(fallbackReply);
      setTimeout(() => {
        onCommandRecognized(query, 'SEARCH_PARKING', { locationName: query }, fallbackReply);
        setIsProcessing(false);
      }, 1500);
    }
  };

  // Start Speech Recognition
  const startSpeechRecognition = () => {
    stopAllAudio();
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-IN';

          recognition.onstart = () => {
            setIsListening(true);
            setTranscript('Listening... Speak in any language (English, Hindi, Tamil, etc.)');
          };

          recognition.onresult = (event: any) => {
            const spokenText = event.results[0][0].transcript;
            setIsListening(false);
            if (spokenText) {
              handleProcessQuery(spokenText);
            }
          };

          recognition.onerror = () => {
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = recognition;
          recognition.start();
          return;
        } catch (e) {
          console.warn('Web speech error:', e);
        }
      }
    }
    setIsListening(true);
  };

  useEffect(() => {
    if (isVisible) {
      const greeting = 'Hi sir, how can I help you?';
      setGeminiReply(greeting);
      setTranscript(greeting);
      setInputText('');

      // Speak greeting initial response using Google Neural Audio
      speakResponse(greeting);

      // Pulse animation for mic orb
      const pulseLoop = Animated.loop(
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
      );
      pulseLoop.start();

      return () => {
        pulseLoop.stop();
        stopAllAudio();
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) {}
        }
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: '#0f1420', borderColor: 'rgba(255, 206, 0, 0.35)' }]}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              stopAllAudio();
              onClose();
            }}
          >
            <X size={18} color="rgba(255, 255, 255, 0.7)" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Sparkles size={18} color="#ffce00" />
            <Text style={styles.title}>Drivix Voice Assistant</Text>
            <TouchableOpacity
              style={{ marginLeft: 8, padding: 4 }}
              onPress={() => speakResponse(geminiReply || 'Hi sir, how can I help you?')}
              activeOpacity={0.7}
            >
              <Volume2 size={18} color="#ffce00" />
            </TouchableOpacity>
          </View>

          {/* Animated Mic Orb */}
          <TouchableOpacity
            style={styles.orbContainer}
            onPress={() => startSpeechRecognition()}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.orbPulseRing,
                { transform: [{ scale: animatedValue }], backgroundColor: isListening ? 'rgba(255, 206, 0, 0.25)' : 'rgba(255, 206, 0, 0.1)' },
              ]}
            />
            <View style={[styles.micCircle, { backgroundColor: isListening ? '#ffce00' : 'rgba(255, 206, 0, 0.8)' }]}>
              {isProcessing ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Mic size={28} color="#000000" />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.transcriptText}>{transcript}</Text>

          {/* Gemini AI Response Bubble */}
          {geminiReply && (
            <View style={styles.geminiBubble}>
              <View style={styles.geminiHeader}>
                <Sparkles size={13} color="#00f2ff" />
                <Text style={styles.geminiTitle}>Gemini Voice AI</Text>
                <TouchableOpacity onPress={() => speakResponse(geminiReply)}>
                  <Volume2 size={13} color="#00f2ff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.geminiText}>{geminiReply}</Text>
            </View>
          )}

          {/* Voice Wave Graphic */}
          {isListening && !isProcessing && (
            <View style={styles.waveRow}>
              {[12, 24, 38, 20, 32, 16, 28, 14].map((h, i) => (
                <View key={i} style={[styles.waveBar, { height: h, backgroundColor: '#ffce00' }]} />
              ))}
            </View>
          )}

          {/* Interactive Text Input for direct commands */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask Gemini to find parking or book..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => {
                if (inputText.trim()) {
                  handleProcessQuery(inputText.trim());
                  setInputText('');
                }
              }}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { opacity: inputText.trim() ? 1 : 0.5 }]}
              onPress={() => {
                if (inputText.trim()) {
                  handleProcessQuery(inputText.trim());
                  setInputText('');
                }
              }}
              disabled={!inputText.trim() || isProcessing}
            >
              <Send size={16} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Quick Voice Command Pills */}
          <Text style={styles.suggestionsLabel}>VOICE QUICK COMMANDS:</Text>
          <View style={styles.suggestionsContainer}>
            <TouchableOpacity
              style={styles.suggestionPill}
              onPress={() => handleProcessQuery('Find nearest parking at Sharda University')}
            >
              <Navigation size={12} color="#ffce00" />
              <Text style={styles.suggestionText}>"Find parking near Sharda"</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.suggestionPill}
              onPress={() => handleProcessQuery('Book slot for 2 hours')}
            >
              <Sparkles size={12} color="#ffce00" />
              <Text style={styles.suggestionText}>"Book slot for 2 hrs"</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.suggestionPill}
              onPress={() => handleProcessQuery('Recharge FASTag 500 rupees')}
            >
              <CreditCard size={12} color="#ffce00" />
              <Text style={styles.suggestionText}>"Recharge FASTag ₹500"</Text>
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
    backgroundColor: 'rgba(5, 8, 14, 0.85)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 30,
  },
  modalCard: {
    width: '92%',
    borderRadius: 24,
    padding: 20,
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
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  orbContainer: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  orbPulseRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  micCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcriptText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  geminiBubble: {
    backgroundColor: 'rgba(0, 242, 255, 0.08)',
    borderColor: 'rgba(0, 242, 255, 0.25)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    width: '100%',
    marginBottom: 12,
  },
  geminiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  geminiTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00f2ff',
    flex: 1,
    marginLeft: 6,
  },
  geminiText: {
    fontSize: 12,
    color: '#ffffff',
    lineHeight: 16,
    fontWeight: '500',
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
    marginBottom: 10,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    width: '100%',
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    paddingVertical: 8,
  },
  sendBtn: {
    backgroundColor: '#ffce00',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  suggestionsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  suggestionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default VoiceAssistantModal;
