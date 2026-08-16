import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import {
  ArrowLeft,
  MoreVertical,
  Search,
  CheckCircle,
  Gavel,
  BookOpen,
  Globe,
  Play,
  Star
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

interface ChallanScreenProps {
  onBack: () => void;
  initialVehicleNumber?: string;
}

export default function ChallanScreen({ onBack, initialVehicleNumber = '' }: ChallanScreenProps) {
  const colors = useTheme();
  const [vehicleNumber, setVehicleNumber] = useState(initialVehicleNumber);

  const lawyers = [
    { id: '1', name: 'Manmeet Singh', settlements: '9,802', rating: '5.0', initial: 'MS' },
    { id: '2', name: 'Harsh Tripathi', settlements: '5,332', rating: '4.9', initial: 'HT' },
    { id: '3', name: 'Kunal Patidar', settlements: '8,969', rating: '4.9', initial: 'KP' },
    { id: '4', name: 'Sahil Giri', settlements: '7,777', rating: '5.0', initial: 'SG' }
  ];

  const features = [
    {
      id: '1',
      title: 'No court visits required',
      desc: 'Avoid tedious court rounds completely.',
      icon: Gavel,
      color: '#ffce00'
    },
    {
      id: '2',
      title: 'No hassle to hire lawyer',
      desc: 'Expert legal panels handle the work.',
      icon: BookOpen,
      color: '#ff6b35'
    },
    {
      id: '3',
      title: 'Settlement across all portals',
      desc: 'Supports multiple state traffic portals.',
      icon: Globe,
      color: '#00f2ff'
    }
  ];

  const reviews = [
    {
      id: '1',
      name: 'Kasturi Borgohain',
      location: 'New Delhi',
      rating: 5,
      review: 'Great service! Drivix helped me discover and pay a challan worth ₹10,000 on my vehicle. Entire service was smooth and convenient.'
    },
    {
      id: '2',
      name: 'Abhishek Sharma',
      location: 'Gurugram',
      rating: 5,
      review: 'Highly recommended! Settled my overspeeding challan in 3 days. Hassle-free and fast legal coordination.'
    }
  ];

  const videoTestimonials = [
    { id: '1', name: 'Sumit', location: 'Gurugram' },
    { id: '2', name: 'Shubham', location: 'Gandhi Nagar' },
    { id: '3', name: 'Dinesh', location: 'Delhi' }
  ];

  const handleSearchChallan = () => {
    if (!vehicleNumber.trim()) {
      Alert.alert('Required', 'Please enter your vehicle number.');
      return;
    }
    Alert.alert(
      'Challan Search',
      `Searching traffic challans for ${vehicleNumber.toUpperCase()}...`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: colors.borderGlass }]}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Challan Settlement</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <MoreVertical size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── DISCOUNT PROMOTIONAL BANNER ── */}
        <View style={[styles.promoBanner, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
          <View style={styles.badgeContainer}>
            <Text style={styles.promoBadgeText}>SALE ENDS TODAY</Text>
          </View>
          <Text style={[styles.promoTitle, { color: colors.text }]}>CHALLAN DAY IS LIVE</Text>
          <Text style={styles.promoSub}>FLAT 50% OFF ON LEGAL FEES</Text>

          <View style={styles.pricingCardsRow}>
            {/* Online Settlement */}
            <View style={[styles.priceCard, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}>
              <Text style={styles.strikethrough}>₹299</Text>
              <Text style={styles.priceHighlight}>₹129*</Text>
              <Text style={[styles.priceLabel, { color: colors.text }]}>LEGAL FEES</Text>
              <Text style={styles.priceDesc}>Online Challan Settlement</Text>
            </View>

            {/* Court Settlement */}
            <View style={[styles.priceCard, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}>
              <Text style={styles.strikethrough}>₹1999</Text>
              <Text style={styles.priceHighlight}>₹999*</Text>
              <Text style={[styles.priceLabel, { color: colors.text }]}>LEGAL FEES</Text>
              <Text style={styles.priceDesc}>Court Challan Settlement</Text>
            </View>
          </View>
        </View>

        {/* ── VEHICLE SEARCH BOX ── */}
        <View style={styles.searchSection}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Enter your vehicle number"
              placeholderTextColor={colors.textSecondary}
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              autoCapitalize="characters"
            />
            <TouchableOpacity onPress={handleSearchChallan} style={[styles.searchBtn, { backgroundColor: colors.primary }]}>
              <Search size={18} color="#0b0c10" />
            </TouchableOpacity>
          </View>

          {/* Settle Stat Badge */}
          <View style={[styles.settledBadge, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}30` }]}>
            <CheckCircle size={16} color={colors.primary} />
            <Text style={[styles.settledText, { color: colors.text }]}>
              <Text style={{ fontWeight: 'bold', color: colors.primary }}>5,79,222</Text> challans settled by Drivix+ hassle-free
            </Text>
          </View>
        </View>

        {/* ── OUR TRUSTED LAWYERS ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Our trusted lawyers</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lawyersContainer}>
            {lawyers.map((lawyer) => (
              <View key={lawyer.id} style={[styles.lawyerCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
                <View style={[styles.avatarCircle, { backgroundColor: `${colors.primary}18` }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>{lawyer.initial}</Text>
                  <View style={[styles.ratingBadge, { backgroundColor: colors.backgroundSelected, borderColor: colors.borderGlass }]}>
                    <Star size={8} color="#ffce00" fill="#ffce00" />
                    <Text style={{ color: colors.text, fontSize: 8, fontWeight: 'bold' }}>{lawyer.rating}</Text>
                  </View>
                </View>
                <Text style={[styles.lawyerName, { color: colors.text }]} numberOfLines={1}>{lawyer.name}</Text>
                <Text style={styles.lawyerStats}>{lawyer.settlements} settlements</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── WHY DRIVIX+? ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Why Drivix+?</Text>
          <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
            Drivix+ allows you to settle traffic challans across multiple state portals. Avoid court visits for court challans and clear your dues from the comfort of your home.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuresContainer}>
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <View key={item.id} style={[styles.featureCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
                  <View style={[styles.featureIconContainer, { backgroundColor: `${item.color}18` }]}>
                    <Icon size={20} color={item.color} />
                  </View>
                  <Text style={[styles.featureCardTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={styles.featureCardDesc}>{item.desc}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ── VIDEO TESTIMONIALS ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>See why you would choose us!</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.videosContainer}>
            {videoTestimonials.map((vid) => (
              <View key={vid.id} style={[styles.videoCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
                {/* Mock Video Thumbnail */}
                <View style={styles.videoThumbnail}>
                  <TouchableOpacity style={styles.playButton}>
                    <Play size={18} color="#0b0c10" fill="#0b0c10" />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.videoName, { color: colors.text }]}>{vid.name}</Text>
                <Text style={styles.videoLocation}>{vid.location}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── CUSTOMER REVIEWS ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>100,000+ happy customers</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewsContainer}>
            {reviews.map((rev) => (
              <View key={rev.id} style={[styles.reviewCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
                <View style={styles.reviewHeader}>
                  <View>
                    <Text style={[styles.reviewName, { color: colors.text }]}>{rev.name}</Text>
                    <Text style={styles.reviewLocation}>{rev.location}</Text>
                  </View>
                  <View style={styles.reviewRatingBadge}>
                    <Star size={10} color="#ffce00" fill="#ffce00" />
                    <Text style={styles.reviewRatingText}>5.0</Text>
                  </View>
                </View>
                <Text style={[styles.reviewText, { color: colors.textSecondary }]} numberOfLines={4}>
                  {"\""}{rev.review}{"\""}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── REFER BANNER ── */}
        <View style={[styles.referBanner, { backgroundColor: `${colors.primary}12`, borderColor: colors.borderGlass }]}>
          <View style={styles.referContent}>
            <Text style={[styles.referTitle, { color: colors.text }]}>Help your friends</Text>
            <Text style={styles.referSub}>in settling their challans, without any hassle</Text>
          </View>
          <TouchableOpacity style={[styles.referBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.referBtnText}>Refer now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 36,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  promoBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeContainer: {
    backgroundColor: '#ff4b4b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  promoBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  promoSub: {
    color: '#00cc6a',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  pricingCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  priceCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  strikethrough: {
    color: '#a0aab2',
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  priceHighlight: {
    color: '#ffce00',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  priceLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  priceDesc: {
    color: '#a0aab2',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 4,
  },
  searchSection: {
    marginBottom: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    alignItems: 'center',
    paddingLeft: 14,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  searchBtn: {
    width: 48,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
    gap: 8,
  },
  settledText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionDesc: {
    color: '#a0aab2',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  lawyersContainer: {
    gap: 12,
  },
  lawyerCard: {
    width: 110,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 10,
    position: 'absolute',
    bottom: -4,
    gap: 2,
  },
  lawyerName: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  lawyerStats: {
    color: '#00cc6a',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
  },
  featuresContainer: {
    gap: 12,
  },
  featureCard: {
    width: 160,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginRight: 12,
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureCardDesc: {
    color: '#a0aab2',
    fontSize: 10,
    lineHeight: 14,
  },
  videosContainer: {
    gap: 12,
  },
  videoCard: {
    width: 120,
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    marginRight: 12,
  },
  videoThumbnail: {
    height: 140,
    backgroundColor: '#1b1d28',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffce00',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2,
  },
  videoName: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  videoLocation: {
    color: '#a0aab2',
    fontSize: 9,
  },
  reviewsContainer: {
    gap: 12,
  },
  reviewCard: {
    width: 260,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginRight: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  reviewLocation: {
    color: '#a0aab2',
    fontSize: 10,
  },
  reviewRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 204, 106, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  reviewRatingText: {
    color: '#00cc6a',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reviewText: {
    fontSize: 11,
    lineHeight: 16,
  },
  referBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  referContent: {
    flex: 1,
    marginRight: 12,
  },
  referTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  referSub: {
    color: '#a0aab2',
    fontSize: 11,
    marginTop: 2,
  },
  referBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  referBtnText: {
    color: '#0b0c10',
    fontSize: 11,
    fontWeight: 'bold',
  }
});
