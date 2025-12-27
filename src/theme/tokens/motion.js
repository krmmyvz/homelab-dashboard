// --- src/theme/tokens/motion.js (YUMUŞATILMIŞ VE OPTİMİZE EDİLMİŞ HALİ) ---

/**
 * Material 3 Expressive hareket yayı token'larının Framer Motion'a uyarlanmış hali.
 * DEĞİŞİKLİK: Değerler, web tarayıcılarında daha akıcı ve daha az "titreşimli"
 * bir his vermek için yeniden dengelendi. Sertlik (stiffness) bir miktar düşürüldü
 * ve sönümleme (damping) buna göre ayarlandı.
 */

// 'Expressive' Şeması: Karakterli ve dışavurumcu anlar için.
const expressive = {
  // Mekansal (Konum/Boyut) Değişiklikler için Yaylar
  fastSpatial: { type: 'spring', stiffness: 800, damping: 60 },
  defaultSpatial: { type: 'spring', stiffness: 500, damping: 45 },
  slowSpatial: { type: 'spring', stiffness: 300, damping: 35 },

  // Efekt (Opaklık/Renk) Değişiklikleri için Sıçramasız Yaylar
  fastEffects: { type: 'spring', stiffness: 700, damping: 100 },
  defaultEffects: { type: 'spring', stiffness: 400, damping: 100 },
  slowEffects: { type: 'spring', stiffness: 200, damping: 100 },
};

// 'Standard' Şeması: Daha işlevsel ve hızlı geri bildirimler için.
const standard = {
  default: { type: 'spring', stiffness: 500, damping: 40 },
  fast: { type: 'spring', stiffness: 700, damping: 50 },
};

export const motion = {
  expressive,
  standard,
};

// Kolay erişim için kısayollar
export const motionTokens = {
  transition: {
    'duration-short': '100ms',
    'duration-medium': '300ms',
    'duration-long': '400ms',
  },
  easing: {
    'easing-standard': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    'easing-emphasized': 'cubic-bezier(0.4, 0.0, 0.0, 1)',
    'easing-decelerated': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  },
  springs: {
    ...expressive,
    standard,
  }
};