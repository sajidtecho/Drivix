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
import { User, Mail, Phone, Lock } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!mobile.trim() || mobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        password,
      });
      onSuccess?.();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      setError(msg);
      Alert.alert('Registration Error', msg);
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
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>DRIVIX</Text>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join Drivix for seamless parking reservations and FASTag perks.
            </Text>
          </View>

          <Card style={styles.formCard}>
            <Input
              label="Full Name"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError('');
              }}
              leftIcon={<User size={18} color={Colors.textSecondary} />}
            />

            <Input
              label="Email Address"
              placeholder="e.g. rahul@example.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={18} color={Colors.textSecondary} />}
            />

            <Input
              label="Mobile Number"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChangeText={(t) => {
                setMobile(t.replace(/\D/g, '').slice(0, 10));
                setError('');
              }}
              keyboardType="phone-pad"
              leftIcon={<Phone size={18} color={Colors.textSecondary} />}
            />

            <Input
              label="Password"
              placeholder="Minimum 6 characters"
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
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              variant="primary"
              style={styles.submitBtn}
            />

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Button
                title="Sign In"
                variant="ghost"
                size="sm"
                onPress={onNavigateToLogin}
                textStyle={styles.signInLink}
              />
            </View>
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
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    backgroundColor: Colors.primaryYellow,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: Spacing.sm,
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
    marginBottom: 6,
  },
  subtitle: {
    ...Typography.subtitle,
    textAlign: 'center',
    maxWidth: 300,
  },
  formCard: {
    padding: Spacing.xl,
  },
  submitBtn: {
    marginTop: Spacing.md,
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
  signInLink: {
    color: '#171717',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
