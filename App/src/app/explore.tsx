import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform, DeviceEventEmitter, Modal, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, ArrowLeft } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AuthGuard from '@/components/AuthGuard';
import { openDrawer } from '@/components/navigation-stubs';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { useTheme } from '@/hooks/use-theme';

import BookingsTab from '@/components/drivix/BookingsTab';
import UserDetailsTab from '@/components/drivix/UserDetailsTab';
import VehiclesTab from '@/components/drivix/VehiclesTab';
import WalletReloadCard from '@/components/drivix/WalletReloadCard';
import IdentityDocumentVault from '@/components/drivix/IdentityDocumentVault';
import FASTagTab from '@/components/drivix/FASTagTab';

type ProfileTabType = 'bookings' | 'profile' | 'vehicles' | 'wallet' | 'documents' | 'fastag';

function ExploreScreenContent({ tabProp, isTabRender }: { tabProp?: string; isTabRender?: boolean }) {
  const { user, logout, refreshProfile } = useAuth();
  const colors = useTheme();
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<ProfileTabType>('bookings');
  const [loading, setLoading] = useState(false);

  // Naming & Real Image Upload States
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [pendingDocType, setPendingDocType] = useState<'DL' | 'RC' | 'INS' | null>(null);
  const [pendingDocUri, setPendingDocUri] = useState<string | null>(null);
  const [pendingDocBase64, setPendingDocBase64] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState('');

  useEffect(() => {
    const resolvedTab = tab || tabProp;
    if (resolvedTab && ['bookings', 'profile', 'vehicles', 'wallet', 'documents', 'fastag'].includes(resolvedTab)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(resolvedTab as ProfileTabType);
    }
  }, [tab, tabProp]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('changeSubTab', (subTab: string) => {
      if (['bookings', 'profile', 'vehicles', 'wallet', 'documents', 'fastag'].includes(subTab)) {
        setActiveTab(subTab as ProfileTabType);
      }
    });
    return () => sub.remove();
  }, []);

  const handleUpdateProfile = async (data: any) => {
    setLoading(true);
    try {
      const response = await api.put('/auth/profile', data);
      if (response.data) {
        Alert.alert('Profile Updated', 'Your profile details have been saved successfully.');
        await refreshProfile();
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      Alert.alert('Update Failed', 'Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async (amount: number) => {
    setLoading(true);
    try {
      const currentBalance = user?.walletBalance || 0;
      const newBalance = currentBalance + amount;

      const response = await api.put('/auth/profile', {
        walletBalance: newBalance,
      });

      if (response.data) {
        Alert.alert('Wallet Loaded', `Successfully added Rs. ${amount} to your wallet!`);
        await refreshProfile();
      }
    } catch (err: any) {
      console.error('Error topping up wallet:', err);
      Alert.alert('Reload Failed', 'Failed to update wallet balance.');
    } finally {
      setLoading(false);
    }
  };

  const handleRealDocUpload = async (type: 'DL' | 'RC' | 'INS', defaultName: string) => {
    // 1. Request Permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please grant photo library access to upload documents.');
      return;
    }

    // 2. Launch Image Picker
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setPendingDocType(type);
      setPendingDocUri(asset.uri);
      setPendingDocBase64(asset.base64 || null);
      setDocumentName(defaultName);
      setIsUploadModalVisible(true);
    } catch (err) {
      console.error('Error launching image library:', err);
      Alert.alert('Error', 'Failed to open photo library.');
    }
  };

  const handleSaveDoc = async () => {
    if (!user || !pendingDocType || !pendingDocBase64) return;

    const docName = documentName.trim();
    if (!docName) {
      Alert.alert('Invalid Name', 'Please enter a valid document name.');
      return;
    }

    setLoading(true);
    setIsUploadModalVisible(false);

    try {
      const currentDocs = user.documents || [];
      const filteredDocs = currentDocs.filter((d: any) => d.type !== pendingDocType);

      const newDoc = {
        name: docName,
        type: pendingDocType,
        fileUrl: `data:image/jpeg;base64,${pendingDocBase64}`,
      };

      const response = await api.put('/auth/profile', {
        documents: [...filteredDocs, newDoc],
      });

      if (response.data) {
        Alert.alert('Document Uploaded', `"${docName}" has been successfully saved to the database.`);
        await refreshProfile();
      }
    } catch (err: any) {
      console.error('Error saving document to database:', err);
      Alert.alert('Upload Failed', 'Failed to store document in database.');
    } finally {
      setLoading(false);
      setPendingDocType(null);
      setPendingDocUri(null);
      setPendingDocBase64(null);
      setDocumentName('');
    }
  };

  const handleDeleteDoc = async (type: 'DL' | 'RC' | 'INS') => {
    if (!user || !user.documents) return;
    setLoading(true);
    try {
      const filteredDocs = user.documents.filter((d: any) => d.type !== type);

      const response = await api.put('/auth/profile', {
        documents: filteredDocs,
      });

      if (response.data) {
        Alert.alert('Document Deleted', 'Document removed from secure vault.');
        await refreshProfile();
      }
    } catch (err: any) {
      console.error('Error deleting document:', err);
      Alert.alert('Delete Failed', 'Failed to remove document.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of your session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', onPress: logout, style: 'destructive' },
    ]);
  };

  if (!user) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Universal Back Button */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderGlass }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}
          onPress={() => {
            console.log('Back button pressed! canGoBack:', router.canGoBack());
            if (Platform.OS === 'web') {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push('/');
              }
            } else if (router.canGoBack()) {
              // On native: go back in navigation stack
              router.back();
            } else {
              // Fallback for top-level tab screens: navigate back to Home
              console.log('Emitting changeTab home');
              DeviceEventEmitter.emit('changeTab', 'home');
            }
          }}
          activeOpacity={0.8}
        >
          <ArrowLeft size={16} color="#ffce00" />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Dashboard Top Horizontal Menu - Only rendered on native platforms */}
      {Platform.OS !== 'web' && (
        <View style={[styles.tabMenuWrapper, { backgroundColor: colors.background, borderBottomColor: colors.borderGlass }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menuScroll}
          >
            {[
              { id: 'bookings', label: 'Tickets' },
              { id: 'profile', label: 'Details' },
              { id: 'vehicles', label: 'Vehicles' },
              { id: 'wallet', label: 'Wallet' },
              { id: 'fastag', label: 'FASTag' },
              { id: 'documents', label: 'Docs' },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass },
                  activeTab === item.id && styles.menuItemActive,
                ]}
                onPress={() => setActiveTab(item.id as ProfileTabType)}
              >
                <Text
                  style={[
                    styles.menuItemText,
                    { color: colors.textSecondary },
                    activeTab === item.id && styles.menuItemTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Main Form/List Container */}
      <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        {activeTab === 'bookings' && <BookingsTab />}

        {activeTab === 'profile' && (
          <UserDetailsTab user={user} onUpdate={handleUpdateProfile} loading={loading} />
        )}

        {activeTab === 'vehicles' && <VehiclesTab onRefreshUser={refreshProfile} />}

        {activeTab === 'wallet' && (
          <WalletReloadCard user={user} loading={loading} onAddMoney={handleAddMoney} />
        )}

        {activeTab === 'fastag' && <FASTagTab />}

        {activeTab === 'documents' && (
          <IdentityDocumentVault
            user={user}
            onUploadDoc={handleRealDocUpload}
            onDeleteDoc={handleDeleteDoc}
          />
        )}

        {/* Global Web-like Logout */}
        {activeTab === 'profile' && (
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogoutPress}
            activeOpacity={0.8}
          >
            <LogOut size={16} color="#ff4b4b" />
            <Text style={styles.logoutText}>Log Out Account</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Real Document Naming & Upload Modal */}
      <Modal
        visible={isUploadModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setIsUploadModalVisible(false);
          setPendingDocType(null);
          setPendingDocUri(null);
          setPendingDocBase64(null);
          setDocumentName('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Name Your Document</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Verify or change the name before storing.
            </Text>

            {pendingDocUri && (
              <Image source={{ uri: pendingDocUri }} style={styles.previewImage} resizeMode="cover" />
            )}

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.borderGlass, backgroundColor: colors.backgroundSelected }]}
              value={documentName}
              onChangeText={setDocumentName}
              placeholder="Enter Document Name..."
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.borderGlass }]}
                onPress={() => {
                  setIsUploadModalVisible(false);
                  setPendingDocType(null);
                  setPendingDocUri(null);
                  setPendingDocBase64(null);
                  setDocumentName('');
                }}
              >
                <Text style={[styles.modalCancelBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveDoc}
              >
                <Text style={styles.modalSaveBtnText}>Save to DB</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function ExploreScreen({ tab, isTabRender }: { tab?: string; isTabRender?: boolean }) {
  return (
    <AuthGuard>
      <ExploreScreenContent tabProp={tab} isTabRender={isTabRender} />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c10',
  },
  tabMenuWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 12,
    backgroundColor: '#0b0c10',
  },
  menuScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  menuItemActive: {
    backgroundColor: '#ffce00',
    borderColor: '#ffce00',
  },
  menuItemText: {
    color: '#a0aab2',
    fontSize: 13,
    fontWeight: 'bold',
  },
  menuItemTextActive: {
    color: '#0b0c10',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.25)',
    backgroundColor: 'rgba(255, 75, 75, 0.02)',
  },
  logoutText: {
    color: '#ff4b4b',
    fontSize: 14,
    fontWeight: 'bold',
  },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  backBtnText: {
    color: '#ffce00',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  previewImage: {
    width: 200,
    height: 120,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalSaveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ffce00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: '#0b0c10',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
