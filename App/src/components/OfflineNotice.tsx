import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { WifiOff } from 'lucide-react-native';

interface OfflineNoticeProps {
  isVisible: boolean;
}

export const OfflineNotice: React.FC<OfflineNoticeProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <WifiOff size={14} color="#ffffff" />
      <Text style={styles.text}>
        Offline Mode — Showing Cached Digital Pass & Emergency Vault
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ff6b35',
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 9999,
  },
  text: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default OfflineNotice;
