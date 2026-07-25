import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Cpu, Zap, Globe, Users, Target, Lightbulb } from 'lucide-react-native';
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

        {/* The Idea Behind Drivix */}
        <View style={[styles.sectionCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <View style={styles.cardHeader}>
            <Lightbulb size={22} color="#ffce00" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>The Idea Behind Drivix</Text>
          </View>
          <Text style={[styles.cardBodyText, { color: colors.textSecondary }]}>
            Drivix was conceived as a solution to the growing urban crisis of parking congestion. In modern smart cities, searching for parking accounts for up to 30% of daily traffic congestion, wasting time and fuel while increasing stress. Drivix digitalizes physical parking spaces to let drivers book spots dynamically in seconds, converting a chaotic search into a structured digital flight.
          </Text>
        </View>

        {/* Vision & Mission */}
        <View style={[styles.sectionCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <View style={styles.cardHeader}>
            <Target size={22} color="#ffce00" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Vision & Mission</Text>
          </View>
          <Text style={[styles.cardBodyText, { color: colors.textSecondary, marginBottom: 12 }]}>
            <Text style={{ fontWeight: 'bold', color: colors.text }}>Vision: </Text>To pioneer a friction-free urban mobility future by transforming parking infrastructure into an automated, interconnected, and intelligent digital network.
          </Text>
          <Text style={[styles.cardBodyText, { color: colors.textSecondary }]}>
            <Text style={{ fontWeight: 'bold', color: colors.text }}>Mission: </Text>To empower commuters and parking facility owners with AI-driven dynamic pricing, real-time IoT slot occupancy networks, and secure contactless ANPR entry/exit triggers.
          </Text>
        </View>

        {/* Core Technology */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Core Pillars</Text>
        <View style={styles.pillarRow}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 206, 0, 0.08)' }]}>
            <Cpu size={18} color="#ffce00" />
          </View>
          <View style={styles.pillarText}>
            <Text style={[styles.pillarTitle, { color: colors.text }]}>AI Dynamic Pricing</Text>
            <Text style={[styles.pillarBody, { color: colors.textSecondary }]}>
              Optimizes space utility by evaluating real-time occupancy and local demand.
            </Text>
          </View>
        </View>

        <View style={styles.pillarRow}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 206, 0, 0.08)' }]}>
            <Zap size={18} color="#ffce00" />
          </View>
          <View style={styles.pillarText}>
            <Text style={[styles.pillarTitle, { color: colors.text }]}>Atomic Hold Locks</Text>
            <Text style={[styles.pillarBody, { color: colors.textSecondary }]}>
              Prevents double-booking race conditions through 5-minute database reservation holds.
            </Text>
          </View>
        </View>

        {/* Founding Team */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 12 }]}>Founding Team</Text>
        <View style={[styles.teamContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <View style={styles.teamMemberRow}>
            <View style={[styles.avatarWrapper, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>SA</Text>
            </View>
            <View style={styles.teamMemberInfo}>
              <Text style={[styles.teamMemberName, { color: colors.text }]}>Sajid Ahmad</Text>
              <Text style={[styles.teamMemberRole, { color: colors.textSecondary }]}>Founder and CEO</Text>
            </View>
          </View>

          <View style={[styles.teamDivider, { backgroundColor: colors.borderGlass }]} />

          <View style={styles.teamMemberRow}>
            <View style={[styles.avatarWrapper, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>IK</Text>
            </View>
            <View style={styles.teamMemberInfo}>
              <Text style={[styles.teamMemberName, { color: colors.text }]}>Irfan Khan</Text>
              <Text style={[styles.teamMemberRole, { color: colors.textSecondary }]}>Co-Founder and CMO</Text>
            </View>
          </View>

          <View style={[styles.teamDivider, { backgroundColor: colors.borderGlass }]} />

          <View style={styles.teamMemberRow}>
            <View style={[styles.avatarWrapper, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>MB</Text>
            </View>
            <View style={styles.teamMemberInfo}>
              <Text style={[styles.teamMemberName, { color: colors.text }]}>Mohd. Bilal</Text>
              <Text style={[styles.teamMemberRole, { color: colors.textSecondary }]}>Co-Founder and COO</Text>
            </View>
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
  sectionCard: {
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
  cardBodyText: {
    fontSize: 13,
    lineHeight: 18,
  },
  teamContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  teamMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  teamMemberInfo: {
    flex: 1,
    gap: 2,
  },
  teamMemberName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  teamMemberRole: {
    fontSize: 12,
  },
  teamDivider: {
    height: 1,
    width: '100%',
    opacity: 0.5,
  },
});
