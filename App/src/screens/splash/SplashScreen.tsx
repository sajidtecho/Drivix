import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // 1. Entrance animation: fade in and scale up smoothly
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Gentle ripple pulse animation on the background circles
    Animated.loop(
      Animated.sequence([
        Animated.timing(rippleAnim, {
          toValue: 1.04,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(rippleAnim, {
          toValue: 0.96,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Hold splash screen for 2.2 seconds, then transition to Onboarding
    const timer = setTimeout(() => {
      handleComplete();
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const handleComplete = () => {
    onFinish?.();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleComplete}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Outermost subtle ripple circle */}
        <Animated.View
          style={[
            styles.outerCircle,
            {
              transform: [{ scale: rippleAnim }],
            },
          ]}
        >
          {/* Middle subtle ripple circle */}
          <View style={styles.middleCircle}>
            {/* Inner elevated white card disc */}
            <View style={styles.innerCircle}>
              {/* Connected smart car with radar signal icon */}
              <Image
                source={require('../../../assets/images/car_icon.png')}
                style={styles.carIcon}
                contentFit="contain"
              />

              {/* Drivix in signature vibrant yellow font */}
              <Text style={styles.brandTitle}>Drivix</Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleCircle: {
    width: 245,
    height: 245,
    borderRadius: 122.5,
    backgroundColor: '#EEF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 175,
    height: 175,
    borderRadius: 87.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  carIcon: {
    width: 72,
    height: 64,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: Colors.primaryYellow || '#FFC928',
    letterSpacing: 0.5,
  },
});

