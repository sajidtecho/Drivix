import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Mail, Lock, User as UserIcon, Phone, MapPin, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen({ onCancel }: { onCancel?: () => void } = {}) {
  const { login, register, error, clearError } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Field Focus States
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setValidationError(null);
    clearError();
    // Clear inputs when swapping modes
    setEmail('');
    setPassword('');
    setFullName('');
    setMobile('');
    setCity('');
  };

  const handleValidate = (): boolean => {
    setValidationError(null);

    if (!email || !password) {
      setValidationError('Please fill in all credentials.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address.');
      return false;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return false;
    }

    if (!isLoginMode) {
      if (!fullName) {
        setValidationError('Please enter your full name.');
        return false;
      }
      if (!mobile) {
        setValidationError('Please enter your mobile number.');
        return false;
      }
      if (!city) {
        setValidationError('Please enter your city.');
        return false;
      }
      const phoneRegex = /^[0-9+-\s]{8,15}$/;
      if (!phoneRegex.test(mobile)) {
        setValidationError('Please enter a valid mobile number.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!handleValidate()) return;

    setLoading(true);
    try {
      if (isLoginMode) {
        await login(email.trim(), password);
      } else {
        await register(
          fullName.trim(),
          email.trim(),
          password,
          mobile.trim(),
          city.trim()
        );
      }
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeError = validationError || error;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Futuristic Header */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/Logo.png')}
            style={styles.logoImage}
            contentFit="contain"
          />
          <Text style={styles.subtitle}>Smart Parking Ecosystem</Text>
        </View>

        {/* Central Auth Card */}
        <View style={styles.authCard}>
          <Text style={styles.cardTitle}>
            {isLoginMode ? 'Access Portal' : 'Create Credentials'}
          </Text>

          {activeError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{activeError}</Text>
            </View>
          )}

          {/* Form Fields */}
          {!isLoginMode && (
            <View style={[styles.inputWrapper, focusedField === 'name' && styles.focusedInput]}>
              <UserIcon size={20} color={focusedField === 'name' ? '#ffce00' : '#a0aab2'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#60646c"
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={[styles.inputWrapper, focusedField === 'email' && styles.focusedInput]}>
            <Mail size={20} color={focusedField === 'email' ? '#ffce00' : '#a0aab2'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#60646c"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {!isLoginMode && (
            <>
              <View style={[styles.inputWrapper, focusedField === 'mobile' && styles.focusedInput]}>
                <Phone size={20} color={focusedField === 'mobile' ? '#ffce00' : '#a0aab2'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mobile Number"
                  placeholderTextColor="#60646c"
                  value={mobile}
                  onChangeText={setMobile}
                  onFocus={() => setFocusedField('mobile')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={[styles.inputWrapper, focusedField === 'city' && styles.focusedInput]}>
                <MapPin size={20} color={focusedField === 'city' ? '#ffce00' : '#a0aab2'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor="#60646c"
                  value={city}
                  onChangeText={setCity}
                  onFocus={() => setFocusedField('city')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="words"
                />
              </View>
            </>
          )}

          <View style={[styles.inputWrapper, focusedField === 'password' && styles.focusedInput]}>
            <Lock size={20} color={focusedField === 'password' ? '#ffce00' : '#a0aab2'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#60646c"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              {showPassword ? (
                <EyeOff size={20} color="#a0aab2" />
              ) : (
                <Eye size={20} color="#a0aab2" />
              )}
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#0b0c10" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isLoginMode ? 'Access Portal' : 'Register Vehicle'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle Link */}
          <TouchableOpacity onPress={toggleMode} style={styles.toggleLinkContainer}>
            <Text style={styles.toggleLinkText}>
              {isLoginMode
                ? "Don't have credentials? Sign Up"
                : 'Already have credentials? Log In'}
            </Text>
          </TouchableOpacity>

          {onCancel && (
            <TouchableOpacity onPress={onCancel} style={styles.cancelLinkContainer}>
              <Text style={styles.cancelLinkText}>Explore as Guest</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Demo Credentials Alert (Only in Login Mode) */}
        {isLoginMode && (
          <View style={styles.demoAlert}>
            <Text style={styles.demoTitle}>💡 Demo Testing Credentials:</Text>
            <Text style={styles.demoText}>Email: <Text style={styles.demoCode}>user@drivix.com</Text></Text>
            <Text style={styles.demoText}>Password: <Text style={styles.demoCode}>123456</Text></Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c10', // Deep Celestial Dark Primary BG
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 220,
    height: 70,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#a0aab2',
    letterSpacing: 1,
  },
  authCard: {
    backgroundColor: '#15161e', // Secondary Celestial BG
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)', // Thin Glass Panel Border
    shadowColor: '#ffce00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 75, 75, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.3)',
  },
  errorText: {
    color: '#ff4b4b', // Ruby Red Error
    fontSize: 13,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 52,
  },
  focusedInput: {
    borderColor: '#ffce00', // Gold focus glow matching premium Drivix brand
    backgroundColor: 'rgba(255, 206, 0, 0.03)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
  },
  submitBtn: {
    backgroundColor: '#ffce00', // Gold primary CTA
    borderRadius: 24, // rounded-xl from Aura Kinetic
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#ffce00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnText: {
    color: '#0b0c10', // Dark contrast text
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  toggleLinkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleLinkText: {
    color: '#ffce00',
    fontSize: 14,
    fontWeight: '600',
  },
  demoAlert: {
    marginTop: 32,
    backgroundColor: 'rgba(0, 242, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.12)',
  },
  demoTitle: {
    color: '#00f2ff', // Cyber Cyan for secondary details
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 6,
  },
  demoText: {
    color: '#a0aab2',
    fontSize: 13,
    marginTop: 4,
  },
  demoCode: {
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  cancelLinkContainer: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelLinkText: {
    color: '#ffce00',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
    opacity: 0.8,
  },
});

