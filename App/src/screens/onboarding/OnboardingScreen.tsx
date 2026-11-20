import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, Zap, Navigation, ShieldCheck } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { storage } from '../../services/storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface OnboardingScreenProps {
  onComplete: () => void;
}

interface OnboardingSlide {
  id: string;
  badgeIcon: React.ReactNode;
  badgeText: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
  title: string;
  description: string;
  image: any;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    badgeIcon: <Car size={16} color="#16A34A" />,
    badgeText: 'Car Parking',
    badgeBgColor: '#F0FDF4',
    badgeTextColor: '#16A34A',
    title: 'You can feel best performance on your drive 💪',
    description: 'Instant reservations, real-time occupancy updates, and automated contactless gate access.',
    image: require('../../../assets/images/onboarding_hero_car.png'),
  },
  {
    id: '2',
    badgeIcon: <Zap size={16} color="#4F46E5" />,
    badgeText: 'ANPR & Fastag Entry',
    badgeBgColor: '#EEF2FF',
    badgeTextColor: '#4F46E5',
    title: 'Effortless automated barrier entry with zero waiting ⚡',
    description: 'Smart AI cameras detect your vehicle license plate and lift barriers automatically as you arrive.',
    image: require('../../../assets/images/onboarding_hero_car.png'),
  },
  {
    id: '3',
    badgeIcon: <Navigation size={16} color="#D97706" />,
    badgeText: 'Indoor Guidance',
    badgeBgColor: '#FEF3C7',
    badgeTextColor: '#D97706',
    title: 'Turn-by-turn indoor routing straight to your bay 🎯',
    description: 'Never circle endlessly looking for parking. Step-by-step guidance directs you right to your booked bay.',
    image: require('../../../assets/images/onboarding_hero_car.png'),
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleFinish = async () => {
    try {
      await storage.saveItem('drivix_has_onboarded', true);
    } catch (e) {
      console.warn('Could not save onboarding status:', e);
    }
    onComplete();
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (newIndex >= 0 && newIndex < ONBOARDING_SLIDES.length) {
      setCurrentIndex(newIndex);
    }
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    return (
      <View style={styles.slideContainer}>
        {/* Top Hero Illustration Area */}
        <View style={styles.heroWrapper}>
          <Image
            source={item.image}
            style={styles.heroImage}
            contentFit="contain"
            transition={300}
          />
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Category Badge matching the reference design */}
          <View style={styles.badgeRow}>
            <View style={styles.badgePill}>
              {item.badgeIcon}
              <Text style={styles.badgeText}>{item.badgeText}</Text>
            </View>
          </View>

          {/* Headline Title */}
          <Text style={styles.titleText}>{item.title}</Text>

          {/* Subtitle Description */}
          <Text style={styles.descriptionText}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Slide Carousel */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        style={styles.carouselList}
      />

      {/* Pagination Dots */}
      <View style={styles.paginationRow}>
        {ONBOARDING_SLIDES.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                isActive ? styles.dotActive : styles.dotInactive,
              ]}
            />
          );
        })}
      </View>

      {/* Bottom Action Buttons Row */}
      <View style={styles.bottomBar}>
        {/* Skip Button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>

        {/* Next / Get Started Button */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  carouselList: {
    flex: 1,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  heroWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  heroImage: {
    width: SCREEN_WIDTH * 0.92,
    height: '100%',
  },
  contentSection: {
    width: '100%',
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 38,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginTop: 2,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 22,
    backgroundColor: '#5B50E6',
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#E5E7EB',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 14,
  },
  skipButton: {
    flex: 1,
    height: 54,
    backgroundColor: '#EFF0F7',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1F30',
  },
  nextButton: {
    flex: 1.3,
    height: 54,
    backgroundColor: '#5B50E6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5B50E6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

