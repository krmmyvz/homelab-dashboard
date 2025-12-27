// --- src/theme/tokens/colors.js ---

// Material 3'e dayalı temel renk paletleri
const palette = {
  blue: {
    primary: '#3b82f6',
    secondary: '#6366f1',
    tertiary: '#8b5cf6',
  },
  green: {
    primary: '#22c55e',
    secondary: '#10b981',
    tertiary: '#14b8a6',
  },
  orange: {
    primary: '#f97316',
    secondary: '#ef4444',
    tertiary: '#f59e0b',
  },
};

// Açık tema için renk şeması
export const lightColors = {
  primary: palette.blue.primary,
  onPrimary: '#ffffff',
  primaryContainer: '#dbeafe',
  onPrimaryContainer: '#1e40af',

  secondary: palette.blue.secondary,
  onSecondary: '#ffffff',
  secondaryContainer: '#e0e7ff',
  onSecondaryContainer: '#312e81',

  tertiary: palette.blue.tertiary,
  onTertiary: '#ffffff',
  tertiaryContainer: '#ede9fe',
  onTertiaryContainer: '#5b21b6',

  background: '#f8fafc',
  onBackground: '#1e293b',

  surface: '#fcfcfc',
  onSurface: '#1e293b',
  surfaceVariant: '#e0e7ff',
  onSurfaceVariant: '#475569',

  // M3 Expressive Surface Containers (Light)
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f6faff', // Slight tint
  surfaceContainer: '#f0f7ff',
  surfaceContainerHigh: '#e8f3ff',
  surfaceContainerHighest: '#e0efff',

  outline: '#cbd5e1',
  outlineVariant: '#e2e8f0',

  error: '#dc2626',
  onError: '#ffffff',
  errorContainer: '#fee2e2',
  onErrorContainer: '#7f1d1d',

  success: '#10b981',
  successDark: '#059669',

  warning: '#f59e0b',
  warningDark: '#d97706',

  // MD3 Scrim & Overlay tokens
  scrim: 'rgba(0, 0, 0, 0.5)',
  scrimLight: 'rgba(0, 0, 0, 0.3)',
  scrimDark: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(255, 255, 255, 0.1)',
  overlayMedium: 'rgba(255, 255, 255, 0.2)',
  overlayDark: 'rgba(0, 0, 0, 0.1)',

  // State layers
  stateLayerPrimary: 'rgba(103, 80, 164, 0.12)',
  stateLayerPrimaryLight: 'rgba(103, 80, 164, 0.15)',
  stateLayerPrimaryMedium: 'rgba(103, 80, 164, 0.2)',
  stateLayerPrimaryDim: 'rgba(103, 80, 164, 0.05)',

  // Skeleton & Loading
  skeletonPulseLight: 'rgba(255, 255, 255, 0.08)',
  skeletonPulse: 'rgba(255, 255, 255, 0.15)',

  // Shadows
  tooltipBg: 'rgba(0, 0, 0, 0.85)',
  shadowLight: 'rgba(0, 0, 0, 0.15)',
  shadowMedium: 'rgba(0, 0, 0, 0.2)',
  shadowStrong: 'rgba(0, 0, 0, 0.35)',

  // Status backgrounds
  successGlow: 'rgba(0, 230, 118, 0.4)',
  errorBgLight: 'rgba(239, 68, 68, 0.2)',
  errorBg: 'rgba(239, 68, 68, 0.35)',
  warningBgLight: 'rgba(251, 191, 36, 0.2)',
  warningBg: 'rgba(251, 191, 36, 0.35)',
};

// Koyu tema için renk şeması
export const darkColors = {
  primary: '#60a5fa',
  onPrimary: '#07337a',
  primaryContainer: '#0c4a6e',
  onPrimaryContainer: '#dbeafe',

  secondary: '#a5b4fc',
  onSecondary: '#222178',
  secondaryContainer: '#3730a3',
  onSecondaryContainer: '#e0e7ff',

  tertiary: '#c4b5fd',
  onTertiary: '#4c1d95',
  tertiaryContainer: '#6d28d9',
  onTertiaryContainer: '#ede9fe',

  background: '#0b1120',
  onBackground: '#e2e8f0',

  surface: '#0f172a', /* Darker base */
  onSurface: '#e2e8f0',
  surfaceVariant: '#334155',
  onSurfaceVariant: '#94a3b8',

  // M3 Expressive Surface Containers (Dark)
  surfaceContainerLowest: '#020617',
  surfaceContainerLow: '#0f172a',
  surfaceContainer: '#1e293b',
  surfaceContainerHigh: '#334155',
  surfaceContainerHighest: '#475569',

  outline: '#475569',
  outlineVariant: '#334155',

  error: '#f87171',
  onError: '#450a0a',
  errorContainer: '#7f1d1d',
  onErrorContainer: '#fee2e2',

  success: '#34d399',
  successDark: '#10b981',

  warning: '#fbbf24',
  warningDark: '#f59e0b',

  // MD3 Scrim & Overlay tokens
  scrim: 'rgba(0, 0, 0, 0.5)',
  scrimLight: 'rgba(0, 0, 0, 0.3)',
  scrimDark: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(255, 255, 255, 0.1)',
  overlayMedium: 'rgba(255, 255, 255, 0.2)',
  overlayDark: 'rgba(0, 0, 0, 0.1)',

  // State layers
  stateLayerPrimary: 'rgba(103, 80, 164, 0.12)',
  stateLayerPrimaryLight: 'rgba(103, 80, 164, 0.15)',
  stateLayerPrimaryMedium: 'rgba(103, 80, 164, 0.2)',
  stateLayerPrimaryDim: 'rgba(103, 80, 164, 0.05)',

  // Skeleton & Loading
  skeletonPulseLight: 'rgba(255, 255, 255, 0.08)',
  skeletonPulse: 'rgba(255, 255, 255, 0.15)',

  // Shadows
  tooltipBg: 'rgba(0, 0, 0, 0.85)',
  shadowLight: 'rgba(0, 0, 0, 0.15)',
  shadowMedium: 'rgba(0, 0, 0, 0.2)',
  shadowStrong: 'rgba(0, 0, 0, 0.35)',

  // Status backgrounds
  successGlow: 'rgba(0, 230, 118, 0.4)',
  errorBgLight: 'rgba(239, 68, 68, 0.2)',
  errorBg: 'rgba(239, 68, 68, 0.35)',
  warningBgLight: 'rgba(251, 191, 36, 0.2)',
  warningBg: 'rgba(251, 191, 36, 0.35)',
};
