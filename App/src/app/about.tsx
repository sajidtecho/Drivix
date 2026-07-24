import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Cpu, Zap, Globe } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/use-theme';
import { openDrawer } from '@/components/navigation-stubs';

export default function AboutScreen() {
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>About Drivix</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{"India's smart parking ecosystem"}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={require('@/assets/images/Logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>Smart Parking. Automated Security. Zero Congestion.</Text>
        </View>

        {/* Story */}
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          {"Drivix is India's first integrated smart parking ecosystem designed to eliminate urban congestion. Our platform solves the everyday headache of finding parking spots in crowded urban spaces."}
        </Text>

        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          By combining AI-powered software, ANPR camera triggers, real-time IoT slot occupancy networks, and dynamic surge pricing engines, we turn the search for parking into a seamless digital flight.
        </Text>

        {/* Pillars Header */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Our Core Technology</Text>

        {/* Pillar Rows */}
        <View style={styles.pillarRow}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 206, 0, 0.08)' }]}>
            <Cpu size={20} color="#ffce00" />
          </View>
          <View style={styles.pillarText}>
            <Text style={[styles.pillarTitle, { color: colors.text }]}>AI Dynamic Pricing</Text>
            <Text style={[styles.pillarBody, { color: colors.textSecondary }]}>
              Analyzes occupancy, peak hours, and local demand to scale parking rates fairly and maximize utilization.
            </Text>
          </View>
        </View>

        <View style={styles.pillarRow}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 206, 0, 0.08)' }]}>
            <Zap size={20} color="#ffce00" />
          </View>
          <View style={styles.pillarText}>
            <Text style={[styles.pillarTitle, { color: colors.text }]}>Atomic Concurrency locks</Text>
            <Text style={[styles.pillarBody, { color: colors.textSecondary }]}>
              Prevents double-booking race conditions by atomic database locking on slots for 5-minute pre-booking holds.
            </Text>
          </View>
        </View>

        <View style={styles.pillarRow}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 206, 0, 0.08)' }]}>
            <Globe size={20} color="#ffce00" />
          </View>
          <View style={styles.pillarText}>
            <Text style={[styles.pillarTitle, { color: colors.text }]}>Smart Connected Cities</Text>
            <Text style={[styles.pillarBody, { color: colors.textSecondary }]}>
              Connecting malls, metro stations, commercial hubs, and public spaces into one unified parking ecosystem.
            </Text>
          </View>
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
  bannerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  logo: {
    width: 180,
    height: 54,
  },
  tagline: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
  },
  pillarRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  pillarText: {
    flex: 1,
    gap: 2,
  },
  pillarTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  pillarBody: {
    fontSize: 12,
    lineHeight: 16,
  },
});
