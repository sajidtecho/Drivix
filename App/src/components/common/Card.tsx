import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Shadows } from '../../theme/shadows';

export interface CardProps extends ViewProps {
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  selected = false,
  onPress,
  style,
  children,
  ...props
}) => {
  const cardContent = (
    <View
      style={[
        styles.card,
        selected && styles.selectedCard,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  selectedCard: {
    backgroundColor: Colors.cardBackgroundSelected,
    borderColor: Colors.primaryYellow,
    borderWidth: 1.5,
  },
});
