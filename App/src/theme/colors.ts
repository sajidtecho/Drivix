/**
 * Drivix Official Design System Colors
 * 
 * Philosophy: WHITE BACKGROUND + BLACK TYPOGRAPHY + BEAUTIFULLY BALANCED YELLOW ACCENTS
 */
export const Colors = {
  // Core Surfaces
  background: '#FFFFFF',
  cardBackground: '#FFFFFF',
  cardBackgroundSelected: '#FFF9E6',
  cardBackgroundAlt: '#F9FAFB',
  modalBackground: '#FFFFFF',

  // Brand Accents
  primaryYellow: '#FFC928',
  secondaryYellow: '#FFD84D',
  accentYellowLight: '#FFF9E6',
  accentYellowMuted: '#FEF08A',
  accentGlow: 'rgba(255, 201, 40, 0.35)',

  // Typography
  textPrimary: '#171717',
  textSecondary: '#666666',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',
  textOnYellow: '#171717',

  // Borders & Dividers
  border: '#E5E5E5',
  borderStrong: '#E5E7EB',
  borderYellow: '#FFC928',
  borderGlass: 'rgba(0, 0, 0, 0.08)',

  // Parking Availability Status Colors
  available: '#218838', // Green: Available
  occupied: '#D93025',  // Red: Occupied
  reserved: '#FFC928',  // Yellow: Reserved / Pending
  disabled: '#999999',  // Gray: Unavailable / Out of order

  // Semantic Feedback
  success: '#218838',
  successLight: 'rgba(33, 136, 56, 0.1)',
  error: '#D93025',
  errorLight: 'rgba(217, 48, 37, 0.08)',
  warning: '#E9A800',
  warningLight: 'rgba(233, 168, 0, 0.12)',
  info: '#1E40AF',
  infoLight: 'rgba(30, 64, 175, 0.08)',

  // Surges & Highlights
  surgeBadge: '#D93025',
  discountBadge: '#218838',
  highlight: '#FFC928'
} as const;

export type ColorKey = keyof typeof Colors;
export const colors = Colors;
