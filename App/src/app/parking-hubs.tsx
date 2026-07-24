import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Dimensions,
  Platform,
  Animated,
  Modal,
  Alert,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  Menu,
  Search,
  MapPin,
  Star,
  Clock,
  Compass,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Shield,
  X,
  ChevronRight,
  User,
  Car,
  HelpCircle,
  Info,
  PhoneCall,
  Bell,
  Heart,
  Home,
  Ticket,
  Wallet
} from 'lucide-react-native';

import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import LoginBottomSheet from '@/components/LoginBottomSheet';

const { width } = Dimensions.get('window');

// Safely require react-native-maps conditionally to prevent web crashes
let MapView: any;
let Marker: any;
let UrlTile: any;
try {
  if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    UrlTile = Maps.UrlTile;
  }
} catch {
  console.warn('react-native-maps not available in parking-hubs');
}

const ScalePressable = ({ children, onPress, style }: { children: any, onPress?: () => void, style?: any }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: Platform.OS !== 'web',
      speed: 120,
      bounciness: 0
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 120,
      bounciness: 8
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

interface Coords {
  latitude: number;
  longitude: number;
}

interface ParkingHub {
  _id: string;
  parkingName: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  openingTime: string;
  closingTime: string;
  availableSlots: number;
  hourlyPrice: number;
  amenities: string[];
  images: string[];
  distance?: number;
}

interface Place {
  _id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  rating: number;
  description: string;
  imageUrl: string;
  distance?: number;
  nearestParking?: {
    _id: string;
    parkingName: string;
    distance: number;
    distanceMeters: number;
    availableSlots: number;
    hourlyPrice: number;
    rating: number;
  };
}

interface PromotionBanner {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  redirectUrl: string;
}

// Haversine distance helper
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface ParkingHubsScreenProps {
  onBack?: () => void;
  onBook?: (facilityId: string) => void;
}

export default function ParkingHubsScreen({ onBack, onBook }: ParkingHubsScreenProps) {
  const router = useRouter();
  const colors = useTheme();
  const { user, isAuthenticated } = useAuth();

  // Coordinates (default: Greater Noida / Sharda University area)
  const [userCoords, setUserCoords] = useState<Coords>({ latitude: 28.4727, longitude: 77.4827 });
  const [isLocating, setIsLocating] = useState(true);

  // Data States
  const [parkingHubs, setParkingHubs] = useState<ParkingHub[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [banners, setBanners] = useState<PromotionBanner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // UI States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loginVisible, setLoginVisible] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isPlacesExpanded, setIsPlacesExpanded] = useState(false);

  // Map Picker Modal States
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [tempCoords, setTempCoords] = useState<Coords>(userCoords);

  // Animations
  const drawerAnimation = useRef(new Animated.Value(width)).current;
  const bannerFlatListRef = useRef<FlatList>(null);
  const autoPlayTimer = useRef<any>(null);

  // Retrieve user location
  const getUserLocation = useCallback(() => {
    setIsLocating(true);
    const geo = typeof navigator !== 'undefined' ? navigator.geolocation : null;

    if (geo) {
      geo.getCurrentPosition(
        (pos) => {
          setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      // Graceful fallback to default coordinates if geolocation is not available
      setIsLocating(false);
    }
  }, []);

  // Fetch Banners, Parking Facilities & Places
  const fetchData = useCallback(async (coords: Coords, queryStr: string = '') => {
    setLoading(true);
    try {
      // 1. Fetch promotional banners
      const bannersResponse = await api.get('/banners');
      setBanners(bannersResponse.data);

      // 2. Fetch parking locations
      const parkingResponse = await api.get('/parking');
      const hubsWithDistance = parkingResponse.data.map((h: any) => {
        const d = getDistance(coords.latitude, coords.longitude, h.latitude, h.longitude);
        return { ...h, distance: d };
      }).sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
      setParkingHubs(hubsWithDistance);

      // 3. Fetch explore places
      const placesResponse = await api.get(`/places?latitude=${coords.latitude}&longitude=${coords.longitude}&search=${queryStr}`);
      setPlaces(placesResponse.data);
    } catch (err) {
      console.error('Error fetching Parking Hubs discover data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Handle Location Permission / Fetch on mount
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Refetch when coords or search query changes
  useEffect(() => {
    fetchData(userCoords, searchQuery);
  }, [userCoords, searchQuery, fetchData]);

  // Autoplay for promotional banners
  useEffect(() => {
    if (banners.length <= 1) return;
    autoPlayTimer.current = setInterval(() => {
      const nextIndex = (bannerIndex + 1) % banners.length;
      setBannerIndex(nextIndex);
      bannerFlatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true
      });
    }, 5000);

    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, [bannerIndex, banners]);

  // Pull to refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    getUserLocation();
  };

  // Open Drawer slide animation
  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.timing(drawerAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: Platform.OS !== 'web'
    }).start();
  };

  // Close Drawer slide animation
  const closeDrawer = () => {
    Animated.timing(drawerAnimation, {
      toValue: width,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web'
    }).start(() => {
      setDrawerVisible(false);
    });
  };

  const handleNavigate = (lat: number, lon: number) => {
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lon}`,
      android: `google.navigation:q=${lat},${lon}`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
    });
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to launch map application.');
    });
  };

  const handleBookingRedirect = (facilityId: string) => {
    if (onBook) {
      onBook(facilityId);
    } else {
      router.push({
        pathname: '/',
        params: { facilityId }
      });
    }
  };

  const handleDrawerNavigation = (route: string) => {
    closeDrawer();
    setTimeout(() => {
      if (route === '/') {
        if (onBack) {
          onBack();
        } else {
          router.push('/');
        }
      } else if (route.startsWith('http')) {
        Linking.openURL(route);
      } else {
        router.push(route as any);
      }
    }, 250);
  };

  const renderParkingCard = ({ item }: { item: ParkingHub }) => {
    const formattedDistance = item.distance && item.distance < 1
      ? `${Math.round(item.distance * 1000)}m`
      : `${item.distance?.toFixed(1)} km`;

    return (
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {item.parkingName}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.address}, {item.city}
            </Text>
          </View>
          <View style={styles.ratingBadge}>
            <Star size={11} color={colors.primary} fill={colors.primary} />
            <Text style={[styles.ratingText, { color: colors.text }]}>4.5</Text>
          </View>
        </View>

        <View style={styles.cardInfoGrid}>
          <View style={styles.infoRow}>
            <MapPin size={12} color={colors.primary} />
            <Text style={[styles.infoValue, { color: colors.text }]}>{formattedDistance} away</Text>
          </View>
          <View style={styles.infoRow}>
            <Car size={12} color="#00f2ff" />
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {item.availableSlots > 0 ? `${item.availableSlots} slots` : 'Full'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={12} color="#a78bfa" />
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {item.openingTime} - {item.closingTime}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.priceTag, { color: colors.primary }]}>₹{item.hourlyPrice}/hr</Text>
          </View>
        </View>

        {item.amenities.length > 0 && (
          <View style={styles.amenitiesStrip}>
            {item.amenities.slice(0, 3).map((amenity, idx) => (
              <View key={idx} style={[styles.amenityCapsule, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                <Text style={[styles.amenityText, { color: colors.textSecondary }]}>{amenity}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.cardActions}>
          <ScalePressable
            style={[styles.btnSecondary, { borderColor: colors.borderGlass }]}
            onPress={() => handleNavigate(item.latitude, item.longitude)}
          >
            <Compass size={13} color={colors.text} style={{ marginRight: 4 }} />
            <Text style={[styles.btnSecondaryText, { color: colors.text }]}>Navigate</Text>
          </ScalePressable>
          <ScalePressable
            style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
            onPress={() => handleBookingRedirect(item._id)}
          >
            <Text style={styles.btnPrimaryText}>Book Now</Text>
            <ArrowRight size={13} color="#0b0c10" style={{ marginLeft: 4 }} />
          </ScalePressable>
        </View>
      </View>
    );
  };

  const renderPlaceCard = ({ item }: { item: Place }) => {
    return (
      <View style={[styles.placeCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]}>
        <Image
          source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=500&q=80' }}
          style={styles.placeImage}
          contentFit="cover"
        />
        
        <View style={styles.placeCardDetails}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.placeTitle, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.placeCategory, { color: colors.primary }]}>
                {item.category}
              </Text>
            </View>
            <View style={styles.ratingBadge}>
              <Star size={11} color={colors.primary} fill={colors.primary} />
              <Text style={[styles.ratingText, { color: colors.text }]}>{item.rating}</Text>
            </View>
          </View>
          
          <Text style={[styles.placeDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Dynamic Parking Recommendation */}
          {item.nearestParking && (
            <View style={[styles.recommendationContainer, { backgroundColor: 'rgba(255, 206, 0, 0.05)', borderColor: `${colors.primary}25` }]}>
              <View style={styles.recommendationHeader}>
                <MapPin size={11} color={colors.primary} />
                <Text style={[styles.recommendationTitle, { color: colors.text }]}>Recommended Parking</Text>
              </View>
              <Text style={[styles.recommendationName, { color: colors.text }]}>
                {item.nearestParking.parkingName}
              </Text>
              <View style={styles.recommendationInfo}>
                <Text style={[styles.recommendationMeta, { color: colors.textSecondary }]}>
                  • {item.nearestParking.distanceMeters}m away
                </Text>
                <Text style={[styles.recommendationMeta, { color: colors.textSecondary }]}>
                  • {item.nearestParking.availableSlots} slots
                </Text>
                <Text style={[styles.recommendationMeta, { color: colors.primary, fontWeight: 'bold' }]}>
                  • ₹{item.nearestParking.hourlyPrice}/hr
                </Text>
              </View>
              <ScalePressable
                style={[styles.btnRecommendBook, { backgroundColor: colors.primary }]}
                onPress={() => handleBookingRedirect(item.nearestParking!._id)}
              >
                <Text style={styles.btnRecommendBookText}>Book Parking</Text>
              </ScalePressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* STICKY HEADER */}
      <View style={[styles.stickyHeader, { backgroundColor: colors.background, borderBottomColor: colors.borderGlass }]}>
        {onBack && (
          <ScalePressable onPress={onBack} style={{ padding: 4, marginRight: 4 }}>
            <ArrowLeft size={20} color={colors.text} />
          </ScalePressable>
        )}
        <View style={styles.searchContainer}>
          <Search size={16} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search destination, parking hub, mall..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={(t) => {
              setSearchQuery(t);
              fetchData(userCoords, t);
            }}
          />
          {searchQuery !== '' && (
            <ScalePressable onPress={() => setSearchQuery('')} style={{ padding: 4, marginRight: 4 }}>
              <X size={14} color={colors.textSecondary} />
            </ScalePressable>
          )}
          <ScalePressable 
            onPress={() => {
              setTempCoords(userCoords);
              setMapModalVisible(true);
            }} 
            style={{ padding: 4 }}
          >
            <MapPin size={16} color={colors.primary} />
          </ScalePressable>
        </View>
        <ScalePressable style={styles.menuTrigger} onPress={openDrawer}>
          <Menu size={22} color={colors.text} />
        </ScalePressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {isLocating && (
          <View style={styles.locatingBar}>
            <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.locatingText, { color: colors.textSecondary }]}>Determining your coordinates...</Text>
          </View>
        )}

        {/* LOADING & EMPTY STATES */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>
              Fetching nearby facilities...
            </Text>
          </View>
        ) : (
          <>
            {/* NEARBY PARKING HUBS */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📍 Nearby Parking Hubs</Text>
              {parkingHubs.length === 0 ? (
                <View style={[styles.emptyCard, { borderColor: colors.borderGlass }]}>
                  <Compass size={24} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No parking locations available.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={parkingHubs.slice(0, 4)}
                  renderItem={renderParkingCard}
                  keyExtractor={(item) => item._id}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                />
              )}
            </View>

            {/* DYNAMIC PROMOTIONAL BANNER CAROUSEL */}
            {banners.length > 0 && (
              <View style={styles.bannerCarouselContainer}>
                <FlatList
                  ref={bannerFlatListRef}
                  data={banners}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item._id}
                  onMomentumScrollEnd={(e) => {
                    const idx = Math.floor(e.nativeEvent.contentOffset.x / width);
                    setBannerIndex(idx);
                  }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={[styles.bannerSlide, { width }]}
                      onPress={() => handleDrawerNavigation(item.redirectUrl)}
                    >
                      <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} contentFit="cover" />
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(21, 22, 30, 0.78)' }]} />
                      <View style={styles.bannerTextContainer}>
                        <Text style={styles.bannerTitle}>{item.title}</Text>
                        <Text style={[styles.bannerDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                        <View style={[styles.bannerCta, { backgroundColor: colors.primary }]}>
                          <Text style={styles.bannerCtaText}>{item.ctaText}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
                {banners.length > 1 && (
                  <View style={styles.bannerDots}>
                    {banners.map((_, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.bannerDot,
                          {
                            backgroundColor: idx === bannerIndex ? colors.primary : 'rgba(255,255,255,0.3)',
                            width: idx === bannerIndex ? 10 : 4
                          }
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* EXPLORE NEARBY PLACES */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>🏙 Explore Nearby Places</Text>
                {places.length > 1 && (
                  <TouchableOpacity onPress={() => setIsPlacesExpanded(!isPlacesExpanded)} style={{ paddingVertical: 4, paddingHorizontal: 8 }}>
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>
                      {isPlacesExpanded ? 'View Less' : 'View More'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {places.length === 0 ? (
                <View style={[styles.emptyCard, { borderColor: colors.borderGlass }]}>
                  <Compass size={24} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No nearby destinations found.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={isPlacesExpanded ? places : places.slice(0, 1)}
                  renderItem={renderPlaceCard}
                  keyExtractor={(item) => item._id}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* DRAWER MODAL OVERLAY */}
      <Modal visible={drawerVisible} transparent animationType="none">
        <View style={styles.drawerBackdrop}>
          <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={closeDrawer} />
          <Animated.View
            style={[
              styles.drawerContent,
              {
                backgroundColor: '#0b0c10',
                borderColor: colors.borderGlass,
                transform: [{ translateX: drawerAnimation }]
              }
            ]}
          >
            <View style={[styles.drawerHeader, { borderBottomColor: colors.borderGlass }]}>
              <Text style={[styles.drawerTitle, { color: '#ffffff' }]}>DRIVIX MENU</Text>
              <TouchableOpacity onPress={closeDrawer} style={{ padding: 4 }}>
                <X size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.drawerLinks}>
              {isAuthenticated && user && (
                <ScalePressable
                  style={[styles.profileCard, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass, marginBottom: 20 }]}
                  onPress={() => {
                    closeDrawer();
                    router.push('/explore?tab=profile');
                  }}
                >
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                      {user.name ? user.name.trim().charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.profileCardName, { color: '#ffffff' }]} numberOfLines={1}>
                      {user.name || 'User Profile'}
                    </Text>
                    <Text style={styles.profileBalanceLabel} numberOfLines={1}>
                      Balance: <Text style={{ color: '#ffce00', fontWeight: 'bold' }}>Rs. {user.walletBalance ?? 0}</Text>
                    </Text>
                  </View>
                </ScalePressable>
              )}

              <Text style={[styles.drawerSectionHeader, { color: colors.textSecondary }]}>NAVIGATION & DETAILS</Text>

              {/* Home */}
              <ScalePressable 
                style={[styles.drawerLink, styles.activeDrawerLink, { backgroundColor: colors.backgroundElement }]} 
                onPress={() => handleDrawerNavigation('/')}
              >
                <Home size={16} color={colors.primary} />
                <Text style={[styles.drawerLinkLabel, styles.activeDrawerLinkLabel]}>Home</Text>
              </ScalePressable>

              {/* Personal Details */}
              <ScalePressable 
                style={[styles.drawerLink, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]} 
                onPress={() => handleDrawerNavigation('/explore?tab=profile')}
              >
                <User size={16} color={colors.textSecondary} />
                <Text style={[styles.drawerLinkLabel, { color: colors.text }]}>Personal Details</Text>
              </ScalePressable>

              {/* Registered Vehicle */}
              <ScalePressable 
                style={[styles.drawerLink, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]} 
                onPress={() => handleDrawerNavigation('/explore?tab=vehicles')}
              >
                <Car size={16} color={colors.textSecondary} />
                <Text style={[styles.drawerLinkLabel, { color: colors.text }]}>Registered Vehicle</Text>
              </ScalePressable>

              {/* Ticket and Bookings */}
              <ScalePressable 
                style={[styles.drawerLink, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]} 
                onPress={() => handleDrawerNavigation('/explore?tab=bookings')}
              >
                <Ticket size={16} color={colors.textSecondary} />
                <Text style={[styles.drawerLinkLabel, { color: colors.text }]}>Ticket and Bookings</Text>
              </ScalePressable>

              {/* Wallet Balance */}
              <ScalePressable 
                style={[styles.drawerLink, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]} 
                onPress={() => handleDrawerNavigation('/explore?tab=wallet')}
              >
                <Wallet size={16} color={colors.textSecondary} />
                <Text style={[styles.drawerLinkLabel, { color: colors.text }]}>Wallet Balance</Text>
              </ScalePressable>

              {/* Secure Documents */}
              <ScalePressable 
                style={[styles.drawerLink, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]} 
                onPress={() => handleDrawerNavigation('/explore?tab=documents')}
              >
                <Shield size={16} color={colors.textSecondary} />
                <Text style={[styles.drawerLinkLabel, { color: colors.text }]}>Secure Documents</Text>
              </ScalePressable>

              {/* Help and FAQ */}
              <ScalePressable 
                style={[styles.drawerLink, { backgroundColor: colors.backgroundElement, borderColor: colors.borderGlass }]} 
                onPress={() => handleDrawerNavigation('/faq')}
              >
                <HelpCircle size={16} color={colors.textSecondary} />
                <Text style={[styles.drawerLinkLabel, { color: colors.text }]}>Help and FAQ</Text>
              </ScalePressable>
            </ScrollView>

            <View style={[styles.drawerFooter, { borderTopColor: colors.borderGlass }]}>
              {isAuthenticated && user ? (
                <ScalePressable
                  style={[styles.btnDrawerAction, { borderColor: 'rgba(255, 75, 75, 0.4)', backgroundColor: colors.backgroundElement }]}
                  onPress={() => {
                    closeDrawer();
                    router.push('/explore?tab=profile');
                  }}
                >
                  <User size={16} color="rgba(255, 75, 75, 0.8)" />
                  <Text style={[styles.btnDrawerActionText, { color: 'rgba(255, 75, 75, 0.8)' }]}>Log Out Account</Text>
                </ScalePressable>
              ) : (
                <ScalePressable
                  style={[styles.btnDrawerAction, { borderColor: colors.primary, backgroundColor: colors.backgroundElement }]}
                  onPress={() => {
                    closeDrawer();
                    setLoginVisible(true);
                  }}
                >
                  <User size={16} color={colors.primary} />
                  <Text style={[styles.btnDrawerActionText, { color: colors.primary }]}>Log In Account</Text>
                </ScalePressable>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* LOGIN BOTTOM SHEET */}
      <LoginBottomSheet visible={loginVisible} onCancel={() => setLoginVisible(false)} />

      {/* Search Location Map Modal */}
      <Modal
        visible={mapModalVisible}
        animationType="slide"
        onRequestClose={() => setMapModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderGlass
          }}>
            <TouchableOpacity onPress={() => setMapModalVisible(false)} style={{ padding: 4 }}>
              <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>📍 Select Search Center</Text>
            <TouchableOpacity 
              onPress={() => {
                setUserCoords(tempCoords);
                setMapModalVisible(false);
              }}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 14
              }}
            >
              <Text style={{ color: '#0b0c10', fontSize: 12, fontWeight: 'bold' }}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Map Viewer */}
          {Platform.OS === 'web' ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 12 }}>
                Web map coordinates set to Noida region:
              </Text>
              <Text style={{ color: colors.text, fontWeight: 'bold' }}>
                Lat: {tempCoords.latitude.toFixed(4)} | Lng: {tempCoords.longitude.toFixed(4)}
              </Text>
            </View>
          ) : (
            MapView ? (
              <View style={{ flex: 1 }}>
                <MapView
                  style={StyleSheet.absoluteFillObject}
                  mapType={Platform.OS === 'android' ? 'none' : 'standard'}
                  initialRegion={{
                    latitude: tempCoords.latitude,
                    longitude: tempCoords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05
                  }}
                  onRegionChangeComplete={(region: any) => {
                    setTempCoords({
                      latitude: region.latitude,
                      longitude: region.longitude
                    });
                  }}
                  showsUserLocation
                  showsMyLocationButton
                >
                  {UrlTile && (
                    <UrlTile
                      urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                      maximumZ={19}
                      tileSize={256}
                    />
                  )}
                </MapView>
                {/* Fixed center pin target (Uber/Zomato style) */}
                <View style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginLeft: -16,
                  marginTop: -32,
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 99
                }} pointerEvents="none">
                  <MapPin size={32} color="#ffce00" fill="#0b0c10" />
                </View>
              </View>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )
          )}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15161e',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 38
  },
  searchIcon: {
    marginRight: 6
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    padding: 0
  },
  menuTrigger: {
    padding: 4
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '500'
  },
  locatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1b24',
    paddingVertical: 6
  },
  locatingText: {
    fontSize: 11
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  cardSubtitle: {
    fontSize: 11,
    marginTop: 2
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3
  },
  ratingText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  cardInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  infoValue: {
    fontSize: 11
  },
  priceTag: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  amenitiesStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14
  },
  amenityCapsule: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  amenityText: {
    fontSize: 9,
    fontWeight: '600'
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10
  },
  btnSecondary: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnSecondaryText: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  btnPrimary: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnPrimaryText: {
    color: '#0b0c10',
    fontSize: 11,
    fontWeight: 'bold'
  },
  emptyCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  emptyText: {
    fontSize: 11
  },
  placeCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden'
  },
  placeImage: {
    width: '100%',
    height: 120
  },
  placeCardDetails: {
    padding: 14
  },
  placeTitle: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  placeCategory: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase'
  },
  placeDescription: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6
  },
  recommendationContainer: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  recommendationTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  recommendationName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4
  },
  recommendationInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 6
  },
  recommendationMeta: {
    fontSize: 10
  },
  btnRecommendBook: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginTop: 8
  },
  btnRecommendBookText: {
    color: '#0b0c10',
    fontSize: 10,
    fontWeight: 'bold'
  },
  bannerCarouselContainer: {
    marginTop: 24,
    position: 'relative'
  },
  bannerSlide: {
    height: 140,
    position: 'relative',
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  bannerImage: {
    ...StyleSheet.absoluteFill
  },
  bannerTextContainer: {
    maxWidth: '70%',
    zIndex: 2,
    gap: 4
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  bannerDesc: {
    fontSize: 11,
    lineHeight: 14
  },
  bannerCta: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 4
  },
  bannerCtaText: {
    color: '#0b0c10',
    fontSize: 10,
    fontWeight: 'bold'
  },
  bannerDots: {
    position: 'absolute',
    bottom: 8,
    right: 16,
    flexDirection: 'row',
    gap: 4
  },
  bannerDot: {
    height: 4,
    borderRadius: 2
  },
  drawerBackdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  backdropTouch: {
    flex: 1
  },
  drawerContent: {
    width: 280,
    height: '100%',
    borderLeftWidth: 1
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  drawerSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 16
  },
  drawerLinks: {
    padding: 20
  },
  drawerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12
  },
  activeDrawerLink: {
    borderColor: '#ffce00'
  },
  drawerLinkLabel: {
    fontSize: 13,
    fontWeight: '600'
  },
  activeDrawerLinkLabel: {
    color: '#ffce00'
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    marginTop: 'auto'
  },
  btnDrawerAction: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  btnDrawerActionText: {
    fontSize: 13,
    fontWeight: 'bold'
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffce00',
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileAvatarText: {
    color: '#0b0c10',
    fontWeight: 'bold',
    fontSize: 16
  },
  profileCardName: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  profileBalanceLabel: {
    fontSize: 11,
    color: '#a0aab2',
    marginTop: 2
  }
});
