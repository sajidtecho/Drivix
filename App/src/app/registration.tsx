import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, User, Mail, CreditCard, Car, Type, Tag, Eye } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/services/api';

export default function RegistrationScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { user, refreshProfile, logout } = useAuth();

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [drivingLicence, setDrivingLicence] = useState('');
  
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Car'); // default Car
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Autofill mobile number from profile
  const mobile = user?.mobile || '';

  // Redirect returning users if profile already complete
  useEffect(() => {
    if (user?.isProfileCompleted) {
      router.replace('/');
    }
  }, [user, router]);

  // Handle Scanning Number Plate
  const handleScanPlate = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Camera permissions are required to scan number plates.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setScanning(true);
        // Simulate OCR extraction with a delay
        setTimeout(() => {
          setScanning(false);
          const detectedPlate = 'UP16AB1234';
          setVehicleNumber(detectedPlate);
          Alert.alert(
            'Plate Detected',
            `OCR successfully detected registration number: ${detectedPlate}. You can modify this if needed.`,
            [{ text: 'OK' }]
          );
        }, 1500);
      }
    } catch (err: any) {
      console.error('Camera capture failed:', err);
      Alert.alert('Error', 'Failed to open the camera.');
    }
  };

  // Form Validation
  const validateForm = () => {
    if (fullName.trim().length < 3) {
      Alert.alert('Validation Error', 'Full Name is required and must be at least 3 characters.');
      return false;
    }

    if (email.trim() !== '') {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email.trim())) {
        Alert.alert('Validation Error', 'Please enter a valid email address.');
        return false;
      }
    }

    // Driving Licence: state code (2 letters) + 8 to 14 alphanumeric chars (standard Indian format)
    const dlClean = drivingLicence.replace(/[-\s]/g, '').toUpperCase();
    const dlRegex = /^[A-Z]{2}[a-zA-Z0-9]{8,14}$/;
    if (!dlRegex.test(dlClean)) {
      Alert.alert('Validation Error', 'Please enter a valid Driving Licence number (e.g. UP1420220001234).');
      return false;
    }

    // Vehicle Number: standard Indian format, e.g. UP16AB1234
    const plateClean = vehicleNumber.replace(/[-\s]/g, '').toUpperCase();
    const plateRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
    if (!plateRegex.test(plateClean)) {
      Alert.alert('Validation Error', 'Please enter a valid Indian vehicle number (e.g. UP16AB1234, DL8CAF9876).');
      return false;
    }

    return true;
  };

  // Form Submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const dlClean = drivingLicence.replace(/[-\s]/g, '').toUpperCase();
      const plateClean = vehicleNumber.replace(/[-\s]/g, '').toUpperCase();

      // 1. Update user profile details
      await api.put('/auth/profile', {
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        drivingLicence: dlClean,
        isProfileCompleted: true,
      });

      // 2. Create primary vehicle
      await api.post('/vehicles', {
        vehicleNumber: plateClean,
        vehicleType,
        brand: brand.trim() || 'Generic',
        model: model.trim() || 'Generic',
        color: color.trim() || 'Generic',
        fuelType: vehicleType === 'EV' ? 'EV' : 'Petrol', // automatically maps EV type to EV fuel
      });

      // Refresh the context user session from the backend database
      await refreshProfile();

      Alert.alert(
        'Success',
        'Registration Completed Successfully',
        [
          {
            text: 'Proceed to Bookings',
            onPress: () => router.replace('/'),
          },
        ]
      );
    } catch (err: any) {
      console.error('Registration failed:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to complete registration.';
      Alert.alert('Registration Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const vehicleTypes = ['Bike', 'Car', 'SUV', 'EV'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.stepLabel, { color: colors.primary }]}>STEP 1 OF 1</Text>
              <Text style={[styles.title, { color: colors.text }]}>Profile & Vehicle Registration</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutTextBtn}>
              <Text style={styles.logoutText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Section 1: Personal Details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Details</Text>

            {/* Name */}
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
              <User size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="Full Name (Required)"
                placeholderTextColor={colors.textSecondary}
                value={fullName}
                onChangeText={setFullName}
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            {/* Mobile Number (Read-only) */}
            <View style={[styles.inputWrapper, styles.disabledInput, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}>
              <PhoneIcon size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                value={mobile}
                editable={false}
                style={[styles.input, { color: colors.textSecondary }]}
              />
            </View>

            {/* Email Address */}
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
              <Mail size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="Email Address (Optional)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            {/* Driving Licence */}
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
              <CreditCard size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="Driving Licence Number (Required)"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
                value={drivingLicence}
                onChangeText={setDrivingLicence}
                style={[styles.input, { color: colors.text }]}
              />
            </View>
          </View>

          {/* Section 2: Vehicle Details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Vehicle Details</Text>

            {/* Vehicle Number with Camera Scanner */}
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
              <Car size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="Vehicle Number (e.g. UP16AB1234)"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                style={[styles.input, { color: colors.text }]}
              />
              <TouchableOpacity
                onPress={handleScanPlate}
                style={[styles.scanBtn, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}
                disabled={scanning}
                activeOpacity={0.8}
              >
                {scanning ? (
                  <ActivityIndicator size="small" color="#ffce00" />
                ) : (
                  <Camera size={18} color="#ffce00" />
                )}
              </TouchableOpacity>
            </View>

            {/* Vehicle Type Selector Segment */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Vehicle Type</Text>
            <View style={styles.segmentContainer}>
              {vehicleTypes.map((type) => {
                const isSelected = vehicleType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setVehicleType(type)}
                    style={[
                      styles.segmentBtn,
                      isSelected
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        isSelected ? { color: '#0b0c10', fontWeight: 'bold' } : { color: colors.textSecondary },
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Brand */}
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
              <Type size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="Vehicle Brand (Optional)"
                placeholderTextColor={colors.textSecondary}
                value={brand}
                onChangeText={setBrand}
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            {/* Model */}
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
              <Tag size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="Vehicle Model (Optional)"
                placeholderTextColor={colors.textSecondary}
                value={model}
                onChangeText={setModel}
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            {/* Color */}
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
              <Eye size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="Vehicle Color (Optional)"
                placeholderTextColor={colors.textSecondary}
                value={color}
                onChangeText={setColor}
                style={[styles.input, { color: colors.text }]}
              />
            </View>
          </View>

          {/* Action button */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#0b0c10" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Save & Continue</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Simple Phone Icon helper since ShieldCheck etc are used
function PhoneIcon(props: any) {
  return <Text style={{ color: props.color, fontSize: 16 }}>📞</Text>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c10',
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  logoutTextBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  logoutText: {
    color: '#ff4b4b',
    fontWeight: 'bold',
    fontSize: 14,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
  },
  disabledInput: {
    opacity: 0.8,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
  },
  scanBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  segmentContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    color: '#0b0c10',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
