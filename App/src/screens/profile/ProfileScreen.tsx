import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../store/AuthContext';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

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

  const handleSupport = () => {
    Alert.alert(
      'Drivix 24/7 Support',
      'Need assistance with a booking or parking facility?\n\nEmail: support@drivix.io\nHelpline: +91 800-DRIVIX (Toll Free)',
      [{ text: 'OK' }]
    );
  };

  const handleTerms = () => {
    Alert.alert(
      'Terms & Privacy Policy',
      'Drivix adheres to smart parking security, encrypted payments, and dynamic space management guidelines. Your personal and vehicle data is securely encrypted.',
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
                <Text style={styles.userName}>{user.name || 'Drivix User'}</Text>
                <Text style={styles.userEmail}>{user.email || 'user@drivix.io'}</Text>
                {user.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
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
                <Ionicons name="person-circle-outline" size={36} color={colors.textPrimary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
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
              style={{ marginTop: spacing.md }}
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
                <Ionicons name="receipt-outline" size={20} color={colors.textPrimary} />
              </View>
              <Text style={styles.menuText}>Booking History & Passes</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              if (isAuthenticated) {
                Alert.alert(
                  'Saved Vehicles',
                  'You can manage and register vehicle number plates seamlessly during the booking flow.',
                  [{ text: 'OK' }]
                );
              } else {
                navigation.navigate('Login');
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="car-sport-outline" size={20} color={colors.textPrimary} />
              </View>
              <Text style={styles.menuText}>Saved Vehicles</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Preferences */}
        <Text style={styles.sectionHeader}>PREFERENCES</Text>
        <Card style={styles.menuCard}>
          <View style={styles.switchItem}>
            <View style={styles.menuLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
              </View>
              <View>
                <Text style={styles.menuText}>Slot & Ticket Alerts</Text>
                <Text style={styles.menuSubtext}>Departure reminders & extension alerts</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primaryYellow }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.menuDivider} />

          <View style={styles.switchItem}>
            <View style={styles.menuLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="location-outline" size={20} color={colors.textPrimary} />
              </View>
              <View>
                <Text style={styles.menuText}>Location Services</Text>
                <Text style={styles.menuSubtext}>For nearby parking and arrival detection</Text>
              </View>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: colors.border, true: colors.primaryYellow }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        {/* Support & Legal */}
        <Text style={styles.sectionHeader}>SUPPORT & ABOUT</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={handleSupport} activeOpacity={0.7}>
            <View style={styles.menuLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="headset-outline" size={20} color={colors.textPrimary} />
              </View>
              <Text style={styles.menuText}>24/7 Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleTerms} activeOpacity={0.7}>
            <View style={styles.menuLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="document-text-outline" size={20} color={colors.textPrimary} />
              </View>
              <Text style={styles.menuText}>Terms & Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
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
        <View style={styles.versionWrap}>
          <Text style={styles.versionText}>Drivix Smart Parking • v1.0.0 (Production Build)</Text>
          <Text style={styles.copyrightText}>Powered by Drivix AI Dynamic Space Allocation</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.fontBold,
    fontSize: typography.fontSizes.xxl,
    color: colors.textPrimary,
  },
  userCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.lightYellow,
    borderColor: colors.primaryYellow,
    borderWidth: 1.5,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryYellow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
  avatarText: {
    fontFamily: typography.fontBold,
    fontSize: 24,
    color: colors.textPrimary,
  },
  userInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  userName: {
    fontFamily: typography.fontBold,
    fontSize: typography.fontSizes.lg,
    color: colors.textPrimary,
  },
  userEmail: {
    fontFamily: typography.fontRegular,
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userPhone: {
    fontFamily: typography.fontRegular,
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  roleBadge: {
    backgroundColor: colors.textPrimary,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  roleBadgeText: {
    fontFamily: typography.fontBold,
    fontSize: 9,
    color: colors.primaryYellow,
    letterSpacing: 0.5,
  },
  guestCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  guestContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guestIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestTitle: {
    fontFamily: typography.fontBold,
    fontSize: typography.fontSizes.md,
    color: colors.textPrimary,
  },
  guestSubtitle: {
    fontFamily: typography.fontRegular,
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    fontFamily: typography.fontBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  menuCard: {
    padding: 0,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
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
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuText: {
    fontFamily: typography.fontMedium,
    fontSize: typography.fontSizes.sm,
    color: colors.textPrimary,
  },
  menuSubtext: {
    fontFamily: typography.fontRegular,
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  logoutWrap: {
    marginTop: spacing.md,
  },
  logoutButton: {
    borderColor: colors.error,
  },
  versionWrap: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  versionText: {
    fontFamily: typography.fontMedium,
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  copyrightText: {
    fontFamily: typography.fontRegular,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
});
