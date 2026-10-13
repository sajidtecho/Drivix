import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Phone } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
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
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!emailOrPhone.trim()) {
      setError('Please enter your email or mobile number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const isEmail = emailOrPhone.includes('@');
      await login({
        email: isEmail ? emailOrPhone.trim().toLowerCase() : undefined,
        mobile: !isEmail ? emailOrPhone.trim() : undefined,
        password,
      });
      onSuccess?.();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
      setError(msg);
      Alert.alert('Login Error', msg);
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
        >
          {/* Header Branding */}
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>DRIVIX</Text>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to manage your parking bookings, vehicles, and FASTag.
            </Text>
          </View>

          {/* Form Card */}
          <Card style={styles.formCard}>
            <Input
              label="Email or Mobile Number"
              placeholder="e.g. user@drivix.com or 9876543210"
              value={emailOrPhone}
              onChangeText={(t) => {
                setEmailOrPhone(t);
                setError('');
              }}
              leftIcon={<Mail size={18} color={Colors.textSecondary} />}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setError('');
              }}
              secureTextEntry
              leftIcon={<Lock size={18} color={Colors.textSecondary} />}
            />

            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              variant="primary"
              style={styles.signInBtn}
            />

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Button
                title="Create Account"
                variant="ghost"
                size="sm"
                onPress={onNavigateToRegister}
                textStyle={styles.signUpLink}
              />
            </View>

            {onCancel && (
              <Button
                title="Explore Without Login"
                variant="outline"
                size="sm"
                onPress={onCancel}
                style={styles.cancelBtn}
              />
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
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoBadge: {
    backgroundColor: Colors.primaryYellow,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: 2,
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.subtitle,
    textAlign: 'center',
    maxWidth: 300,
  },
  formCard: {
    padding: Spacing.xl,
  },
  signInBtn: {
    marginTop: Spacing.sm,
  },
  errorBanner: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signUpLink: {
    color: '#171717',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  cancelBtn: {
    marginTop: Spacing.md,
  },
});
