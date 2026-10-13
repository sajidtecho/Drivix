import { Platform, TextStyle } from 'react-native';

const fontBold = Platform.select({ ios: 'System', android: 'Roboto' }) || 'System';
const fontMedium = Platform.select({ ios: 'System', android: 'Roboto' }) || 'System';
const fontRegular = Platform.select({ ios: 'System', android: 'Roboto' }) || 'System';

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: '800' as const,
    lineHeight: 34,
    color: '#171717',
    fontFamily: fontBold,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    color: '#171717',
    fontFamily: fontBold,
  },
  h3: {
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 24,
    color: '#171717',
    fontFamily: fontBold,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 20,
    color: '#666666',
    fontFamily: fontMedium,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: '#171717',
    fontFamily: fontRegular,
  },
  bodyBold: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    color: '#171717',
    fontFamily: fontBold,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    color: '#666666',
    fontFamily: fontRegular,
  },
  button: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#171717',
    letterSpacing: 0.2,
    fontFamily: fontBold,
  },
  fontBold,
  fontMedium,
  fontRegular,
  fontSizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 26,
  },
};

export const typography = Typography;
