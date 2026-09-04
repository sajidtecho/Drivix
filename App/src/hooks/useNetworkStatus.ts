import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => setNetworkStatus({ isConnected: true, isInternetReachable: true });
      const handleOffline = () => setNetworkStatus({ isConnected: false, isInternetReachable: false });

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      setNetworkStatus({
        isConnected: navigator.onLine,
        isInternetReachable: navigator.onLine,
      });

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // Default mobile fallback assumption (can be enhanced with NetInfo if installed)
    setNetworkStatus({
      isConnected: true,
      isInternetReachable: true,
    });
  }, []);

  return networkStatus;
}
