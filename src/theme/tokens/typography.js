// --- src/theme/tokens/typography.js (GÜNCELLENDİ) ---

const baseFont = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// clamp(MIN, IDEAL, MAX) -> min boyuttan max boyuta akıcı geçiş sağlar
const fluidSize = (min, max) => `clamp(${min}rem, ${min}rem + ${max - min}vw, ${max}rem)`;

export const typography = {
  displayLarge: { fontFamily: baseFont, fontSize: fluidSize(2.5, 3.56), fontWeight: 400, lineHeight: 1.2 },
  displayMedium: { fontFamily: baseFont, fontSize: fluidSize(2, 2.81), fontWeight: 500, lineHeight: 1.2 },
  displaySmall: { fontFamily: baseFont, fontSize: fluidSize(1.75, 2.25), fontWeight: 500, lineHeight: 1.2 },

  headlineLarge: { fontFamily: baseFont, fontSize: fluidSize(1.5, 2), fontWeight: 600, lineHeight: 1.25 },
  headlineMedium: { fontFamily: baseFont, fontSize: fluidSize(1.25, 1.75), fontWeight: 600, lineHeight: 1.25 },
  headlineSmall: { fontFamily: baseFont, fontSize: fluidSize(1.125, 1.5), fontWeight: 600, lineHeight: 1.25 },

  titleLarge: { fontFamily: baseFont, fontSize: fluidSize(1.1, 1.375), fontWeight: 600, lineHeight: 1.3 },
  titleMedium: { fontFamily: baseFont, fontSize: '1rem', fontWeight: 600, lineHeight: 1.5, letterSpacing: '0.15px' },
  titleSmall: { fontFamily: baseFont, fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4, letterSpacing: '0.1px' },

  bodyLarge: { fontFamily: baseFont, fontSize: '1rem', fontWeight: 400, lineHeight: 1.5, letterSpacing: '0.5px' },
  bodyMedium: { fontFamily: baseFont, fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.4, letterSpacing: '0.25px' },
  bodySmall: { fontFamily: baseFont, fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.3, letterSpacing: '0.4px' },

  labelLarge: { fontFamily: baseFont, fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.4, letterSpacing: '0.1px' },
  labelMedium: { fontFamily: baseFont, fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.3, letterSpacing: '0.5px' },
  labelSmall: { fontFamily: baseFont, fontSize: '0.6875rem', fontWeight: 500, lineHeight: 1.3, letterSpacing: '0.5px' },
};