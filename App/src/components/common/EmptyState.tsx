import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionTitle?: string;
  actionText?: string;
  buttonTitle?: string;
  onAction?: () => void;
  onActionPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  actionText,
  buttonTitle,
  onAction,
  onActionPress,
}) => {
  const finalActionTitle = actionTitle || actionText || buttonTitle;
  const finalOnAction = onAction || onActionPress;

  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {finalActionTitle && finalOnAction && (
        <Button
          title={finalActionTitle}
          onPress={finalOnAction}
          variant="primary"
          style={styles.actionButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  iconWrapper: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 50,
    backgroundColor: '#FFF9E6',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
    maxWidth: 280,
  },
  actionButton: {
    minWidth: 160,
  },
});
