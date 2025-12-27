/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { SettingsContext } from '@/contexts/SettingsContext';
import { UIContext } from '@/contexts/UIContext';
import { applyThemeToDocument } from '@/theme/utils';
import { generateM3Palette, applyM3Palette } from '@/theme/palette';
import { defaultTheme } from '@/theme/themes';

export const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
  const { appSettings } = useContext(SettingsContext);
  const { effectiveIsDarkMode } = useContext(UIContext);

  useEffect(() => {
    // Apply all static theme tokens (typography, spacing, shape, motion, breakpoints, zIndex)
    const staticTheme = {
      ...defaultTheme.light,
      elevation: effectiveIsDarkMode ? defaultTheme.dark.elevation : defaultTheme.light.elevation,
    };
    applyThemeToDocument(staticTheme);
  }, [effectiveIsDarkMode]);

  const M3Palettes = useMemo(() => {
    if (appSettings && appSettings.seedColor) {
      return generateM3Palette(appSettings.seedColor);
    }
    return generateM3Palette('#3b82f6');
  }, [appSettings]);

  const themeMode = effectiveIsDarkMode ? 'dark' : 'light';
  const activePalette = M3Palettes[themeMode];

  useEffect(() => {
    if (activePalette) {
      applyM3Palette(activePalette, document.body, effectiveIsDarkMode);

      // Apply custom status colors
      if (M3Palettes.custom) {
        M3Palettes.custom.forEach(custom => {
          const color = effectiveIsDarkMode ? custom.dark : custom.light;
          const hex = '#' + ('000000' + (color.color & 0xFFFFFF).toString(16)).slice(-6);
          const r = (color.color >> 16) & 255;
          const g = (color.color >> 8) & 255;
          const b = color.color & 255;

          document.body.style.setProperty(`--status-${custom.color.name}`, hex);
          document.body.style.setProperty(`--status-${custom.color.name}-rgb`, `${r}, ${g}, ${b}`);
        });
      }
    }
  }, [activePalette, M3Palettes.custom, effectiveIsDarkMode]);

  return (
    <ThemeContext.Provider value={activePalette}>
      {children}
    </ThemeContext.Provider>
  );
};