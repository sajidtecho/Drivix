/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0b0c10',
    background: '#ffffff',
    backgroundElement: '#f5f5f7',
    backgroundSelected: '#e5e5ea',
    textSecondary: '#60646c',
    primary: '#ffce00',
    secondary: '#00f2ff',
    tertiary: '#7000ff',
    success: '#00cc6a',
    error: '#ff4b4b',
    borderGlass: 'rgba(0, 0, 0, 0.08)',
  },
  dark: {
    text: '#ffffff',
    background: '#0b0c10',
    backgroundElement: 'rgba(21, 22, 30, 0.75)',
    backgroundSelected: 'rgba(255, 255, 255, 0.05)',
    textSecondary: '#a0aab2',
    primary: '#ffce00', // Neon Gold
    secondary: '#00f2ff', // Cyber Cyan
    tertiary: '#7000ff', // Plasma Purple
    success: '#00cc6a',
    error: '#ff4b4b',
    borderGlass: 'rgba(255, 255, 255, 0.08)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
