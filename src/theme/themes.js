import { typography } from './tokens/typography';
import { spacing } from './tokens/spacing';
import { shape } from './tokens/shape';
import { elevation } from './tokens/elevation';
import { motionTokens } from './tokens/motion';
import { breakpoints } from './tokens/breakpoints';
import { zIndex } from './tokens/zIndex'; // YENİ: Z-index hierarchy

// Renkler kaldırıldı, sadece statik (her temada aynı olan) değerler kaldı.
const staticTheme = {
  typography,
  spacing,
  shape,
  motion: motionTokens,
  breakpoints,
  zIndex, // YENİ: Z-index'leri tema objesine ekle
};

export const defaultTheme = {
  light: {
    ...staticTheme,
    elevation: elevation.light,
  },
  dark: {
    ...staticTheme,
    elevation: elevation.dark,
  },
};