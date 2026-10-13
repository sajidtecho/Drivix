import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

// Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { ParkingDiscoveryScreen } from '../screens/parking/ParkingDiscoveryScreen';
import { ParkingDetailScreen } from '../screens/parking/ParkingDetailScreen';
import { FloorSelectionScreen } from '../screens/booking/FloorSelectionScreen';
import { DurationSelectionScreen } from '../screens/booking/DurationSelectionScreen';
import { VehicleSelectionScreen } from '../screens/booking/VehicleSelectionScreen';
import { BookingReviewScreen } from '../screens/booking/BookingReviewScreen';
import { BookingConfirmationScreen } from '../screens/booking/BookingConfirmationScreen';
import { NavigationScreen } from '../screens/navigation/NavigationScreen';
import { ActiveParkingScreen } from '../screens/profile/ActiveParkingScreen';
import { BookingHistoryScreen } from '../screens/history/BookingHistoryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Types
import { ParkingLocation, Booking } from '../types';

export type RootStackParamList = {
  MainTabs: undefined;
  ParkingDetail: { facility: ParkingLocation };
  FloorSelection: undefined;
  DurationSelection: undefined;
  VehicleSelection: undefined;
  BookingReview: undefined;
  BookingConfirmation: { booking: Booking };
  Navigation: { booking: Booking };
  ActiveParking: { bookingId: string };
  Login: undefined;
  Register: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  'Find Parking': undefined;
  'My Bookings': undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <View style={[styles.tabIconWrap, focused && styles.activeTabIconWrap]}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={20}
                color={focused ? colors.textPrimary : color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Find Parking"
        component={ParkingDiscoveryScreen}
        options={{
          tabBarLabel: 'Find Parking',
          tabBarIcon: ({ focused, color, size }) => (
            <View style={[styles.tabIconWrap, focused && styles.activeTabIconWrap]}>
              <Ionicons
                name={focused ? 'search' : 'search-outline'}
                size={20}
                color={focused ? colors.textPrimary : color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="My Bookings"
        component={BookingHistoryScreen}
        options={{
          tabBarLabel: 'My Bookings',
          tabBarIcon: ({ focused, color, size }) => (
            <View style={[styles.tabIconWrap, focused && styles.activeTabIconWrap]}>
              <Ionicons
                name={focused ? 'receipt' : 'receipt-outline'}
                size={20}
                color={focused ? colors.textPrimary : color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <View style={[styles.tabIconWrap, focused && styles.activeTabIconWrap]}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={20}
                color={focused ? colors.textPrimary : color}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      
      {/* Parking Discovery & Booking Flow */}
      <Stack.Screen name="ParkingDetail" component={ParkingDetailScreen} />
      <Stack.Screen name="FloorSelection" component={FloorSelectionScreen} />
      <Stack.Screen name="DurationSelection" component={DurationSelectionScreen} />
      <Stack.Screen name="VehicleSelection" component={VehicleSelectionScreen} />
      <Stack.Screen name="BookingReview" component={BookingReviewScreen} />
      <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
      
      {/* Navigation, Check-in & Active Parking */}
      <Stack.Screen name="Navigation" component={NavigationScreen} />
      <Stack.Screen name="ActiveParking" component={ActiveParkingScreen} />
      
      {/* Auth */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

export const DrivixRootNavigator = () => {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabBarLabel: {
    fontFamily: typography.fontMedium,
    fontSize: 11,
    marginTop: 2,
  },
  tabIconWrap: {
    width: 36,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabIconWrap: {
    backgroundColor: colors.primaryYellow,
  },
});
