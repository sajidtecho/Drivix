import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronUp, HelpCircle, ShieldCheck, Info, PhoneCall } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

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
  const [showFaqs, setShowFaqs] = useState(false);

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
    },
    {
      question: "How safe is my parked vehicle with Drivix?",
      answer: "Extremely safe. All Drivix hubs feature 24/7 high-definition CCTV monitoring with AI anomaly alerts, regular physical patrols by security staff, and automated ANPR entry/exit barriers."
    },
    {
      question: "Who founded Drivix Smart Parking?",
      answer: "Drivix was founded by a passionate leadership team: Sajid Ahmad (Founder and CEO), Irfan Khan (Co-Founder and CMO), and Mohd. Bilal (Co-Founder and COO) to eradicate urban parking congestion."
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.capsuleHeaderBtn, { borderColor: colors.primary, backgroundColor: colors.backgroundSelected }]} 
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
          <ChevronLeft size={18} color="#ffce00" />
          <Text style={[styles.capsuleHeaderBtnText, { color: colors.primary }]}>Help and FAQ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Help & FAQ Navigation Grid */}
        <View style={styles.gridContainer}>
          <TouchableOpacity 
            style={[styles.gridButton, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}
            onPress={() => router.push('/safety')}
            activeOpacity={0.7}
          >
            <ShieldCheck size={20} color="#ffce00" />
            <Text style={[styles.gridButtonText, { color: colors.text }]}>Safety</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridButton, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}
            onPress={() => setShowFaqs(!showFaqs)}
            activeOpacity={0.7}
          >
            <HelpCircle size={20} color="#ffce00" />
            <Text style={[styles.gridButtonText, { color: colors.text }]}>FAQs</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridButton, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}
            onPress={() => router.push('/about')}
            activeOpacity={0.7}
          >
            <Info size={20} color="#ffce00" />
            <Text style={[styles.gridButtonText, { color: colors.text }]}>About</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridButton, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}
            onPress={() => router.push('/contact')}
            activeOpacity={0.7}
          >
            <PhoneCall size={20} color="#ffce00" />
            <Text style={[styles.gridButtonText, { color: colors.text }]}>Contact</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs List Section */}
        {showFaqs && (
          <View style={styles.faqSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
            <View style={styles.faqList}>
              {faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  capsuleHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
    gap: 8,
  },
  capsuleHeaderBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridButton: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 22,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gridButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  faqSection: {
    gap: 16,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  faqList: {
    gap: 12,
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
