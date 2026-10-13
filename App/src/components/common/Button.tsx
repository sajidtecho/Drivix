import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Shadows } from '../../theme/shadows';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  ...props
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: Colors.primaryYellow,
          borderColor: Colors.primaryYellow,
          ...Shadows.yellowGlow,
        };
      case 'secondary':
        return {
          backgroundColor: Colors.textPrimary,
          borderColor: Colors.textPrimary,
        };
      case 'outline':
        return {
          backgroundColor: Colors.background,
          borderColor: Colors.border,
          borderWidth: 1.5,
        };
      case 'danger':
        return {
          backgroundColor: Colors.error,
          borderColor: Colors.error,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      default:
        return { backgroundColor: Colors.primaryYellow };
    }
  };

  const getTextColor = (): string => {
    if (variant === 'primary') return Colors.textOnYellow;
    if (variant === 'secondary') return Colors.textInverse;
    if (variant === 'outline') return Colors.textPrimary;
    if (variant === 'danger') return Colors.textInverse;
    if (variant === 'ghost') return Colors.textPrimary;
    return Colors.textPrimary;
  };

  const getSizeStyle = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 38 },
          text: { fontSize: 13, fontWeight: '700' },
        };
      case 'lg':
        return {
          container: { paddingVertical: 16, paddingHorizontal: 24, minHeight: 56 },
          text: { fontSize: 16, fontWeight: '800' },
        };
      case 'md':
      default:
        return {
          container: { paddingVertical: 12, paddingHorizontal: 18, minHeight: 48 },
          text: { fontSize: 15, fontWeight: '700' },
        };
    }
  };

  const sizeStyle = getSizeStyle();
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isDisabled}
      style={[
        styles.baseButton,
        getVariantStyle(),
        sizeStyle.container,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#000000' : '#FFFFFF'}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && <>{icon}</>}
          <Text
            style={[
              styles.baseText,
              { color: getTextColor() },
              sizeStyle.text,
              icon && iconPosition === 'left' ? { marginLeft: 8 } : null,
              icon && iconPosition === 'right' ? { marginRight: 8 } : null,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && <>{icon}</>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  baseText: {
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.55,
  },
});
