import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Phone, Mail, MapPin, MessageSquare } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { openDrawer } from '@/components/navigation-stubs';

export default function ContactScreen() {
  const router = useRouter();
  const colors = useTheme();

  const handleSupportCall = () => {
    Alert.alert('Calling Support', 'Dialing toll-free number: 1800-DRIVIX (1800-374849)...');
  };

  const handleSupportEmail = () => {
    Alert.alert('Email Support', 'Opening mail client to: support@drivix.com...');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]} 
          onPress={() => {
            if (Platform.OS === 'web') {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push('/');
              }
            } else {
              router.back();
            }
          }}
          activeOpacity={0.8}
        >
          <ChevronLeft size={20} color="#ffce00" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Contact Support</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>We are here to help you 24/7</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <Text style={[styles.introText, { color: colors.textSecondary }]}>
          Need help with booking, payments, or ANPR issues? Reach out to our customer support team through any of the options below.
        </Text>

        {/* Contact Methods */}
        <TouchableOpacity 
          style={[styles.contactCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}
          onPress={handleSupportCall}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 206, 0, 0.08)' }]}>
            <Phone size={22} color="#ffce00" />
          </View>
          <View style={styles.contactText}>
            <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>TOLL-FREE PHONE SUPPORT</Text>
            <Text style={[styles.contactValue, { color: colors.text }]}>1800-DRIVIX</Text>
            <Text style={[styles.contactNote, { color: colors.textSecondary }]}>Tap to call (Available 24/7)</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.contactCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}
          onPress={handleSupportEmail}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 206, 0, 0.08)' }]}>
            <Mail size={22} color="#ffce00" />
          </View>
          <View style={styles.contactText}>
            <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>EMAIL INQUIRIES</Text>
            <Text style={[styles.contactValue, { color: colors.text }]}>support@drivix.com</Text>
            <Text style={[styles.contactNote, { color: colors.textSecondary }]}>Tap to compose (Response in 2 hours)</Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.contactCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 206, 0, 0.08)' }]}>
            <MapPin size={22} color="#ffce00" />
          </View>
          <View style={styles.contactText}>
            <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>CORPORATE HEADQUARTERS</Text>
            <Text style={[styles.contactValue, { color: colors.text }]}>Drivix Tech Labs</Text>
            <Text style={[styles.addressLine, { color: colors.text }]}>Sector 62, Noida, Uttar Pradesh, India</Text>
          </View>
        </View>

        {/* Live Support Note */}
        <View style={[styles.liveSupportNote, { borderColor: 'rgba(0, 242, 255, 0.2)', backgroundColor: 'rgba(0, 242, 255, 0.03)' }]}>
          <MessageSquare size={18} color="#00f2ff" style={{ marginTop: 2 }} />
          <Text style={[styles.liveSupportText, { color: '#a0aab2' }]}>
            <Text style={{ color: '#00f2ff', fontWeight: 'bold' }}>Live Chat</Text> support is available inside the app for authenticated members under the Tickets tab. Please log in to start a chat session.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    padding: 8,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  introText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  contactCard: {
    flexDirection: 'row',
    gap: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactText: {
    flex: 1,
    gap: 2,
  },
  contactLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addressLine: {
    fontSize: 13,
    marginTop: 2,
  },
  contactNote: {
    fontSize: 11,
    marginTop: 4,
  },
  liveSupportNote: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  liveSupportText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});
