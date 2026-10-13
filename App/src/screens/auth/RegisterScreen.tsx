import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Check,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Button, Input, Card } from '../../components/common';
import { useAuth } from '../../store/AuthContext';

export interface RegisterScreenProps {
  onSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onSuccess,
  onNavigateToLogin,
}) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password requirement tests
  const isLengthValid = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSpecial = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleRegister = async () => {
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim().replace(/\D/g, '');

    if (!cleanName) {
      setError('Please enter your full name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!isLengthValid) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms & Conditions and Privacy Policy.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register({
        name: cleanName,
        email: cleanEmail,
        password,
        mobile: cleanMobile || '',
      });
      onSuccess?.();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── 1. Header Branding ─── */}
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>DRIVIX</Text>
            </View>
            <Text style={styles.brandTagline}>SMART PARKING PLATFORM</Text>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>
              Join Drivix for a smarter parking experience.
            </Text>
          </View>

          {/* ─── 2. Signup Form Card ─── */}
          <Card style={styles.formCard}>
            {error ? (
              <View style={styles.errorBanner}>
                <AlertCircle size={16} color={Colors.error} style={styles.errorIcon} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Full Name */}
            <Input
              label="Full Name"
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (error) setError('');
              }}
              autoCapitalize="words"
              leftIcon={<UserIcon size={18} color={Colors.textSecondary} />}
            />

            {/* Email Address */}
            <Input
              label="Email Address"
              placeholder="e.g. rahul@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={<Mail size={18} color={Colors.textSecondary} />}
            />

            {/* Mobile Number (Optional) */}
            <Input
              label="Mobile Number (Optional)"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChangeText={(text) => {
                setMobile(text.replace(/\D/g, '').slice(0, 10));
                if (error) setError('');
              }}
              keyboardType="phone-pad"
              leftIcon={<Phone size={18} color={Colors.textSecondary} />}
            />

            {/* Password */}
            <Input
              label="Password"
              placeholder="Create a strong password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError('');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              leftIcon={<Lock size={18} color={Colors.textSecondary} />}
              rightIcon={
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={Colors.textSecondary} />
                  ) : (
                    <Eye size={18} color={Colors.textSecondary} />
                  )}
                </TouchableOpacity>
              }
            />

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (error) setError('');
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              leftIcon={<Lock size={18} color={Colors.textSecondary} />}
              rightIcon={
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color={Colors.textSecondary} />
                  ) : (
                    <Eye size={18} color={Colors.textSecondary} />
                  )}
                </TouchableOpacity>
              }
            />

            {/* ─── Password Requirements Checklist ─── */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              
              <View style={styles.reqRow}>
                {isLengthValid ? (
                  <CheckCircle size={14} color={Colors.success} />
                ) : (
                  <XCircle size={14} color={Colors.textMuted} />
                )}
                <Text
                  style={[
                    styles.reqText,
                    isLengthValid && styles.reqTextValid,
                  ]}
                >
                  At least 6 characters
                </Text>
              </View>

              <View style={styles.reqRow}>
                {hasLetter ? (
                  <CheckCircle size={14} color={Colors.success} />
                ) : (
                  <XCircle size={14} color={Colors.textMuted} />
                )}
                <Text
                  style={[
                    styles.reqText,
                    hasLetter && styles.reqTextValid,
                  ]}
                >
                  Contains letters
                </Text>
              </View>

              <View style={styles.reqRow}>
                {hasNumberOrSpecial ? (
                  <CheckCircle size={14} color={Colors.success} />
                ) : (
                  <XCircle size={14} color={Colors.textMuted} />
                )}
                <Text
                  style={[
                    styles.reqText,
                    hasNumberOrSpecial && styles.reqTextValid,
                  ]}
                >
                  Contains a number or symbol
                </Text>
              </View>

              {confirmPassword.length > 0 && (
                <View style={styles.reqRow}>
                  {passwordsMatch ? (
                    <CheckCircle size={14} color={Colors.success} />
                  ) : (
                    <XCircle size={14} color={Colors.error} />
                  )}
                  <Text
                    style={[
                      styles.reqText,
                      passwordsMatch ? styles.reqTextValid : styles.reqTextError,
                    ]}
                  >
                    Passwords match
                  </Text>
                </View>
              )}
            </View>

            {/* ─── Terms and Conditions Checkbox ─── */}
            <View style={styles.termsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setAgreeTerms((prev) => !prev)}
                style={[
                  styles.checkbox,
                  agreeTerms && styles.checkboxChecked,
                ]}
              >
                {agreeTerms && <Check size={14} color="#171717" strokeWidth={3} />}
              </TouchableOpacity>
              <View style={styles.termsTextWrap}>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={() => setShowTermsModal(true)}
                  >
                    Terms & Conditions
                  </Text>
                  {' '}and{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={() => setShowTermsModal(true)}
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>
            </View>

            {/* Primary Yellow Create Account Button */}
            <Button
              title="Create Account"
              variant="primary"
              onPress={handleRegister}
              loading={loading}
              style={styles.submitBtn}
            />

            {/* Login Navigation Link */}
            <View style={styles.loginPromptRow}>
              <Text style={styles.loginPromptText}>Already have an account? </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onNavigateToLogin}
              >
                <Text style={styles.loginLinkText}>Log in.</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Terms & Conditions Modal ─── */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms & Conditions</Text>
              <TouchableOpacity
                onPress={() => setShowTermsModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalBodyText}>
                <Text style={styles.boldText}>1. Service Agreement:{'\n'}</Text>
                Drivix provides a digital smart parking reservation platform. By creating an account, you enter into a "License to Occupy" agreement with the parking facility operator as per applicable laws.{'\n\n'}
                <Text style={styles.boldText}>2. Shared Account Sync:{'\n'}</Text>
                Your Drivix account is unified across both the Drivix mobile application and web portal. The credentials you provide can be used interchangeably on both platforms.{'\n\n'}
                <Text style={styles.boldText}>3. Liability & Safety:{'\n'}</Text>
                All parked vehicles must maintain valid insurance. Drivix assists in reservation logistics and is not liable for theft, accidental damage, or belongings left inside unattended vehicles.{'\n\n'}
                <Text style={styles.boldText}>4. Cancellation & Refunds:{'\n'}</Text>
                Reservations may be modified or cancelled prior to the booked entry window according to facility policies.
              </Text>
            </ScrollView>

            <Button
              title="I Understand & Agree"
              variant="primary"
              onPress={() => {
                setAgreeTerms(true);
                setShowTermsModal(false);
              }}
              style={styles.modalAgreeBtn}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    backgroundColor: Colors.primaryYellow,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: 2.5,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 20,
    fontWeight: '500',
  },
  formCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600',
  },
  requirementsContainer: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reqText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  reqTextValid: {
    color: Colors.success,
    fontWeight: '700',
  },
  reqTextError: {
    color: Colors.error,
    fontWeight: '600',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primaryYellow,
    borderColor: Colors.primaryYellow,
  },
  termsTextWrap: {
    flex: 1,
  },
  termsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  termsLink: {
    fontWeight: '800',
    color: '#171717',
    textDecorationLine: 'underline',
  },
  submitBtn: {
    marginTop: Spacing.xs,
  },
  loginPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  loginPromptText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171717',
    textDecorationLine: 'underline',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    marginBottom: Spacing.lg,
  },
  modalBodyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalAgreeBtn: {
    marginTop: Spacing.sm,
  },
});
