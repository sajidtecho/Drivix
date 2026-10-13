import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { socketService } from '@/services/socket';
import { AuthProvider } from '../store/AuthContext';
import { BookingProvider } from '../store/BookingContext';

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
    <>
      <AnimatedSplashOverlay />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <BookingProvider>
        <RootLayoutContent />
      </BookingProvider>
    </AuthProvider>
  );
}
