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
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
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
                <Car size={18} color={Colors.textPrimary} />
              </View>
              <Text style={styles.menuText}>Saved Vehicles</Text>
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
          <TouchableOpacity style={styles.menuItem} onPress={handleSupport} activeOpacity={0.7}>
            <View style={styles.menuLeft}>
              <View style={styles.iconCircle}>
                <Headphones size={18} color={Colors.textPrimary} />
              </View>
              <Text style={styles.menuText}>24/7 Help & Support</Text>
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
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  userCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.accentYellowLight,
    borderColor: Colors.primaryYellow,
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
    backgroundColor: Colors.primaryYellow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.textPrimary,
  },
  avatarText: {
    fontWeight: '800',
    fontSize: 24,
    color: Colors.textPrimary,
  },
  userInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  userName: {
    fontWeight: '700',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  roleBadge: {
    backgroundColor: Colors.textPrimary,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  roleBadgeText: {
    fontWeight: '700',
    fontSize: 9,
    color: Colors.primaryYellow,
    letterSpacing: 0.5,
  },
  guestCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  guestContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guestIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.cardBackgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  guestSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    fontWeight: '700',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  menuCard: {
    padding: 0,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
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
    backgroundColor: Colors.cardBackgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuText: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  menuSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  logoutWrap: {
    marginTop: Spacing.md,
  },
  logoutButton: {
    borderColor: Colors.error,
  },
  versionWrap: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  versionText: {
    fontWeight: '500',
    fontSize: 11,
    color: Colors.textMuted,
  },
  copyrightText: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
