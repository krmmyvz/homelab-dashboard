/**
 * Responsive breakpoint constants
 * Tüm projede tutarlı breakpoint kullanımı için
 */

export const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
  ultrawide: 1920
};

export const GRID_COLUMNS = {
  mobile: 4,
  tablet: 8,
  desktop: 12
};

// Sidebar responsive defaults
export const SIDEBAR_RESPONSIVE = {
  mobile: {
    position: 'top',
    mode: 'fixed',
    defaultHeight: 80
  },
  tablet: {
    position: 'left',
    mode: 'overlay',
    defaultWidth: 280
  },
  desktop: {
    position: 'left',
    mode: 'fixed',
    defaultWidth: 280
  }
};

// Media query helper
export const mediaQuery = {
  mobile: `(max-width: ${BREAKPOINTS.mobile}px)`,
  tablet: `(max-width: ${BREAKPOINTS.tablet}px)`,
  desktop: `(max-width: ${BREAKPOINTS.desktop}px)`,
  wide: `(max-width: ${BREAKPOINTS.wide}px)`,
  minMobile: `(min-width: ${BREAKPOINTS.mobile + 1}px)`,
  minTablet: `(min-width: ${BREAKPOINTS.tablet + 1}px)`,
  minDesktop: `(min-width: ${BREAKPOINTS.desktop + 1}px)`
};

// Helper function to get columns based on width
export const getGridColumns = (width) => {
  if (width < BREAKPOINTS.tablet) return GRID_COLUMNS.mobile;
  if (width < BREAKPOINTS.desktop) return GRID_COLUMNS.tablet;
  return GRID_COLUMNS.desktop;
};
