import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Edit2, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

interface UserDetailsTabProps {
  user: any;
  onUpdate: (data: any) => Promise<void>;
  loading: boolean;
}

export default function UserDetailsTab({ user, onUpdate, loading }: UserDetailsTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Clean up initial placeholders for name and email
  const getCleanedName = (val: string) => {
    return (!val || val === 'Mobile User') ? '' : val;
  };
  
  const getCleanedEmail = (val: string) => {
    return (!val || val.endsWith('@drivix.com')) ? '' : val;
  };

  const [name, setName] = useState(getCleanedName(user.name || ''));
  const [email, setEmail] = useState(getCleanedEmail(user.email || ''));
  const [city, setCity] = useState(user.city || '');
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'city' | null>(null);
  const colors = useTheme();

  const handleSave = async () => {
    if (!name.trim()) return;
    await onUpdate({ name: name.trim(), email: email.trim(), city: city.trim() });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(getCleanedName(user.name || ''));
    setEmail(getCleanedEmail(user.email || ''));
    setCity(user.city || '');
    setIsEditing(false);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Personal Profile</Text>
        {!isEditing ? (
          <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
            <Edit2 size={13} color="#ffce00" />
            <Text style={styles.editBtnText}>Edit Info</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#0b0c10" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Full Name */}
      <View style={styles.fieldBlock}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Full Name</Text>
        {isEditing ? (
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass, color: colors.text }, focusedField === 'name' && styles.inputFocused]}
            value={name}
            onChangeText={setName}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            placeholder="Name"
            placeholderTextColor={colors.textSecondary}
          />
        ) : (
          <Text style={[styles.fieldVal, { color: colors.text }]}>{getCleanedName(user.name) || 'Not Provided'}</Text>
        )}
      </View>

      {/* Email Address */}
      <View style={styles.fieldBlock}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email Address</Text>
        {isEditing ? (
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass, color: colors.text }, focusedField === 'email' && styles.inputFocused]}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            placeholder="Email Address"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        ) : (
          <Text style={[styles.fieldVal, { color: colors.text }]}>{getCleanedEmail(user.email) || 'Not Provided'}</Text>
        )}
      </View>

      {/* Mobile Number */}
      <View style={styles.fieldBlock}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Mobile Number</Text>
        <View style={styles.row}>
          <Text style={[styles.fieldValReadonly, { color: colors.textSecondary }]}>{user.mobile || 'Not Linked'}</Text>
          {user.mobile && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
      </View>

      {/* City / Location */}
      <View style={styles.fieldBlock}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>City / Location</Text>
        {isEditing ? (
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass, color: colors.text }, focusedField === 'city' && styles.inputFocused]}
            value={city}
            onChangeText={setCity}
            onFocus={() => setFocusedField('city')}
            onBlur={() => setFocusedField('city')}
            placeholder="City"
            placeholderTextColor={colors.textSecondary}
          />
        ) : (
          <Text style={[styles.fieldVal, { color: colors.text }]}>{user.city || 'Not Linked'}</Text>
        )}
      </View>

      {/* ANPR Protection Info Banner */}
      <View style={styles.protectionBanner}>
        <ShieldAlert size={18} color="#ffce00" />
        <Text style={[styles.protectionText, { color: colors.textSecondary }]}>
          Your user credentials are encrypted and stored inside Drivix secure local databases.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#15161e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#ffce00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editBtnText: {
    color: '#ffce00',
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 6,
  },
  cancelBtnText: {
    color: '#a0aab2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: '#ffce00',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#0b0c10',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fieldBlock: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: '#a0aab2',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldVal: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  fieldValReadonly: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    color: '#ffffff',
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  inputFocused: {
    borderColor: '#00f2ff',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(0, 204, 106, 0.05)',
    borderColor: 'rgba(0, 204, 106, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedText: {
    color: '#00cc6a',
    fontSize: 9,
    fontWeight: 'bold',
  },
  protectionBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 206, 0, 0.02)',
    borderColor: 'rgba(255, 206, 0, 0.1)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  protectionText: {
    color: '#a0aab2',
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  backBtnText: {
    color: '#ffce00',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
