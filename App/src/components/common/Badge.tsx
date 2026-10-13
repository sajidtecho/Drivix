import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { BorderRadius } from '../../theme/spacing';

export interface BadgeProps {
  label: string;
  variant?: 'available' | 'occupied' | 'reserved' | 'surge' | 'discount' | 'neutral';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
  textStyle,
}) => {
  const getBadgeStyle = (): { bg: string; text: string; border?: string } => {
    switch (variant) {
      case 'available':
        return { bg: 'rgba(33, 136, 56, 0.12)', text: Colors.available, border: 'rgba(33, 136, 56, 0.3)' };
      case 'occupied':
        return { bg: 'rgba(217, 48, 37, 0.10)', text: Colors.occupied, border: 'rgba(217, 48, 37, 0.25)' };
      case 'reserved':
        return { bg: 'rgba(233, 168, 0, 0.14)', text: '#B45309', border: 'rgba(233, 168, 0, 0.3)' };
      case 'surge':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' };
      case 'discount':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'neutral':
      default:
        return { bg: '#F3F4F6', text: Colors.textSecondary, border: '#E5E7EB' };
    }
  };

  const styleConfig = getBadgeStyle();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: styleConfig.bg,
          borderColor: styleConfig.border || 'transparent',
        },
        style,
      ]}
    >
      <Text style={[styles.badgeText, { color: styleConfig.text }, textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
