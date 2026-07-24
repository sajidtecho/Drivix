import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { openDrawer } from '@/components/navigation-stubs';

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [expanded, setExpanded] = useState(false);
  const colors = useTheme();

  return (
    <View style={[styles.faqCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
      <TouchableOpacity 
        style={styles.faqHeader} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={[styles.faqQuestion, { color: colors.text }]}>{question}</Text>
        {expanded ? (
          <ChevronUp size={18} color="#ffce00" />
        ) : (
          <ChevronDown size={18} color="#ffce00" />
        )}
      </TouchableOpacity>
      {expanded && (
        <View style={[styles.faqAnswerContainer, { borderTopColor: colors.borderGlass }]}>
          <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{answer}</Text>
        </View>
      )}
    </View>
  );
}

export default function FAQScreen() {
  const router = useRouter();
  const colors = useTheme();

  const faqs = [
    {
      question: "How do I book a parking slot?",
      answer: "You can browse nearby parking facilities directly from the map or list on the home screen. Tap a hub, view its slots layouts, select any available slot, specify duration, and tap confirm to reload wallet and finalize pre-booking."
    },
    {
      question: "What happens if I exceed my booked duration?",
      answer: "You can easily extend your active booking from the 'Tickets & Bookings' section in the Explore tab. If you exit late without extending, the additional time will be charged to your wallet balance."
    },
    {
      question: "How does the ANPR entry system work?",
      answer: "Our smart gates use AI-powered cameras that read your license plate number as you approach the entrance. If you have an active pre-booking for that facility, the gate opens automatically without any physical tickets."
    },
    {
      question: "Can I get a refund if I cancel my booking?",
      answer: "Yes, you can cancel any booking up to 30 minutes before your scheduled entry time. The booking amount will be instantly refunded to your Drivix wallet balance."
    },
    {
      question: "How do I reload my wallet?",
      answer: "Go to the Explore tab, select 'Wallet', select or enter the amount you want to add, and confirm. In this version, funds are simulated instantly for premium dashboard previewing."
    }
  ];

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Help & FAQ</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Find quick answers to common questions</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.introRow}>
          <HelpCircle size={20} color="#ffce00" />
          <Text style={[styles.introText, { color: colors.textSecondary }]}>
            Have questions about Drivix features? Browse our top FAQs below.
          </Text>
        </View>

        {/* FAQs */}
        {faqs.map((faq, index) => (
          <FAQItem key={index} question={faq.question} answer={faq.answer} />
        ))}
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
    gap: 12,
  },
  introRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    flex: 1,
  },
  faqCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  faqAnswerContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 18,
  },
});
