import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShieldCheck, Video, ShieldAlert, FileKey } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { openDrawer } from '@/components/navigation-stubs';

export default function SafetyScreen() {
  const router = useRouter();
  const colors = useTheme();

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Safety & Security</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Our commitment to your protection</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <Text style={[styles.introText, { color: colors.textSecondary }]}>
          At Drivix, the safety of your vehicle and your personal data is our top priority. We implement state-of-the-art security measures across all our parking hubs.
        </Text>

        {/* Feature Cards */}
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <View style={styles.cardHeader}>
            <Video size={24} color="#ffce00" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>24/7 CCTV Surveillance</Text>
          </View>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            Every corner of our parking facilities is monitored by high-definition smart cameras with continuous recording and AI detection for anomalous activities.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <View style={styles.cardHeader}>
            <ShieldCheck size={24} color="#ffce00" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Automated ANPR Gates</Text>
          </View>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            Our entry and exit barriers use Automatic Number Plate Recognition (ANPR) systems. Only vehicles with verified digital pre-bookings are granted entry.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <View style={styles.cardHeader}>
            <ShieldAlert size={24} color="#ffce00" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Manned Patrols & Emergency</Text>
          </View>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            Trained security staff perform regular patrols through all levels. Facilities are equipped with clear signage, emergency call boxes, and first-aid kits.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <View style={styles.cardHeader}>
            <FileKey size={24} color="#ffce00" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Secure Document Vault</Text>
          </View>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            All uploaded identity documents and vehicle registrations are secured using military-grade AES-256 encryption within our secure serverless cloud infrastructure.
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
    marginTop: 2,
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
  },
});
