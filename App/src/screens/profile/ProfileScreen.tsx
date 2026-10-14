import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  ActivityIndicator,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User as UserIcon,
  Car,
  Receipt,
  Bell,
  MapPin,
  Headphones,
  FileText,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Zap,
  Send,
  MessageSquare,
  Clock,
  Star,
  AlertCircle,
  ExternalLink,
  UploadCloud,
  RefreshCw,
  FileCheck,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../store/AuthContext';
import { vehicleApi } from '../../api/vehicleApi';
import { complaintApi, Complaint } from '../../api/complaintApi';
import { Vehicle, VehicleDocument } from '../../types';
import {
  calculateDocumentStatus,
  getDefaultVehicleDocuments,
} from '../../services/vehicleCareServices';


interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  // ─── Vehicle Modal State ───────────────────────────────────────────
  const [vehiclesModalVisible, setVehiclesModalVisible] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newType, setNewType] = useState<'Car' | 'SUV' | 'Bike' | 'EV'>('Car');
  const [newIsEV, setNewIsEV] = useState(false);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  // ─── Support / Complaint Modal State ───────────────────────────────
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [activeSupportTab, setActiveSupportTab] = useState<'new' | 'history'>('new');
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintBookingId, setComplaintBookingId] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  // ─── Digital Vehicle Document Vault State ─────────────────────────
  const [vaultModalVisible, setVaultModalVisible] = useState(false);
  const [selectedVaultPlate, setSelectedVaultPlate] = useState<string>('');
  const [vaultDocuments, setVaultDocuments] = useState<VehicleDocument[]>([]);
  const [showAddDocForm, setShowAddDocForm] = useState(false);
  const [newDocType, setNewDocType] = useState<'RC' | 'Insurance' | 'PUCC' | 'Driving License'>('Insurance');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newDocExpiry, setNewDocExpiry] = useState('');
  const [newDocIssuer, setNewDocIssuer] = useState('');

  const handleOpenVault = (plate?: string) => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    const defaultPlate =
      plate ||
      (vehicles.length > 0 ? vehicles[0].plate || vehicles[0].vehicleNumber || 'DL01AB1234' : 'DL01AB1234');
    setSelectedVaultPlate(defaultPlate);
    setVaultDocuments(getDefaultVehicleDocuments(defaultPlate));
    setVaultModalVisible(true);
  };

  const handleSelectVaultPlate = (plate: string) => {
    setSelectedVaultPlate(plate);
    setVaultDocuments(getDefaultVehicleDocuments(plate));
  };

  const handleRenewDocument = (doc: VehicleDocument) => {
    Alert.alert(
      `Instant Renewal: ${doc.type}`,
      `Connecting to certified Parivahan / Insurance partner for ${doc.issuer || doc.type} (${doc.documentNumber}).\n\nYour renewal status will reflect in Drivix upon completion.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Renewal Link',
          onPress: () => {
            const url =
              doc.type === 'Insurance'
                ? 'https://www.policybazaar.com/motor-insurance/'
                : 'https://parivahan.gov.in/parivahan/';
            Linking.openURL(url).catch(() => {
              Alert.alert('Notice', 'Web portal opened in demo preview.');
            });
          },
        },
      ]
    );
  };

  const handleSaveNewDoc = () => {
    if (!newDocNumber.trim()) {
      Alert.alert('Missing Number', 'Please enter your document or policy registration number.');
      return;
    }
    const calc = calculateDocumentStatus(newDocExpiry || '2028-06-30');
    const createdDoc: VehicleDocument = {
      id: `doc_${Date.now()}`,
      type: newDocType,
      documentNumber: newDocNumber.trim().toUpperCase(),
      expiryDate: newDocExpiry.trim() || '2028-06-30',
      issuer: newDocIssuer.trim() || 'Government Authority',
      status: calc.status,
      daysRemaining: calc.daysRemaining,
    };
    setVaultDocuments((prev) => [createdDoc, ...prev]);
    setShowAddDocForm(false);
    setNewDocNumber('');
    setNewDocExpiry('');
    setNewDocIssuer('');
    Alert.alert('Document Vault Encrypted', `${newDocType} has been secured to ${selectedVaultPlate || 'your vehicle'}.`);
  };

  // Load vehicles when modal opens or authenticated
  const loadUserVehicles = async () => {
    if (!isAuthenticated) return;
    setLoadingVehicles(true);
    try {
      const data = await vehicleApi.getUserVehicles();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('[ProfileScreen] Could not load vehicles:', err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Load complaints
  const loadUserComplaints = async () => {
    if (!isAuthenticated) return;
    setLoadingComplaints(true);
    try {
      const data = await complaintApi.getMyComplaints();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('[ProfileScreen] Could not load complaints:', err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleOpenVehicles = () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    setVehiclesModalVisible(true);
    loadUserVehicles();
  };

  const handleOpenSupport = () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    setSupportModalVisible(true);
    loadUserComplaints();
  };

  const handleAddVehicle = async () => {
    const cleanPlate = newPlate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanModel = newModel.trim();

    if (!cleanPlate || cleanPlate.length < 6) {
      Alert.alert('Invalid Plate', 'Please enter a valid registration number (e.g. DL01AB1234).');
      return;
    }
    if (!cleanModel) {
      Alert.alert('Vehicle Model', 'Please specify your car model (e.g. Honda City).');
      return;
    }

    setIsAddingVehicle(true);
    try {
      await vehicleApi.addVehicle({
        plate: cleanPlate,
        model: cleanModel,
        type: newType,
        isEV: newIsEV,
      });
      setNewPlate('');
      setNewModel('');
      setShowAddVehicleForm(false);
      await loadUserVehicles();
      Alert.alert('Vehicle Added', `Vehicle ${cleanPlate} has been saved to your profile.`);
    } catch (err: any) {
      Alert.alert('Add Failed', err.response?.data?.message || err.message || 'Could not save vehicle.');
    } finally {
      setIsAddingVehicle(false);
    }
  };

  const handleDeleteVehicle = (vehicleId: string, plate?: string) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to remove vehicle ${plate || ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await vehicleApi.deleteVehicle(vehicleId);
              await loadUserVehicles();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Could not delete vehicle.');
            }
          },
        },
      ]
    );
  };

  const handleSetPrimary = async (vehicleId: string) => {
    try {
      await vehicleApi.setPrimaryVehicle(vehicleId);
      await loadUserVehicles();
    } catch (err: any) {
      Alert.alert('Notice', err.response?.data?.message || 'Could not update primary vehicle.');
    }
  };

  const handleSubmitComplaint = async () => {
    if (!complaintTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a brief subject/title for your ticket.');
      return;
    }
    if (!complaintDescription.trim()) {
      Alert.alert('Description Required', 'Please provide details about your issue.');
      return;
    }

    setIsSubmittingComplaint(true);
    try {
      await complaintApi.createComplaint({
        title: complaintTitle.trim(),
        description: complaintDescription.trim(),
        bookingId: complaintBookingId.trim() || undefined,
        contact: user?.mobile || user?.phone || '',
        email: user?.email || '',
      });
      setComplaintTitle('');
      setComplaintDescription('');
      setComplaintBookingId('');
      Alert.alert('Ticket Submitted', 'Our customer support operations team has received your ticket and will assist you shortly.');
      setActiveSupportTab('history');
      await loadUserComplaints();
    } catch (err: any) {
      Alert.alert('Submission Error', err.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out of your Drivix account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleTerms = () => {
    Alert.alert(
      'Terms & Privacy Policy',
      'Drivix adheres to smart parking security, encrypted payments, and dynamic space management guidelines. Your personal and vehicle data is securely encrypted under Indian IT & data privacy frameworks.',
      [{ text: 'Close' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Account & Profile</Text>
        </View>

        {/* User Card or Guest Banner */}
        {isAuthenticated && user ? (
          <Card style={styles.userCard}>
            <View style={styles.userRow}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarText}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.fullName || user.name || 'Drivix User'}</Text>
                <Text style={styles.userEmail}>{user.email || 'user@drivix.io'}</Text>
                {(user.phone || user.mobile) && (
                  <Text style={styles.userPhone}>{user.phone || user.mobile}</Text>
                )}
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {user.role === 'admin' ? 'SYSTEM ADMIN' : 'VERIFIED DRIVER'}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        ) : (
          <Card style={styles.guestCard}>
            <View style={styles.guestContent}>
              <View style={styles.guestIconWrap}>
                <UserIcon size={28} color={Colors.textPrimary} />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={styles.guestTitle}>Welcome to Drivix</Text>
                <Text style={styles.guestSubtitle}>
                  Sign in to reserve parking spots, save vehicles, and access active tickets.
                </Text>
              </View>
            </View>
            <Button
              title="Sign In / Register"
              variant="primary"
              onPress={() => navigation.navigate('Login')}
              style={{ marginTop: Spacing.md }}
            />
          </Card>
        )}

        {/* Vehicle & Quick Parking Management */}
        <Text style={styles.sectionHeader}>PARKING & VEHICLES</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('My Bookings')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={styles.iconCircle}>
                <Receipt size={18} color={Colors.textPrimary} />
              </View>
              <Text style={styles.menuText}>Booking History & Passes</Text>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleOpenVehicles}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={styles.iconCircle}>
                <Car size={18} color={Colors.textPrimary} />
              </View>
              <View>
                <Text style={styles.menuText}>Saved Vehicles</Text>
                <Text style={styles.menuSubtext}>Manage plates, models & EV status</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleOpenVault()}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, styles.vaultIconCircle]}>
                <ShieldCheck size={18} color={Colors.primaryYellow} />
              </View>
              <View>
                <View style={styles.menuItemRow}>
                  <Text style={styles.menuText}>Digital Document Vault</Text>
                  <View style={styles.featurePill}>
                    <Text style={styles.featurePillText}>CARE</Text>
                  </View>
                </View>
                <Text style={styles.menuSubtext}>RC, Insurance & PUCC with expiry alerts</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Preferences */}
        <Text style={styles.sectionHeader}>PREFERENCES</Text>
        <Card style={styles.menuCard}>
          <View style={styles.switchItem}>
            <View style={styles.menuLeft}>
              <View style={styles.iconCircle}>
                <Bell size={18} color={Colors.textPrimary} />
              </View>
              <View>
                <Text style={styles.menuText}>Slot & Ticket Alerts</Text>
                <Text style={styles.menuSubtext}>Departure reminders & extension alerts</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: Colors.border, true: Colors.primaryYellow }}
              thumbColor={Colors.background}
            />
          </View>

          <View style={styles.menuDivider} />

          <View style={styles.switchItem}>
            <View style={styles.menuLeft}>
              <View style={styles.iconCircle}>
                <MapPin size={18} color={Colors.textPrimary} />
              </View>
              <View>
                <Text style={styles.menuText}>Location Services</Text>
                <Text style={styles.menuSubtext}>For nearby parking and arrival detection</Text>
              </View>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: Colors.border, true: Colors.primaryYellow }}
              thumbColor={Colors.background}
            />
          </View>
        </Card>

        {/* Support & Legal */}
        <Text style={styles.sectionHeader}>SUPPORT & ABOUT</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={handleOpenSupport} activeOpacity={0.7}>
            <View style={styles.menuLeft}>
              <View style={styles.iconCircle}>
                <Headphones size={18} color={Colors.textPrimary} />
              </View>
              <View>
                <Text style={styles.menuText}>24/7 Help Desk & Complaints</Text>
                <Text style={styles.menuSubtext}>Submit issues & view resolution status</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleTerms} activeOpacity={0.7}>
            <View style={styles.menuLeft}>
              <View style={styles.iconCircle}>
                <FileText size={18} color={Colors.textPrimary} />
              </View>
              <Text style={styles.menuText}>Terms & Privacy Policy</Text>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Auth Action */}
        {isAuthenticated && (
          <View style={styles.logoutWrap}>
            <Button
              title="Log Out"
              variant="outline"
              onPress={handleLogout}
              style={styles.logoutButton}
            />
          </View>
        )}

        {/* App Version Info */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Drivix Mobile • v1.0.0 (Production API Sync)</Text>
          <Text style={styles.copyrightText}>© 2026 Drivix Smart Mobility. All rights reserved.</Text>
        </View>
      </ScrollView>

      {/* ─── SAVED VEHICLES MODAL ─────────────────────────────────────── */}
      <Modal
        visible={vehiclesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVehiclesModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Saved Vehicles</Text>
                <Text style={styles.modalSubtitle}>Manage your registered cars and EV profiles</Text>
              </View>
              <TouchableOpacity onPress={() => setVehiclesModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {loadingVehicles ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="small" color={Colors.primaryYellow} />
                  <Text style={styles.loadingText}>Syncing vehicles with database...</Text>
                </View>
              ) : vehicles.length === 0 && !showAddVehicleForm ? (
                <View style={styles.emptyVehicles}>
                  <Car size={36} color={Colors.textMuted} />
                  <Text style={styles.emptyVehiclesTitle}>No vehicles saved yet</Text>
                  <Text style={styles.emptyVehiclesText}>
                    Add your car license plate once and enjoy one-tap reservations.
                  </Text>
                  <Button
                    title="Add Vehicle"
                    variant="primary"
                    onPress={() => setShowAddVehicleForm(true)}
                    style={{ marginTop: Spacing.md }}
                  />
                </View>
              ) : (
                <>
                  {!showAddVehicleForm && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setShowAddVehicleForm(true)}
                      style={styles.addVehicleBar}
                    >
                      <Plus size={18} color="#171717" />
                      <Text style={styles.addVehicleBarText}>Register New Vehicle</Text>
                    </TouchableOpacity>
                  )}

                  {showAddVehicleForm && (
                    <Card style={styles.addVehicleCard}>
                      <View style={styles.addCardHeader}>
                        <Text style={styles.addCardTitle}>Vehicle Details</Text>
                        <TouchableOpacity onPress={() => setShowAddVehicleForm(false)}>
                          <Text style={styles.cancelLink}>Cancel</Text>
                        </TouchableOpacity>
                      </View>

                      <Input
                        label="License Plate Number"
                        placeholder="e.g. DL01AB1234"
                        value={newPlate}
                        onChangeText={setNewPlate}
                        autoCapitalize="characters"
                      />

                      <Input
                        label="Model / Make"
                        placeholder="e.g. Honda City / Tata Nexon"
                        value={newModel}
                        onChangeText={setNewModel}
                      />

                      {/* Vehicle Type Chips */}
                      <Text style={styles.chipLabel}>Vehicle Category</Text>
                      <View style={styles.typeChipsRow}>
                        {(['Car', 'SUV', 'Bike', 'EV'] as const).map((t) => (
                          <TouchableOpacity
                            key={t}
                            onPress={() => {
                              setNewType(t);
                              if (t === 'EV') setNewIsEV(true);
                            }}
                            style={[styles.typeChip, newType === t && styles.typeChipSelected]}
                          >
                            <Text style={[styles.typeChipText, newType === t && styles.typeChipTextSelected]}>
                              {t}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* EV Switch */}
                      <View style={styles.evSwitchRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.evSwitchTitle}>Electric Vehicle (EV)</Text>
                          <Text style={styles.evSwitchSubtitle}>Filter EV charging parking spots</Text>
                        </View>
                        <Switch
                          value={newIsEV}
                          onValueChange={setNewIsEV}
                          trackColor={{ false: Colors.border, true: Colors.primaryYellow }}
                        />
                      </View>

                      <Button
                        title="Save Vehicle to Profile"
                        variant="primary"
                        onPress={handleAddVehicle}
                        loading={isAddingVehicle}
                        style={{ marginTop: Spacing.md }}
                      />
                    </Card>
                  )}

                  {/* List of saved vehicles */}
                  {vehicles.map((v) => (
                    <Card key={v._id} style={styles.vehicleItemCard}>
                      <View style={styles.vehicleItemRow}>
                        <View style={styles.vehicleItemLeft}>
                          <View style={styles.plateBadge}>
                            <Text style={styles.plateBadgeText}>
                              {v.plate || v.vehicleNumber}
                            </Text>
                          </View>
                          <Text style={styles.vehicleItemModel}>{v.model || 'Registered Vehicle'}</Text>
                          <View style={styles.vehicleTagsRow}>
                            {v.isEV && (
                              <View style={styles.evMiniBadge}>
                                <Zap size={10} color="#15803D" />
                                <Text style={styles.evMiniText}>EV</Text>
                              </View>
                            )}
                            {v.isPrimary && (
                              <View style={styles.primaryMiniBadge}>
                                <Text style={styles.primaryMiniText}>PRIMARY</Text>
                              </View>
                            )}
                          </View>
                        </View>

                        <View style={styles.vehicleItemActions}>
                          <TouchableOpacity
                            onPress={() => {
                              setVehiclesModalVisible(false);
                              handleOpenVault(v.plate || v.vehicleNumber);
                            }}
                            style={styles.viewDocsBtn}
                          >
                            <ShieldCheck size={14} color="#171717" />
                            <Text style={styles.viewDocsBtnText}>Vault</Text>
                          </TouchableOpacity>
                          {!v.isPrimary && (
                            <TouchableOpacity
                              onPress={() => handleSetPrimary(v._id)}
                              style={styles.setPrimaryBtn}
                            >
                              <Text style={styles.setPrimaryBtnText}>Make Primary</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            onPress={() => handleDeleteVehicle(v._id, v.plate || v.vehicleNumber)}
                            style={styles.deleteVehicleBtn}
                          >
                            <Trash2 size={16} color={Colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Card>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── DIGITAL VEHICLE DOCUMENT VAULT MODAL ────────────────── */}
      <Modal
        visible={vaultModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVaultModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            {/* Vault Header */}
            <View style={styles.modalHeader}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.modalTitle}>Document Vault</Text>
                  <View style={styles.vaultSecurityBadge}>
                    <ShieldCheck size={12} color="#15803D" />
                    <Text style={styles.vaultSecurityText}>ENCRYPTED</Text>
                  </View>
                </View>
                <Text style={styles.modalSubtitle}>RC, Insurance & PUCC with 1-tap renewal & expiry guard</Text>
              </View>
              <TouchableOpacity onPress={() => setVaultModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Vehicle Switcher Bar */}
              <View style={styles.vaultPlateBar}>
                <Text style={styles.vaultPlateLabel}>VEHICLE:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {(vehicles.length > 0 ? vehicles : [{ plate: 'DL01AB1234', model: 'My Vehicle' }]).map((veh: any, idx: number) => {
                    const plate = veh.plate || veh.vehicleNumber || 'DL01AB1234';
                    const isSelected = selectedVaultPlate === plate || (!selectedVaultPlate && idx === 0);
                    return (
                      <TouchableOpacity
                        key={plate + idx}
                        activeOpacity={0.8}
                        onPress={() => handleSelectVaultPlate(plate)}
                        style={[styles.vaultPlateChip, isSelected && styles.vaultPlateChipSelected]}
                      >
                        <Car size={13} color={isSelected ? '#171717' : Colors.textSecondary} />
                        <Text style={[styles.vaultPlateChipText, isSelected && styles.vaultPlateChipTextSelected]}>
                          {plate}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Parivahan Compliance Info Banner */}
              <View style={styles.vaultBanner}>
                <ShieldCheck size={20} color={Colors.primaryYellow} style={{ marginRight: 8, flexShrink: 0 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.vaultBannerTitle}>DigiLocker & MoRTH Parivahan Ready</Text>
                  <Text style={styles.vaultBannerSubtitle}>
                    Stored with 256-bit encryption. Accepted at all Drivix smart hub entry checkpoints and traffic audits.
                  </Text>
                </View>
              </View>

              {/* Status Overview Metric Chips */}
              <View style={styles.vaultMetricsRow}>
                <View style={styles.vaultMetricCard}>
                  <Text style={styles.vaultMetricVal}>{vaultDocuments.length}</Text>
                  <Text style={styles.vaultMetricLabel}>Documents</Text>
                </View>
                <View style={styles.vaultMetricCard}>
                  <Text style={[styles.vaultMetricVal, { color: '#15803D' }]}>
                    {vaultDocuments.filter((d) => d.status === 'valid').length}
                  </Text>
                  <Text style={styles.vaultMetricLabel}>Active / Valid</Text>
                </View>
                <View style={styles.vaultMetricCard}>
                  <Text style={[styles.vaultMetricVal, { color: '#D97706' }]}>
                    {vaultDocuments.filter((d) => d.status === 'expiring_soon' || d.status === 'expired').length}
                  </Text>
                  <Text style={styles.vaultMetricLabel}>Alert / Expiring</Text>
                </View>
              </View>

              {/* Add Custom Document Form or Action Bar */}
              {!showAddDocForm ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowAddDocForm(true)}
                  style={styles.addDocBar}
                >
                  <Plus size={16} color="#171717" />
                  <Text style={styles.addDocBarText}>Upload / Register Policy Document</Text>
                </TouchableOpacity>
              ) : (
                <Card style={styles.addDocCard}>
                  <View style={styles.addCardHeader}>
                    <Text style={styles.addCardTitle}>Register New Document</Text>
                    <TouchableOpacity onPress={() => setShowAddDocForm(false)}>
                      <Text style={styles.cancelLink}>Cancel</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.chipLabel}>Document Category</Text>
                  <View style={styles.typeChipsRow}>
                    {(['Insurance', 'PUCC', 'RC', 'Driving License'] as const).map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setNewDocType(t)}
                        style={[styles.typeChip, newDocType === t && styles.typeChipSelected]}
                      >
                        <Text style={[styles.typeChipText, newDocType === t && styles.typeChipTextSelected]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Input
                    label="Document / Policy Number"
                    placeholder="e.g. POL-881920-BAJAJ"
                    value={newDocNumber}
                    onChangeText={setNewDocNumber}
                    autoCapitalize="characters"
                  />

                  <Input
                    label="Issuing Authority / Company"
                    placeholder="e.g. ICICI Lombard / RTO Delhi"
                    value={newDocIssuer}
                    onChangeText={setNewDocIssuer}
                  />

                  <Input
                    label="Expiry Date (YYYY-MM-DD)"
                    placeholder="e.g. 2027-12-31"
                    value={newDocExpiry}
                    onChangeText={setNewDocExpiry}
                  />

                  <Button
                    title="Encrypt & Save to Vault"
                    variant="primary"
                    onPress={handleSaveNewDoc}
                    style={{ marginTop: Spacing.sm }}
                  />
                </Card>
              )}

              {/* Document List */}
              <View style={styles.docListSection}>
                {vaultDocuments.map((doc) => {
                  const isExpiring = doc.status === 'expiring_soon';
                  const isExpired = doc.status === 'expired';

                  return (
                    <Card
                      key={doc.id}
                      style={[
                        styles.docCard,
                        isExpiring && styles.docCardExpiring,
                        isExpired && styles.docCardExpired,
                      ]}
                    >
                      <View style={styles.docCardHeader}>
                        <View style={styles.docTypeBadge}>
                          <FileText size={16} color={isExpiring ? '#D97706' : isExpired ? '#DC2626' : Colors.textPrimary} />
                          <Text style={styles.docTypeText}>{doc.type}</Text>
                        </View>

                        <View
                          style={[
                            styles.docStatusBadge,
                            isExpiring && styles.docStatusExpiring,
                            isExpired && styles.docStatusExpired,
                          ]}
                        >
                          <Text
                            style={[
                              styles.docStatusText,
                              isExpiring && styles.docStatusTextExpiring,
                              isExpired && styles.docStatusTextExpired,
                            ]}
                          >
                            {isExpired
                              ? 'EXPIRED'
                              : isExpiring
                              ? `EXPIRES IN ${doc.daysRemaining}D`
                              : `VALID (${doc.daysRemaining}d left)`}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.docBody}>
                        <Text style={styles.docNumberText}>{doc.documentNumber}</Text>
                        <Text style={styles.docIssuerText}>Issuer: {doc.issuer || 'Official Authority'}</Text>
                        <Text style={styles.docExpiryText}>Valid Thru: {doc.expiryDate}</Text>
                      </View>

                      <View style={styles.docActionsRow}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleRenewDocument(doc)}
                          style={[styles.renewBtn, (isExpiring || isExpired) && styles.renewBtnUrgent]}
                        >
                          <ExternalLink size={13} color={(isExpiring || isExpired) ? '#171717' : Colors.textPrimary} />
                          <Text style={[styles.renewBtnText, (isExpiring || isExpired) && styles.renewBtnTextUrgent]}>
                            {isExpiring || isExpired ? '1-Tap Renew Now' : 'Check Policy / Renew'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() =>
                            Alert.alert(
                              'Verified Document',
                              `${doc.type} (${doc.documentNumber})\nIssued by: ${doc.issuer}\nExpiry: ${doc.expiryDate}\n\nStatus: Encrypted in Drivix Cloud Vault.`
                            )
                          }
                          style={styles.docDetailsBtn}
                        >
                          <Text style={styles.docDetailsBtnText}>Details</Text>
                        </TouchableOpacity>
                      </View>
                    </Card>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── 24/7 SUPPORT & COMPLAINTS MODAL ─────────────────────────── */}
      <Modal
        visible={supportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Help Desk & Complaints</Text>
                <Text style={styles.modalSubtitle}>Direct resolution line to Drivix Operations</Text>
              </View>
              <TouchableOpacity onPress={() => setSupportModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Tab switch: New Ticket vs History */}
            <View style={styles.supportTabRow}>
              <TouchableOpacity
                onPress={() => setActiveSupportTab('new')}
                style={[styles.supportTab, activeSupportTab === 'new' && styles.supportTabActive]}
              >
                <Text style={[styles.supportTabText, activeSupportTab === 'new' && styles.supportTabTextActive]}>
                  Submit Ticket
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setActiveSupportTab('history');
                  loadUserComplaints();
                }}
                style={[styles.supportTab, activeSupportTab === 'history' && styles.supportTabActive]}
              >
                <Text style={[styles.supportTabText, activeSupportTab === 'history' && styles.supportTabTextActive]}>
                  My Tickets ({complaints.length})
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {activeSupportTab === 'new' ? (
                <View style={styles.ticketForm}>
                  <Input
                    label="Subject / Topic"
                    placeholder="e.g. Overcharged on exit / Barrier not lifting"
                    value={complaintTitle}
                    onChangeText={setComplaintTitle}
                  />

                  <Input
                    label="Booking Reference (Optional)"
                    placeholder="e.g. DRX-109283"
                    value={complaintBookingId}
                    onChangeText={setComplaintBookingId}
                  />

                  <Text style={styles.chipLabel}>Issue Description</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Provide details about the incident, parking hub name, and time..."
                    placeholderTextColor={Colors.textMuted}
                    value={complaintDescription}
                    onChangeText={setComplaintDescription}
                    multiline
                    numberOfLines={4}
                  />

                  <Button
                    title="Submit Support Request"
                    variant="primary"
                    onPress={handleSubmitComplaint}
                    loading={isSubmittingComplaint}
                    style={{ marginTop: Spacing.lg }}
                  />

                  <View style={styles.tollFreeCard}>
                    <Headphones size={18} color="#171717" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.tollFreeTitle}>Emergency Toll-Free Line</Text>
                      <Text style={styles.tollFreeNumber}>+91 1800-DRIVIX (24/7 Available)</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.ticketsList}>
                  {loadingComplaints ? (
                    <ActivityIndicator size="small" color={Colors.primaryYellow} style={{ marginTop: 20 }} />
                  ) : complaints.length === 0 ? (
                    <View style={styles.emptyTickets}>
                      <MessageSquare size={32} color={Colors.textMuted} />
                      <Text style={styles.emptyTicketsText}>No support tickets filed yet.</Text>
                    </View>
                  ) : (
                    complaints.map((c) => (
                      <Card key={c._id} style={styles.complaintCard}>
                        <View style={styles.complaintTopRow}>
                          <Text style={styles.complaintTitle}>{c.title}</Text>
                          <Badge
                            label={c.complaintStatus.toUpperCase()}
                            variant={c.complaintStatus === 'resolved' ? 'available' : 'reserved'}
                          />
                        </View>
                        <Text style={styles.complaintDesc}>{c.description}</Text>
                        <View style={styles.complaintMeta}>
                          <Clock size={12} color={Colors.textMuted} />
                          <Text style={styles.complaintDate}>
                            {new Date(c.createdAt).toLocaleDateString()}
                          </Text>
                          {c.bookingId && (
                            <Text style={styles.complaintBookingTag}>Ref: {c.bookingId}</Text>
                          )}
                        </View>
                      </Card>
                    ))
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    paddingVertical: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  userCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  guestCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.cardBackgroundSelected,
    borderColor: Colors.borderYellow,
  },
  guestContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guestIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryYellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  guestSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  menuCard: {
    marginBottom: Spacing.xl,
    padding: 0,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  menuSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 56,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
  },
  logoutWrap: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  logoutButton: {
    borderColor: '#DC2626',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  copyrightText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },

  /* ─── Modal Styles ─────────────────────────────────────────── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalLoading: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyVehicles: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyVehiclesTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptyVehiclesText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
    marginTop: 4,
    lineHeight: 18,
  },
  addVehicleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryYellow,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  addVehicleBarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171717',
    marginLeft: 8,
  },
  addVehicleCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cancelLink: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.error,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  typeChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#FFFFFF',
  },
  typeChipSelected: {
    borderColor: Colors.primaryYellow,
    backgroundColor: Colors.cardBackgroundSelected,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  typeChipTextSelected: {
    color: '#171717',
  },
  evSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  evSwitchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  evSwitchSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  vehicleItemCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: 10,
  },
  vehicleItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleItemLeft: {
    flex: 1,
  },
  plateBadge: {
    backgroundColor: '#171717',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  plateBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  vehicleItemModel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  vehicleTagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  evMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  evMiniText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    marginLeft: 2,
  },
  primaryMiniBadge: {
    backgroundColor: Colors.cardBackgroundSelected,
    borderWidth: 1,
    borderColor: Colors.borderYellow,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  primaryMiniText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#171717',
  },
  vehicleItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  setPrimaryBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  setPrimaryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  deleteVehicleBtn: {
    padding: 6,
  },

  /* ─── Support Modal Styles ─────────────────────────────────── */
  supportTabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  supportTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  supportTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primaryYellow,
  },
  supportTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  supportTabTextActive: {
    color: Colors.textPrimary,
  },
  ticketForm: {
    paddingBottom: 20,
  },
  textArea: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  tollFreeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackgroundSelected,
    borderWidth: 1,
    borderColor: Colors.borderYellow,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
  tollFreeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tollFreeNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  ticketsList: {
    paddingBottom: 20,
  },
  emptyTickets: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyTicketsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  complaintCard: {
    padding: Spacing.md,
    marginBottom: 10,
    borderRadius: BorderRadius.md,
  },
  complaintTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  complaintTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  complaintDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  complaintMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  complaintDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  complaintBookingTag: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginLeft: 6,
  },

  /* ─── Document Vault & Expiry Styles ────────────────────────── */
  vaultIconCircle: {
    backgroundColor: 'rgba(255, 235, 59, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featurePill: {
    backgroundColor: '#1E2333',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.primaryYellow,
  },
  featurePillText: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.primaryYellow,
    letterSpacing: 0.5,
  },
  viewDocsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryYellow,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  viewDocsBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171717',
  },
  vaultSecurityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vaultSecurityText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  vaultPlateBar: {
    marginBottom: Spacing.md,
  },
  vaultPlateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  vaultPlateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  vaultPlateChipSelected: {
    backgroundColor: Colors.accentYellowLight,
    borderColor: Colors.primaryYellow,
  },
  vaultPlateChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  vaultPlateChipTextSelected: {
    color: '#171717',
    fontWeight: '900',
  },
  vaultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2333',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  vaultBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  vaultBannerSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    lineHeight: 14,
  },
  vaultMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  vaultMetricCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  vaultMetricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  vaultMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addDocBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.accentYellowLight,
    borderWidth: 1.5,
    borderColor: Colors.primaryYellow,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    marginBottom: Spacing.md,
  },
  addDocBarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171717',
  },
  addDocCard: {
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primaryYellow,
    backgroundColor: '#FFFEF5',
  },
  docListSection: {
    gap: 10,
    paddingBottom: 20,
  },
  docCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  docCardExpiring: {
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    backgroundColor: '#FFFBEB',
  },
  docCardExpired: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
    backgroundColor: '#FEF2F2',
  },
  docCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  docTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  docTypeText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  docStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#DCFCE7',
  },
  docStatusExpiring: {
    backgroundColor: '#FEF3C7',
  },
  docStatusExpired: {
    backgroundColor: '#FEE2E2',
  },
  docStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  docStatusTextExpiring: {
    color: '#B45309',
  },
  docStatusTextExpired: {
    color: '#B91C1C',
  },
  docBody: {
    marginBottom: 10,
  },
  docNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  docIssuerText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  docExpiryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  docActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 8,
  },
  renewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.md,
    paddingVertical: 7,
  },
  renewBtnUrgent: {
    backgroundColor: Colors.primaryYellow,
  },
  renewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  renewBtnTextUrgent: {
    color: '#171717',
    fontWeight: '900',
  },
  docDetailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  docDetailsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
