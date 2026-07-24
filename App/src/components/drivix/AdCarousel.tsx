import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react-native';
import { api } from '@/services/api';
import { useTheme } from '@/hooks/use-theme';

const { width } = Dimensions.get('window');
const CAROUSEL_HEIGHT = 200;

interface Banner {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  redirectUrl: string;
  priority: number;
}

export default function AdCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const colors = useTheme();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const autoPlayTimer = useRef<any>(null);
  const trackedImpressions = useRef<Set<string>>(new Set());

  // Fetch active banners on mount
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await api.get('/banners');
        setBanners(response.data);
      } catch (error) {
        console.error('Error fetching mobile banners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Track impression for the currently visible banner
  useEffect(() => {
    if (banners.length === 0) return;
    const currentBanner = banners[currentIndex];
    if (!currentBanner) return;

    const bannerId = currentBanner._id;
    if (!trackedImpressions.current.has(bannerId)) {
      trackedImpressions.current.add(bannerId);
      api.post(`/banners/${bannerId}/impression`).catch((err) => {
        console.error('Mobile impression tracking error:', err);
      });
    }
  }, [currentIndex, banners]);

  // Autoplay functionality
  useEffect(() => {
    if (banners.length <= 1) return;

    autoPlayTimer.current = setInterval(() => {
      const nextIndex = (currentIndex + 1) % banners.length;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 5000);

    return () => {
      if (autoPlayTimer.current) {
        clearInterval(autoPlayTimer.current);
      }
    };
  }, [currentIndex, banners]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width;
    const newIndex = Math.floor(contentOffset / viewSize + 0.5);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < banners.length) {
      setCurrentIndex(newIndex);
    }
  };

  const handleBannerPress = async (banner: Banner) => {
    try {
      await api.post(`/banners/${banner._id}/click`);
    } catch (err) {
      console.error('Mobile click tracking error:', err);
    }

    if (banner.redirectUrl.startsWith('http')) {
      Linking.openURL(banner.redirectUrl).catch((err) => {
        console.error('Failed to open external url:', err);
      });
    } else {
      if (banner.redirectUrl.startsWith('/')) {
        router.push(banner.redirectUrl as any);
      } else {
        router.push(`/${banner.redirectUrl}` as any);
      }
    }
  };

  const scrollPrev = () => {
    if (banners.length <= 1) return;
    const prevIndex = currentIndex === 0 ? banners.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    flatListRef.current?.scrollToIndex({
      index: prevIndex,
      animated: true,
    });
  };

  const scrollNext = () => {
    if (banners.length <= 1) return;
    const nextIndex = (currentIndex + 1) % banners.length;
    setCurrentIndex(nextIndex);
    flatListRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });
  };

  // Helper function to split ad titles into two lines (White and Gold) similar to Hero Card
  const renderHeroStyleTitle = (titleText: string) => {
    const separators = ['|', '-', ':'];
    let parts: string[] = [];
    
    for (const sep of separators) {
      if (titleText.includes(sep)) {
        parts = titleText.split(sep);
        break;
      }
    }
    
    if (parts.length < 2) {
      const words = titleText.split(' ');
      if (words.length > 2) {
        const mid = Math.ceil(words.length / 2);
        parts = [
          words.slice(0, mid).join(' '),
          words.slice(mid).join(' ')
        ];
      } else {
        parts = [titleText, ''];
      }
    }
    
    const firstLine = parts[0].trim();
    const secondLine = parts.slice(1).join(' ').trim();
    
    return (
      <Text style={[styles.heroHeading, { color: colors.text }]} numberOfLines={2}>
        {firstLine}
        {secondLine ? (
          <>
            {'\n'}
            <Text style={{ color: colors.primary }}>{secondLine}</Text>
          </>
        ) : null}
      </Text>
    );
  };

  if (loading || banners.length === 0) {
    return null;
  }

  const cardWidth = width - 40; // Aligns perfectly with index.tsx's 20px padding (width - 40)

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Automotive Promotions</Text>
      
      <View style={styles.carouselWrapper}>
        <FlatList
          ref={flatListRef}
          data={banners}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item._id}
          getItemLayout={(data, index) => ({
            length: cardWidth,
            offset: cardWidth * index,
            index,
          })}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise((resolve) => setTimeout(resolve, 100));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
            });
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.955}
              onPress={() => handleBannerPress(item)}
              style={[styles.card, { width: cardWidth, borderColor: colors.borderGlass }]}
            >
              {/* Blended Service Background Image */}
              <View style={StyleSheet.absoluteFill}>
                <Image 
                  source={{ uri: item.imageUrl }} 
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(21, 22, 30, 0.88)' }]} />
              </View>

              {/* Full-Width Text & CTA Layout matching Hero Card */}
              <View style={styles.textColumn}>
                {renderHeroStyleTitle(item.title)}
                <Text style={[styles.heroDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item.description}
                </Text>

                {/* Yellow Capsule Button matching Hero Start Booking button */}
                <View style={[styles.heroBtn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.heroBtnText}>{item.ctaText}</Text>
                  {item.redirectUrl.startsWith('http') && (
                    <ExternalLink size={11} color="#0b0c10" style={styles.ctaIcon} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Manual Indicator Chevron Controls */}
        {banners.length > 1 && (
          <>
            <TouchableOpacity onPress={scrollPrev} style={styles.arrowLeft}>
              <ChevronLeft size={14} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={scrollNext} style={styles.arrowRight}>
              <ChevronRight size={14} color="#fff" />
            </TouchableOpacity>
          </>
        )}

        {/* Dot indicators in top right corner capsule */}
        {banners.length > 1 && (
          <View style={styles.dotsContainer}>
            {banners.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentIndex ? colors.primary : 'rgba(255,255,255,0.4)',
                    width: index === currentIndex ? 12 : 5,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 90,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
    paddingHorizontal: 0,
  },
  carouselWrapper: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
  },
  card: {
    height: CAROUSEL_HEIGHT,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  textColumn: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    gap: 8,
    zIndex: 2,
  },
  heroHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  heroDescription: {
    fontSize: 11,
    lineHeight: 16,
  },
  heroBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20, // Capsule / Pill Button
    marginTop: 4,
  },
  heroBtnText: {
    color: '#0b0c10',
    fontWeight: 'bold',
    fontSize: 11,
  },
  ctaIcon: {
    marginLeft: 4,
  },
  imageColumn: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fadeOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 60,
    opacity: 0.95, // Clean horizontal fade
  },
  dotsContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    zIndex: 10,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 2.5,
  },
  arrowLeft: {
    position: 'absolute',
    top: CAROUSEL_HEIGHT / 2 - 14,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  arrowRight: {
    position: 'absolute',
    top: CAROUSEL_HEIGHT / 2 - 14,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
