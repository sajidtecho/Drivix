import { Platform, TextStyle } from 'react-native';

export const Typography: Record<string, TextStyle> = {
  h1: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    color: '#171717',
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: '#171717',
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
  },
  h3: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: '#171717',
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    color: '#666666',
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#171717',
  },
  bodyBold: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: '#171717',
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    color: '#666666',
  },
  button: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
    letterSpacing: 0.2,
  },
  fontBold: Platform.select({ ios: 'System', android: 'Roboto' }),
  fontMedium: Platform.select({ ios: 'System', android: 'Roboto' }),
  fontRegular: Platform.select({ ios: 'System', android: 'Roboto' }),
  fontSizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 26,
  },
};

export const typography = Typography as any;
