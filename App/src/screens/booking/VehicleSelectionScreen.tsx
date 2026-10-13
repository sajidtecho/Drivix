import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Car,
  Plus,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { Header, Card, Button, Input, StepIndicator } from '../../components/common';
import { useBooking } from '../../store/BookingContext';
import { useAuth } from '../../store/AuthContext';
import { vehicleApi } from '../../api/vehicleApi';
import { Vehicle } from '../../types';

export interface VehicleSelectionScreenProps {
  onBack: () => void;
  onProceed: () => void;
}

export const VehicleSelectionScreen: React.FC<VehicleSelectionScreenProps> = ({
  onBack,
  onProceed,
}) => {
  const { isAuthenticated } = useAuth();
  const { vehicleNumber, vehicleName, setVehicleInfo } = useBooking();

  const [savedVehicles, setSavedVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Manual input fields
  const [inputPlate, setInputPlate] = useState<string>(vehicleNumber || '');
  const [inputModel, setInputModel] = useState<string>(vehicleName || '');
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchVehicles = async () => {
      setLoading(true);
      try {
        const list = await vehicleApi.getUserVehicles();
        setSavedVehicles(list);
        if (list.length > 0 && !inputPlate) {
          const primary = list.find((v) => v.isPrimary) || list[0];
          setSelectedVehicleId(primary._id);
          const plate = primary.plate || primary.vehicleNumber || '';
          const model = primary.model || primary.vehicleName || 'Car';
          setInputPlate(plate);
          setInputModel(model);
          setVehicleInfo(plate, model, primary._id);
        }
      } catch (err) {
        console.warn('[VehicleSelectionScreen] Error loading vehicles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, [isAuthenticated]);

  const handleSelectSavedVehicle = (v: Vehicle) => {
    setSelectedVehicleId(v._id);
    const plate = v.plate || v.vehicleNumber || '';
    const model = v.model || v.vehicleName || 'Car';
    setInputPlate(plate);
    setInputModel(model);
    setVehicleInfo(plate, model, v._id);
    setIsAddingNew(false);
    setError('');
  };

  const handleContinue = () => {
    const cleanPlate = inputPlate.toUpperCase().replace(/\s/g, '');
    if (!cleanPlate || cleanPlate.length < 4) {
      setError('Please enter a valid vehicle registration number (e.g. DL01AB1234).');
      return;
    }
    const cleanName = inputModel.trim() || 'Car';
    setVehicleInfo(cleanPlate, cleanName, selectedVehicleId);
    onProceed();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Vehicle Details"
        subtitle="Step 4 of 5"
        onBack={onBack}
      />

      <StepIndicator currentStep={4} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerInfo}>
          <Text style={styles.heading}>Select or Add Vehicle</Text>
          <Text style={styles.subheading}>
            Our ANPR entrance cameras match your number plate at the boom gate for automated instant barrier clearance.
          </Text>
        </View>

        {/* ─── Saved Vehicles Section ─── */}
        {savedVehicles.length > 0 && !isAddingNew && (
          <View style={styles.savedSection}>
            <Text style={styles.sectionTitle}>Saved Vehicles</Text>
            {savedVehicles.map((v) => {
              const isSelected = selectedVehicleId === v._id;
              return (
                <Card
                  key={v._id}
                  selected={isSelected}
                  onPress={() => handleSelectSavedVehicle(v)}
                  style={styles.savedCard}
                >
                  <View style={styles.vehicleRow}>
                    <View style={[styles.vehicleIconCircle, isSelected && styles.vehicleIconCircleSelected]}>
                      <Car size={20} color={isSelected ? '#171717' : Colors.textSecondary} />
                    </View>
                    <View style={styles.vehicleTextCol}>
                      <Text style={styles.vehiclePlateText}>
                        {v.plate || v.vehicleNumber}
                      </Text>
                      <Text style={styles.vehicleModelText}>
                        {v.model || v.vehicleName || 'Passenger Car'}
                        {v.isEV ? ' • Electric EV' : ''}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Check size={16} color="#171717" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                </Card>
              );
            })}

            <Button
              title="+ Use Different Vehicle"
              variant="outline"
              size="sm"
              onPress={() => {
                setIsAddingNew(true);
                setSelectedVehicleId(null);
                setInputPlate('');
                setInputModel('');
              }}
              style={styles.addDifferentBtn}
            />
          </View>
        )}

        {/* ─── Manual Input Section ─── */}
        {(savedVehicles.length === 0 || isAddingNew) && (
          <Card style={styles.formCard}>
            <Text style={styles.formCardTitle}>Vehicle Information</Text>

            <Input
              label="Vehicle Registration Number"
              placeholder="e.g. DL01AB1234 or UP16BZ9999"
              value={inputPlate}
              onChangeText={(t) => {
                setInputPlate(t.toUpperCase());
                setError('');
              }}
              autoCapitalize="characters"
              leftIcon={<Car size={18} color={Colors.textSecondary} />}
            />

            <Input
              label="Vehicle Model / Brand"
              placeholder="e.g. Tata Nexon EV, Hyundai Creta, Honda City"
              value={inputModel}
              onChangeText={setInputModel}
            />

            {savedVehicles.length > 0 && isAddingNew && (
              <Button
                title="Cancel & Choose Saved Vehicle"
                variant="ghost"
                size="sm"
                onPress={() => setIsAddingNew(false)}
              />
            )}
          </Card>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Notice on Gate Automation */}
        <View style={styles.noticeBox}>
          <ShieldCheck size={18} color="#15803D" />
          <Text style={styles.noticeText}>
            Ensure your plate number is accurate. Gate camera will automatically detect your vehicle number and lift the entrance barrier.
          </Text>
        </View>
      </ScrollView>

      {/* ─── Bottom Footer CTA ─── */}
      <View style={styles.footerContainer}>
        <Button
          title="Review Booking Summary"
          variant="primary"
          icon={<ArrowRight size={18} color="#171717" />}
          iconPosition="right"
          onPress={handleContinue}
          style={styles.continueBtn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 110,
  },
  headerInfo: {
    marginBottom: Spacing.lg,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  savedSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  savedCard: {
    marginBottom: 10,
    paddingVertical: 12,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleIconCircleSelected: {
    backgroundColor: Colors.primaryYellow,
  },
  vehicleTextCol: {
    flex: 1,
  },
  vehiclePlateText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  vehicleModelText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDifferentBtn: {
    marginTop: 6,
  },
  formCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  formCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 10,
    marginTop: Spacing.md,
  },
  noticeText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  continueBtn: {
    width: '100%',
  },
});
