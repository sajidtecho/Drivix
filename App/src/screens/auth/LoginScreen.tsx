import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Button, Input, Card } from '../../components/common';
import { useAuth } from '../../store/AuthContext';

export interface LoginScreenProps {
  onSuccess?: () => void;
  onNavigateToRegister?: () => void;
  onCancel?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccess,
  onNavigateToRegister,
  onCancel,
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login({
        email: cleanEmail,
        password,
      });
      onSuccess?.();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Invalid email or password. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'To reset your password, visit the Drivix website at drivix.in or contact support at support@drivix.in. An automated reset link will be sent to your registered email.',
      [{ text: 'OK' }]
    );
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      'Google Sign-In',
      'Google accounts created on the Drivix website are fully linked. You can sign in using your Google account email and password, or use Google One-Tap on the website.',
      [{ text: 'Got it' }]
    );
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
          {/* ─── 1. Drivix Branding & Logo ─── */}
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>DRIVIX</Text>
            </View>
            <Text style={styles.brandTagline}>SMART PARKING PLATFORM</Text>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your parking journey.
            </Text>
          </View>

          {/* ─── 2. Login Form Card ─── */}
          <Card style={styles.formCard}>
            {error ? (
              <View style={styles.errorBanner}>
                <AlertCircle size={16} color={Colors.error} style={styles.errorIcon} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email Input */}
            <Input
              label="Email Address"
              placeholder="e.g. name@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              leftIcon={<Mail size={18} color={Colors.textSecondary} />}
            />

            {/* Password Input */}
            <Input
              label="Password"
              placeholder="Enter your password"
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

            {/* Forgot Password Link */}
            <View style={styles.forgotRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Primary Yellow Login Button */}
            <Button
              title="Sign In"
              variant="primary"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginBtn}
            />

            {/* Divider with "OR" */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.googleBtn}
              onPress={handleGoogleSignIn}
            >
              <View style={styles.googleIconBadge}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Signup Navigation Link */}
            <View style={styles.signupPromptRow}>
              <Text style={styles.signupPromptText}>Don't have an account? </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onNavigateToRegister}
              >
                <Text style={styles.signupLinkText}>Sign up.</Text>
              </TouchableOpacity>
            </View>

            {/* Optional Skip / Explore Link */}
            {onCancel && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onCancel}
                style={styles.exploreLink}
              >
                <Text style={styles.exploreText}>Explore app without signing in</Text>
              </TouchableOpacity>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
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
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -2,
    marginBottom: Spacing.md,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  loginBtn: {
    marginTop: Spacing.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    paddingHorizontal: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  googleIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EA4335',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleIconText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  signupPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  signupPromptText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signupLinkText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171717',
    textDecorationLine: 'underline',
  },
  exploreLink: {
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingVertical: 4,
  },
  exploreText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
