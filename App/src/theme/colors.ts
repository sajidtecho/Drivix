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

  // Brand Accents - Matching Website Deep Gold (--accent-secondary #FFAE0E & --accent-primary #FFCE00)
  primaryYellow: '#FFAE0E', // Website Deep Gold (Rich dark golden amber)
  secondaryYellow: '#FFCE00', // Website Primary Gold
  accentYellowLight: '#FFF6DF', // Warm golden surface tint
  accentYellowMuted: '#FDE68A',
  accentGlow: 'rgba(255, 174, 14, 0.35)',

  // Typography
  textPrimary: '#171717',
  textSecondary: '#666666',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',
  textOnYellow: '#171717',

  // Borders & Dividers
  border: '#EEEEEE',
  borderStrong: '#E5E7EB',
  borderYellow: '#FFAE0E',
  borderGlass: 'rgba(0, 0, 0, 0.08)',

  // Parking Availability Status Colors
  available: '#218838', // Green: Available
  occupied: '#D93025',  // Red: Occupied
  reserved: '#FFAE0E',  // Deep Gold: Reserved / Pending
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
  highlight: '#FFAE0E'
} as const;

export type ColorKey = keyof typeof Colors;
export const colors = Colors;
