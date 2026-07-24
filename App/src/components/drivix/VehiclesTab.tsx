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
} from 'react-native';
import { Car, Plus, Trash2, ShieldCheck, X, Star } from 'lucide-react-native';
import { api } from '@/services/api';
import { useTheme } from '@/hooks/use-theme';

interface Vehicle {
  _id?: string;
  id?: string;
  plate: string;
  model: string;
  type?: string;
  fuelType?: string;
  isPrimary?: boolean;
}

interface VehiclesTabProps {
  onRefreshUser: () => Promise<void>;
}

const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'CNG'];

export default function VehiclesTab({ onRefreshUser }: VehiclesTabProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const colors = useTheme();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');

  const fetchVehicles = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data || []);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVehicles(false);
  }, []);

  const handleAddVehicle = async () => {
    if (!plate.trim() || !model.trim()) {
      Alert.alert('Fields Required', 'Please enter both license plate and model.');
      return;
    }

    setSaving(true);
    try {
      const canonicalFuel = fuelType === 'Electric' ? 'EV' : fuelType;
      const response = await api.post('/vehicles', {
        plate: plate.trim().toUpperCase(),
        vehicleNumber: plate.trim().toUpperCase(),
        model: model.trim(),
        type: canonicalFuel,
        vehicleType: 'Car',
        fuelType: canonicalFuel,
      });

      if (response.data) {
        Alert.alert('Success', 'Vehicle registered successfully for automatic ANPR access.');
        setPlate('');
        setModel('');
        setFuelType('Petrol');
        setShowAddForm(false);
        await fetchVehicles();
        await onRefreshUser();
      }
    } catch (err: any) {
      console.error('Error adding vehicle:', err);
      const errMsg = err.response?.data?.message || 'Failed to add vehicle.';
      Alert.alert('Error', errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimary = async (vehicle: Vehicle) => {
    const id = vehicle._id || vehicle.id;
    if (!id) return;

    setLoading(true);
    try {
      const res = await api.put(`/vehicles/${id}/primary`);
      if (res.data) {
        Alert.alert('Success', `${vehicle.model} is now set as your primary vehicle.`);
        await fetchVehicles();
        await onRefreshUser();
      }
    } catch (err) {
      console.error('Error setting primary vehicle:', err);
      Alert.alert('Error', 'Failed to set primary vehicle.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    const id = vehicle._id || vehicle.id;
    if (!id) return;

    Alert.alert(
      'Remove Vehicle',
      `Are you sure you want to remove your ${vehicle.model} (${vehicle.plate})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.delete(`/vehicles/${id}`);
              Alert.alert('Removed', 'Vehicle removed successfully.');
              await fetchVehicles();
              await onRefreshUser();
            } catch (err) {
              console.error('Error deleting vehicle:', err);
              Alert.alert('Error', 'Failed to remove vehicle.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.tabHeader}>
        <Text style={[styles.title, { color: colors.text }]}>Registered Vehicles</Text>
        {!showAddForm && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddForm(true)}>
            <Plus size={14} color="#0b0c10" />
            <Text style={styles.addBtnText}>Add Car</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Add Vehicle Form Panel */}
      {showAddForm && (
        <View style={[styles.formCard, { backgroundColor: colors.backgroundElement, borderColor: colors.primary }]}>
          <View style={styles.formHeader}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Register New Vehicle</Text>
            <TouchableOpacity onPress={() => setShowAddForm(false)}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>License Plate Number</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass, color: colors.text }]}
            placeholder="e.g. DL 3C AY 1234"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            value={plate}
            onChangeText={setPlate}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Vehicle Model Name</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass, color: colors.text }]}
            placeholder="e.g. Honda City"
            placeholderTextColor={colors.textSecondary}
            value={model}
            onChangeText={setModel}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Fuel Type</Text>
          <View style={[styles.fuelSwitcher, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}>
            {fuelTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.fuelBtn,
                  fuelType === type && styles.fuelBtnActive,
                ]}
                onPress={() => setFuelType(type)}
              >
                <Text
                  style={[
                    styles.fuelBtnText,
                    { color: colors.textSecondary },
                    fuelType === type && styles.fuelBtnTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleAddVehicle}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#0b0c10" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Save Vehicle</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading && vehicles.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#ffce00" />
        </View>
      ) : vehicles.length > 0 ? (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
          {vehicles.map((v, index) => {
            const isPrimary = v.isPrimary || (index === 0 && !vehicles.some(veh => veh.isPrimary));

            return (
              <View
                key={v._id || v.id}
                style={[
                  styles.vehicleCard,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass },
                  isPrimary && styles.primaryCard,
                ]}
              >
                <View style={styles.carIconBlock}>
                  <Car size={24} color={isPrimary ? '#ffce00' : colors.textSecondary} />
                </View>
                <View style={styles.carDetails}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.plateText, { color: colors.text }]}>{v.plate}</Text>
                    {isPrimary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.modelText, { color: colors.textSecondary }]}>
                    {v.model} • {v.fuelType || v.type || 'Petrol'}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.starBtn}
                  onPress={() => !isPrimary && handleSetPrimary(v)}
                  disabled={isPrimary}
                  activeOpacity={isPrimary ? 1.0 : 0.7}
                >
                  <Star 
                    size={16} 
                    color={isPrimary ? '#ffce00' : colors.textSecondary} 
                    fill={isPrimary ? '#ffce00' : 'transparent'} 
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteVehicle(v)}
                >
                  <Trash2 size={16} color="#ff4b4b" />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <View style={[styles.emptyContainer, { borderColor: colors.borderGlass, backgroundColor: colors.backgroundSelected }]}>
          <Car size={40} color={colors.textSecondary} style={styles.emptyIcon} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No vehicles registered</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Add a vehicle plate number to enable smart automatic ANPR gate opening at parking entries.
          </Text>
        </View>
      )}

      <View style={[styles.anprBanner, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}>
        <ShieldCheck size={20} color="#ffce00" />
        <View style={styles.anprDetails}>
          <Text style={[styles.anprTitle, { color: colors.text }]}>ANPR Shield Active</Text>
          <Text style={[styles.anprText, { color: colors.textSecondary }]}>
            Drivix camera scanners recognize registered plates at entry check gates to auto-open barriers.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffce00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    color: '#0b0c10',
    fontSize: 11,
    fontWeight: 'bold',
  },
  centered: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: 'rgba(21, 22, 30, 0.75)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ffce00',
    padding: 16,
    marginBottom: 20,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputLabel: {
    color: '#a0aab2',
    fontSize: 11,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    color: '#ffffff',
    height: 42,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 14,
  },
  fuelSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 3,
    marginBottom: 16,
    gap: 4,
  },
  fuelBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  fuelBtnActive: {
    backgroundColor: '#ffce00',
  },
  fuelBtnText: {
    color: '#a0aab2',
    fontSize: 11,
    fontWeight: 'bold',
  },
  fuelBtnTextActive: {
    color: '#0b0c10',
  },
  submitBtn: {
    backgroundColor: '#ffce00',
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffce00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnText: {
    color: '#0b0c10',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 22, 30, 0.75)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    marginBottom: 12,
  },
  primaryCard: {
    borderColor: '#ffce00',
    backgroundColor: 'rgba(255, 206, 0, 0.03)',
  },
  carIconBlock: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  carDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plateText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  primaryBadge: {
    backgroundColor: '#ffce00',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  primaryBadgeText: {
    color: '#0b0c10',
    fontSize: 8,
    fontWeight: 'bold',
  },
  modelText: {
    color: '#a0aab2',
    fontSize: 12,
    marginTop: 2,
  },
  starBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    marginBottom: 16,
  },
  emptyIcon: {
    opacity: 0.3,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptySubtitle: {
    color: '#a0aab2',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 24,
  },
  anprBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    gap: 12,
    alignItems: 'center',
  },
  anprDetails: {
    flex: 1,
  },
  anprTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  anprText: {
    color: '#a0aab2',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
});
