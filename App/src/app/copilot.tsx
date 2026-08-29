import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShieldAlert, Globe, ExternalLink, Eye, Smartphone, Zap } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import * as WebBrowser from 'expo-web-browser';

const { width } = Dimensions.get('window');

export default function DriverCopilotScreen() {
  const router = useRouter();
  const colors = useTheme();

  const openWebCopilot = async () => {
    const webUrl = 'https://drivix-pearl.vercel.app/copilot';
    try {
      await WebBrowser.openBrowserAsync(webUrl);
    } catch (err) {
      Linking.openURL(webUrl);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderGlass }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ChevronLeft size={20} color="#ffce00" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Drivix AI Assistant</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Web-Powered Driver Safety Hub</Text>
        </View>
      </View>

      {/* Main Info Hero Container */}
      <View style={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <View style={styles.iconCircle}>
            <Globe size={36} color="#00f2ff" />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Drivix Web AI Core</Text>
          <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
            The AI Drowsiness and Distraction Alert system is hosted directly on the Drivix Web Platform. Launch the Web Assistant on any desktop or phone web browser to experience real-time AI face tracking and alarm monitoring.
          </Text>

          <TouchableOpacity style={styles.launchBtn} onPress={openWebCopilot} activeOpacity={0.85}>
            <ExternalLink size={18} color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.launchBtnText}>Launch Web AI Assistant</Text>
          </TouchableOpacity>
        </View>

        {/* Feature Capsules */}
        <View style={styles.featureGrid}>
          <View style={[styles.featureCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
            <Eye size={24} color="#ffce00" />
            <Text style={[styles.featureTitle, { color: colors.text }]}>Eye Aspect Ratio</Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              Detects eyelid closure & micro-sleep patterns.
            </Text>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
            <Smartphone size={24} color="#00cc6a" />
            <Text style={[styles.featureTitle, { color: colors.text }]}>Phone Detection</Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              COCO-SSD computer vision flags cell phone usage.
            </Text>
          </View>
        </View>
      </View>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  heroCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffce00',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    justifyContent: 'center',
  },
  launchBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 15,
  },
  featureGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
