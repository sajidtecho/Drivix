import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { User as UserIcon, Phone, MapPin, Sparkles, LogOut } from 'lucide-react-native';

interface ProfileCardProps {
  user: any;
  onLogout: () => void;
}

export default function ProfileCard({ user, onLogout }: ProfileCardProps) {
  const handleLogoutPress = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of your session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', onPress: onLogout, style: 'destructive' },
    ]);
  };

  return (
    <View>
      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <UserIcon size={32} color="#0b0c10" />
          </View>
          <View style={styles.profileTitles}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
          <View style={styles.memberBadge}>
            <Sparkles size={12} color="#ffce00" />
            <Text style={styles.memberBadgeText}>Premium</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* User Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Phone size={14} color="#a0aab2" />
            <Text style={styles.detailText}>{user.mobile || 'Not Linked'}</Text>
          </View>
          <View style={styles.detailItem}>
            <MapPin size={14} color="#a0aab2" />
            <Text style={styles.detailText}>{user.city || 'No Location'}</Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogoutPress}
        activeOpacity={0.8}
      >
        <LogOut size={18} color="#ffffff" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Log Out Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(21, 22, 30, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffce00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileTitles: {
    flex: 1,
  },
  profileName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileEmail: {
    color: '#a0aab2',
    fontSize: 13,
    marginTop: 2,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 206, 0, 0.1)',
    borderColor: 'rgba(255, 206, 0, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  memberBadgeText: {
    color: '#ffce00',
    fontSize: 11,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#a0aab2',
    fontSize: 13,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#ff4b4b',
    borderRadius: 24, // rounded-xl from Aura Kinetic
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#ff4b4b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
