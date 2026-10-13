import React, { useEffect } from 'react';
import { DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { socketService } from '@/services/socket';
import { AuthProvider } from '../store/AuthContext';
import { BookingProvider } from '../store/BookingContext';
import { DrivixRootNavigator } from '../navigation/AppNavigator';

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  // Initialize Socket.IO real-time connection on app startup
  useEffect(() => {
    socketService.setupAppStateLifecycle();
    return () => {
      socketService.cleanup();
    };
  }, []);

  return (
    <ThemeProvider value={DefaultTheme}>
      <AnimatedSplashOverlay />
      <DrivixRootNavigator />
    </ThemeProvider>
  );
}

export default function TabLayout() {
  return (
    <AuthProvider>
      <BookingProvider>
        <RootLayoutContent />
      </BookingProvider>
    </AuthProvider>
  );
}
