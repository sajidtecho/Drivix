import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
  Platform,
  LayoutAnimation,
  DeviceEventEmitter,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Home, Calendar, Car, User } from 'lucide-react-native';

// Import our views directly!
import DashboardScreen from '../app/index';
import ExploreScreen from '../app/explore';
import DriverHubScreen from '../app/driver-hub';

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width - 32; // Spacing of 16px on left/right
const TAB_WIDTH = TAB_BAR_WIDTH / 4;

export default function AppTabs() {
  const colors = useTheme();
  const [activeTab, setActiveTab] = useState<'home' | 'bookings' | 'hub' | 'profile'>('home');
  const [isHomeMapActive, setIsHomeMapActive] = useState(true);

  // Animated offset for capsule sliding
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Icon bounce animations (scale values) for each tab
  const scaleAnims = {
    home: useRef(new Animated.Value(1)).current,
    bookings: useRef(new Animated.Value(1)).current,
    hub: useRef(new Animated.Value(1)).current,
    profile: useRef(new Animated.Value(1)).current,
  };

  const getTabIndex = (tab: string) => {
    switch (tab) {
      case 'home': return 0;
      case 'bookings': return 1;
      case 'hub': return 2;
      case 'profile': return 3;
      default: return 0;
    }
  };

  const handleTabPress = (tabName: 'home' | 'bookings' | 'hub' | 'profile') => {
    if (activeTab === tabName) return;

    setActiveTab(tabName);

    // 1. Spring slide animation for the indicator capsule
    Animated.spring(slideAnim, {
      toValue: getTabIndex(tabName) * TAB_WIDTH,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // 2. Tactile scale bounce animation on tap (1.0 -> 1.15 -> 1.0)
    Animated.sequence([
      Animated.timing(scaleAnims[tabName], {
        toValue: 1.15,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.spring(scaleAnims[tabName], {
        toValue: 1.0,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Listen for Home wizard step changes to hide/show the tab bar
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('setHomeMapActive', (active: boolean) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsHomeMapActive(active);
    });
    return () => sub.remove();
  }, []);

  // Listen for tab change events from sub-views
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('changeTab', (tabName: any) => {
      handleTabPress(tabName);
    });
    return () => sub.remove();
  }, [activeTab]);

  useEffect(() => {
    // Sync initial animated offset on load
    slideAnim.setValue(getTabIndex(activeTab) * TAB_WIDTH);
  }, []);

  const showTabBar = activeTab !== 'home' || isHomeMapActive;

  return (
    <View style={styles.container}>
      {/* ─── Active Screen Area ─── */}
      <View style={styles.screenWrapper}>
        {activeTab === 'home' && <DashboardScreen />}
        {activeTab === 'bookings' && <ExploreScreen tab="bookings" isTabRender />}
        {activeTab === 'hub' && <DriverHubScreen onBack={() => handleTabPress('home')} />}
        {activeTab === 'profile' && <ExploreScreen tab="profile" isTabRender />}
      </View>

      {/* ─── Floating Tab Bar (One UI 7 Style) ─── */}
      {showTabBar && (
        <View
          style={[
            styles.tabBarContainer,
            {
              backgroundColor: 'rgba(15, 16, 22, 0.9)',
              borderColor: colors.borderGlass,
            },
          ]}
        >
          {/* Sliding Indicator Capsule */}
          <Animated.View
            style={[
              styles.capsuleIndicator,
              {
                width: TAB_WIDTH - 12,
                backgroundColor: '#ffce00', // Drivix Yellow/Gold Capsule
                transform: [{ translateX: Animated.add(slideAnim, 6) }],
              },
            ]}
          />

          {/* Tab Items */}
          {[
            { name: 'home', label: 'Home', icon: Home },
            { name: 'bookings', label: 'Bookings', icon: Calendar },
            { name: 'hub', label: 'Hub', icon: Car },
            { name: 'profile', label: 'Profile', icon: User },
          ].map((item) => {
            const isActive = activeTab === item.name;
            const IconComp = item.icon;
            const scale = scaleAnims[item.name as keyof typeof scaleAnims];

            return (
              <TouchableOpacity
                key={item.name}
                style={styles.tabItem}
                onPress={() => handleTabPress(item.name as any)}
                activeOpacity={0.9}
              >
                <Animated.View style={{ transform: [{ scale: isActive ? scale : 1 }] }}>
                  <IconComp
                    size={20}
                    color={isActive ? '#0b0c10' : '#a0aab2'}
                    strokeWidth={isActive ? 2.5 : 2.0}
                  />
                </Animated.View>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? '#0b0c10' : '#a0aab2',
                      fontWeight: isActive ? '900' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    height: 72,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
    overflow: 'hidden',
  },
  capsuleIndicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: 18,
    shadowColor: '#ffce00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
  },
});
