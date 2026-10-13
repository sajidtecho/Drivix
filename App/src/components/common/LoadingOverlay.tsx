import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';

export interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={Colors.primaryYellow} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  card: {
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  message: {
    marginTop: Spacing.md,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
