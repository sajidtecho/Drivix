import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Search, Receipt, User } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useBooking } from '../store/BookingContext';

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
import { CarWashDiscoveryScreen } from '../screens/wash/CarWashDiscoveryScreen';

// Types
import { ParkingLocation, Booking } from '../types';

export type RootStackParamList = {
  MainTabs: undefined;
  ParkingDetail: { facility: ParkingLocation };
  CarWashDiscovery: undefined;
  FloorSelection: undefined;
  DurationSelection: undefined;
  VehicleSelection: undefined;
  BookingReview: undefined;
  BookingConfirmation: { booking: Booking };
  Navigation: { booking: Booking };
  ActiveParking: { bookingId: string; booking?: Booking };
  Login: undefined;
  Register: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  'Find Parking': undefined;
  'My Bookings': undefined;
  Profile: undefined;
};

// ─── Screen Adapters for Native Stack Navigation ─────────────────────────────

const HomeScreenAdapter = ({ navigation }: any) => {
  const { selectHub } = useBooking();
  return (
    <HomeScreen
      onNavigateToDiscovery={() => navigation.navigate('Find Parking')}
      onNavigateToCarWash={() => navigation.navigate('CarWashDiscovery')}
      onSelectHub={(hub) => {
        selectHub(hub);
        navigation.navigate('ParkingDetail', { facility: hub });
      }}
      onNavigateToBookingDetail={(bOrId: any) => {
        const booking = typeof bOrId === 'object' && bOrId !== null ? bOrId : undefined;
        const bookingId = typeof bOrId === 'string' ? bOrId : (bOrId?._id || bOrId?.id);
        navigation.navigate('ActiveParking', { booking, bookingId });
      }}
      onNavigateToActiveParking={(bOrId: any) => {
        const booking = typeof bOrId === 'object' && bOrId !== null ? bOrId : undefined;
        const bookingId = typeof bOrId === 'string' ? bOrId : (bOrId?._id || bOrId?.id);
        navigation.navigate('ActiveParking', { booking, bookingId });
      }}
      onNavigateToProfile={() => navigation.navigate('Profile')}
    />
  );
};

const ParkingDiscoveryScreenAdapter = ({ navigation }: any) => {
  const { selectHub } = useBooking();
  return (
    <ParkingDiscoveryScreen
      onSelectHub={(hub) => {
        selectHub(hub);
        navigation.navigate('ParkingDetail', { facility: hub });
      }}
    />
  );
};

const ParkingDetailScreenAdapter = ({ navigation, route }: any) => {
  const { selectedHub } = useBooking();
  const hub = route?.params?.facility || selectedHub;
  return (
    <ParkingDetailScreen
      hub={hub}
      onBack={() => navigation.goBack()}
      onProceedToFloorSelection={() => navigation.navigate('FloorSelection')}
    />
  );
};

const FloorSelectionScreenAdapter = ({ navigation }: any) => {
  return (
    <FloorSelectionScreen
      onBack={() => navigation.goBack()}
      onProceed={() => navigation.navigate('DurationSelection')}
    />
  );
};

const DurationSelectionScreenAdapter = ({ navigation }: any) => {
  return (
    <DurationSelectionScreen
      onBack={() => navigation.goBack()}
      onProceed={() => navigation.navigate('VehicleSelection')}
    />
  );
};

const VehicleSelectionScreenAdapter = ({ navigation }: any) => {
  return (
    <VehicleSelectionScreen
      onBack={() => navigation.goBack()}
      onProceed={() => navigation.navigate('BookingReview')}
    />
  );
};

const BookingReviewScreenAdapter = ({ navigation }: any) => {
  return (
    <BookingReviewScreen
      onBack={() => navigation.goBack()}
      onBookingSuccess={(booking) => navigation.navigate('BookingConfirmation', { booking })}
      onRequireAuth={() => navigation.navigate('Login')}
    />
  );
};

const BookingConfirmationScreenAdapter = ({ navigation, route }: any) => {
  const booking = route?.params?.booking;
  return (
    <BookingConfirmationScreen
      booking={booking}
      onNavigateToHub={() => navigation.navigate('Navigation', { booking })}
      onGoHome={() => navigation.navigate('MainTabs')}
      onViewMyBookings={() => navigation.navigate('My Bookings')}
    />
  );
};

const NavigationScreenAdapter = ({ navigation, route }: any) => {
  const booking = route?.params?.booking;
  return (
    <NavigationScreen
      booking={booking}
      onBack={() => navigation.goBack()}
      onProceedToActiveParking={(b) => navigation.navigate('ActiveParking', { bookingId: b._id, booking: b })}
    />
  );
};

const ActiveParkingScreenAdapter = ({ navigation, route }: any) => {
  const params = route?.params || {};
  let booking = params.booking;
  let bookingId = params.bookingId;

  // If bookingId was passed as an object
  if (typeof bookingId === 'object' && bookingId !== null) {
    if (!booking) booking = bookingId;
    bookingId = bookingId._id || bookingId.id;
  }

  // If booking is an object but bookingId is missing
  if (!bookingId && booking) {
    bookingId = booking._id || booking.id;
  }

  const cleanId = typeof bookingId === 'string' ? bookingId : undefined;

  return (
    <ActiveParkingScreen
      booking={booking}
      bookingId={cleanId}
      onBack={() => navigation.goBack()}
      onCheckoutSuccess={() => navigation.navigate('MainTabs')}
    />
  );
};

const LoginScreenAdapter = ({ navigation }: any) => {
  return (
    <LoginScreen
      onSuccess={() => navigation.navigate('MainTabs')}
      onNavigateToRegister={() => navigation.navigate('Register')}
      onCancel={() => navigation.goBack()}
    />
  );
};

const RegisterScreenAdapter = ({ navigation }: any) => {
  return (
    <RegisterScreen
      onSuccess={() => navigation.navigate('MainTabs')}
      onNavigateToLogin={() => navigation.navigate('Login')}
    />
  );
};

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.textPrimary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreenAdapter}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIconWrap, focused && styles.activeTabIconWrap]}>
              <Home size={18} color={focused ? Colors.textPrimary : color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Find Parking"
        component={ParkingDiscoveryScreenAdapter}
        options={{
          tabBarLabel: 'Find Parking',
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIconWrap, focused && styles.activeTabIconWrap]}>
              <Search size={18} color={focused ? Colors.textPrimary : color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="My Bookings"
        component={BookingHistoryScreen}
        options={{
          tabBarLabel: 'My Bookings',
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIconWrap, focused && styles.activeTabIconWrap]}>
              <Receipt size={18} color={focused ? Colors.textPrimary : color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIconWrap, focused && styles.activeTabIconWrap]}>
              <User size={18} color={focused ? Colors.textPrimary : color} />
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
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />

      {/* Parking Discovery & Booking Flow */}
      <Stack.Screen name="ParkingDetail" component={ParkingDetailScreenAdapter} />
      <Stack.Screen name="CarWashDiscovery" component={({ navigation }: any) => (
        <CarWashDiscoveryScreen onBack={() => navigation.goBack()} />
      )} />
      <Stack.Screen name="FloorSelection" component={FloorSelectionScreenAdapter} />
      <Stack.Screen name="DurationSelection" component={DurationSelectionScreenAdapter} />
      <Stack.Screen name="VehicleSelection" component={VehicleSelectionScreenAdapter} />
      <Stack.Screen name="BookingReview" component={BookingReviewScreenAdapter} />
      <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreenAdapter} />

      {/* Navigation, Check-in & Active Parking */}
      <Stack.Screen name="Navigation" component={NavigationScreenAdapter} />
      <Stack.Screen name="ActiveParking" component={ActiveParkingScreenAdapter} />

      {/* Auth */}
      <Stack.Screen name="Login" component={LoginScreenAdapter} />
      <Stack.Screen name="Register" component={RegisterScreenAdapter} />
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
    backgroundColor: Colors.background,
    borderTopColor: Colors.border,
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
    fontSize: 11,
    fontWeight: '600',
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
    backgroundColor: Colors.primaryYellow,
  },
});
