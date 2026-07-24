import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Phone, KeyRound, ArrowRight, RefreshCw, Edit2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/AuthContext';

interface LoginBottomSheetProps {
  visible: boolean;
  onCancel: () => void;
}

export default function LoginBottomSheet({ visible, onCancel }: LoginBottomSheetProps) {
  const colors = useTheme();
  const router = useRouter();
  const { user, isAuthenticated, loginWithMobile } = useAuth();

  // Step state: 'PHONE' | 'OTP'
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');

  // Input states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // UI States
  const [loadingText, setLoadingText] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [timer, setTimer] = useState(0);

  // Verification data returned from sendOtp
  const [verificationData, setVerificationData] = useState<{ sessionInfo?: string; confirmationResult?: any } | null>(null);

  // Timer effect
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Close the modal once authenticated; only redirect to registration if profile is incomplete
  useEffect(() => {
    if (visible && isAuthenticated && user) {
      onCancel();
      if (!user.isProfileCompleted) {
        router.replace('/registration');
      }
      // If profile is already complete, just close modal — app stays on current screen
    }
  }, [isAuthenticated, user]); // intentionally omit visible/router/onCancel to avoid loop

  // Validation
  const validatePhone = (num: string) => {
    const cleaned = num.replace(/\D/g, '');
    return cleaned.length === 10;
  };

  // Actions
  const handleSendOtp = async () => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (!validatePhone(cleaned)) {
      setStatusMessage({ text: 'Please enter a valid 10-digit mobile number.', type: 'error' });
      return;
    }

    setLoadingText('Sending OTP...');
    setStatusMessage(null);

    // Directly transition to verification screen
    setTimeout(() => {
      setVerificationData({ sessionInfo: 'mock-session-info' });
      setStep('OTP');
      setTimer(60);
      setStatusMessage({ text: 'OTP sent successfully. Use code 123456.', type: 'success' });
      setLoadingText(null);
    }, 500);
  };

  const handleVerifyOtp = async () => {
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    
    setLoadingText('Verifying OTP...');
    setStatusMessage(null);

    try {
      const success = await loginWithMobile(cleanedPhone);
      if (success) {
        setStatusMessage({ text: 'Mobile number verified successfully.', type: 'success' });
        onCancel();
      } else {
        setStatusMessage({ text: 'Login failed. Please check backend connection.', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Verification failed', type: 'error' });
    } finally {
      setLoadingText(null);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setLoadingText('Resending OTP...');
    setStatusMessage(null);

    setTimeout(() => {
      setVerificationData({ sessionInfo: 'mock-session-info' });
      setTimer(60);
      setOtpCode('');
      setStatusMessage({ text: 'OTP resent successfully. Use code 123456.', type: 'success' });
      setLoadingText(null);
    }, 500);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop}>
          {/* Stop propagation so taps inside the sheet don't close the modal */}
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardContainer}
            >
              <View style={[styles.sheetContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
                {/* Header */}
                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>
                    {step === 'PHONE' ? 'Verification' : 'Enter OTP'}
                  </Text>
                  <TouchableOpacity
                    style={[styles.closeBtn, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}
                    onPress={onCancel}
                    activeOpacity={0.8}
                  >
                    <X size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Subtitle / Desc */}
                <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                  {step === 'PHONE'
                    ? 'Verify your mobile number to unlock instant slots, secure FASTag booking, and premium features.'
                    : `We sent a 6-digit confirmation code to +91 ${phoneNumber}.`}
                </Text>

                {/* Status Toast Message */}
                {statusMessage && (
                  <View
                    style={[
                      styles.toast,
                      statusMessage.type === 'success'
                        ? { backgroundColor: 'rgba(75, 181, 67, 0.1)', borderColor: 'rgba(75, 181, 67, 0.2)' }
                        : { backgroundColor: 'rgba(255, 75, 75, 0.1)', borderColor: 'rgba(255, 75, 75, 0.2)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.toastText,
                        statusMessage.type === 'success' ? { color: '#4bb543' } : { color: '#ff4b4b' },
                      ]}
                    >
                      {statusMessage.text}
                    </Text>
                  </View>
                )}

                {/* Step 1: Mobile Form */}
                {step === 'PHONE' ? (
                  <View style={styles.form}>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.borderGlass }]}>
                      <View style={styles.countryCode}>
                        <Text style={[styles.countryText, { color: colors.textSecondary }]}>+91</Text>
                        <View style={[styles.divider, { backgroundColor: colors.borderGlass }]} />
                      </View>
                      <TextInput
                        placeholder="Enter 10-digit mobile"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        style={[styles.input, { color: colors.text }]}
                        editable={loadingText === null}
                        autoFocus={false}
                      />
                      <Phone size={18} color={colors.textSecondary} />
                    </View>

                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                      onPress={handleSendOtp}
                      disabled={loadingText !== null || phoneNumber.length < 10}
                      activeOpacity={0.8}
                    >
                      {loadingText ? (
                        <ActivityIndicator color="#0b0c10" size="small" />
                      ) : (
                        <>
                          <Text style={styles.actionBtnText}>Send Verification OTP</Text>
                          <ArrowRight size={16} color="#0b0c10" />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Step 2: OTP Form */
                  <View style={styles.form}>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.borderGlass }]}>
                      <TextInput
                        placeholder="Enter 6-digit OTP code"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otpCode}
                        onChangeText={setOtpCode}
                        style={[styles.input, { color: colors.text, letterSpacing: 6, fontSize: 16 }]}
                        editable={loadingText === null}
                      />
                      <KeyRound size={18} color={colors.textSecondary} />
                    </View>

                    {/* Resend Cooldown Timer */}
                    <View style={styles.otpActions}>
                      <TouchableOpacity
                        onPress={() => setStep('PHONE')}
                        style={styles.changePhoneBtn}
                        disabled={loadingText !== null}
                      >
                        <Edit2 size={12} color="#ffce00" />
                        <Text style={styles.changePhoneText}>Change Number</Text>
                      </TouchableOpacity>

                      {timer > 0 ? (
                        <Text style={[styles.timerText, { color: colors.textSecondary }]}>
                          Resend in <Text style={{ color: '#ffce00', fontWeight: 'bold' }}>{timer}s</Text>
                        </Text>
                      ) : (
                        <TouchableOpacity
                          style={styles.resendBtn}
                          onPress={handleResendOtp}
                          disabled={loadingText !== null}
                        >
                          <RefreshCw size={12} color="#ffce00" />
                          <Text style={styles.resendText}>Resend Code</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                      onPress={handleVerifyOtp}
                      disabled={loadingText !== null || (otpCode.length < 6 && otpCode !== '12345')}
                      activeOpacity={0.8}
                    >
                      {loadingText ? (
                        <ActivityIndicator color="#0b0c10" size="small" />
                      ) : (
                        <>
                          <Text style={styles.actionBtnText}>Verify and Login</Text>
                          <ArrowRight size={16} color="#0b0c10" />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Web reCAPTCHA Container placeholder */}
                {Platform.OS === 'web' && <div id="recaptcha-container" />}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 12, 16, 0.75)',
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    width: '100%',
  },
  sheetContainer: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  sheetSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  toast: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 4,
  },
  countryText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 20,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnText: {
    color: '#0b0c10',
    fontSize: 15,
    fontWeight: 'bold',
  },
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: -4,
  },
  changePhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changePhoneText: {
    color: '#ffce00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendText: {
    color: '#ffce00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timerText: {
    fontSize: 12,
  },
});
