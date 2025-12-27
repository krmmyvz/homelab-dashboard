// --- src/theme/palette.js (GÜNCELLENDİ) ---
// Bu dosya, @material/material-color-utilities kullanarak
// tek bir kaynak renkten (seed color) tam bir M3 renk paleti üretir.

import {
  argbFromHex,
  themeFromSourceColor,
} from '@material/material-color-utilities';

/**
 * Verilen bir hex renginden tam bir Material 3 tema paleti (açık ve koyu mod için) üretir.
 * @param {string} sourceHex - #RRGGBB formatında kaynak renk.
 * @returns {{light: object, dark: object}} - Açık ve koyu tema için renk şemalarını içeren obje.
 */
export const generateM3Palette = (sourceHex) => {
  // Kaynak rengi kütüphanenin anlayacağı ARGB formatına çevir.
  const sourceArgb = argbFromHex(sourceHex);

  // Kaynak renkten temayı üret.
  // DÜZELTME: M3 Expressive için renk paletini daha canlı (vibrant) hale getir
  const theme = themeFromSourceColor(sourceArgb, [
    {
      name: "online",
      value: argbFromHex("#00E676"),
      blend: true,
    },
    {
      name: "offline",
      value: argbFromHex("#FF5252"),
      blend: true,
    },
    {
      name: "pending",
      value: argbFromHex("#FFAB40"),
      blend: true,
    }
  ]);

  // Kütüphanenin ürettiği renkleri daha kullanışlı bir formata dönüştürelim.
  const formatPalette = (scheme) => {
    const palette = {};
    for (const [key, value] of Object.entries(scheme.toJSON())) {
      const formattedKey = key.replace(/-(\w)/g, ([, c]) => c.toUpperCase());
      palette[formattedKey] = value;
    }
    return palette;
  };

  return {
    light: formatPalette(theme.schemes.light),
    dark: formatPalette(theme.schemes.dark),
    // Özel renkleri de dön: online, offline, pending
    custom: theme.customColors
  };
};
// camelCase'i kebab-case'e çeviren yardımcı fonksiyon
const camelToKebab = (str) => str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/**
 * Üretilen renk paletini doğrudan CSS değişkenleri olarak bir elemente uygular.
 * @param {object} palette - `generateM3Palette` tarafından üretilen renk objesi (örn., theme.light).
 * @param {HTMLElement} element - Genellikle document.body.
 */
export const applyM3Palette = (palette, element, isDark) => {
  if (!palette || !element) return;

  // Ana paleti uygula
  for (const [key, value] of Object.entries(palette)) {
    if (typeof value === 'object') continue; // Skip complex objects if any

    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;

    const hex = '#' + ('000000' + (value & 0xFFFFFF).toString(16)).slice(-6);
    const kebabKey = camelToKebab(key);

    element.style.setProperty(`--color-${kebabKey}`, hex);
    element.style.setProperty(`--color-${kebabKey}-rgb`, `${r}, ${g}, ${b}`);

    element.style.setProperty(`--color-${key}`, hex);
    element.style.setProperty(`--color-${key}-rgb`, `${r}, ${g}, ${b}`);
  }
};