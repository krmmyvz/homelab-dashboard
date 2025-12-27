// --- src/components/AnimatedMenuIcon/AnimatedMenuIcon.jsx (YENİ VE M3 EXPRESSIVE HALİ) ---

import React from 'react';
import { motion } from 'framer-motion';
import { motionTokens } from '../../theme/tokens/motion';

const Path = (props) => (
  <motion.path
    fill="transparent"
    strokeWidth="2.5"
    stroke="currentColor"
    strokeLinecap="round"
    {...props}
  />
);

const AnimatedMenuIcon = ({ isOpen, size = 24 }) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      animate={isOpen ? 'open' : 'closed'}
      initial={false}
    >
      {/* Üst Çizgi -> Okun Üst Kısmı */}
      <Path
        variants={{
          closed: { d: 'M 3 6 L 21 6' },
          open: { d: 'M 6 18 L 18 6' },
        }}
        transition={motionTokens.springs.defaultSpatial}
      />
      
      {/* Orta Çizgi (Kaybolur) */}
      <Path
        d="M 3 12 L 21 12"
        variants={{
          closed: { opacity: 1 },
          open: { opacity: 0 },
        }}
        transition={{ duration: 0.1 }}
      />
      
      {/* Alt Çizgi -> Okun Alt Kısmı */}
      <Path
        variants={{
          closed: { d: 'M 3 18 L 21 18' },
          open: { d: 'M 6 6 L 18 18' },
        }}
        transition={motionTokens.springs.defaultSpatial}
      />
    </motion.svg>
  );
};

// YENİDEN DÜZENLEME: Hamburger-X animasyonu, daha yumuşak bir geçiş için güncellendi.
// Bu, çizgilerin birbirine dönüşürken daha organik hareket etmesini sağlar.
const StylishAnimatedMenuIcon = ({ isOpen, size = 24 }) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      animate={isOpen ? 'open' : 'closed'}
      initial={false}
    >
      <Path
        variants={{
          closed: { d: "M 2 5 L 22 5" },
          open: { d: "M 4 19 L 20 5" }
        }}
        transition={motionTokens.springs.defaultSpatial}
      />
      <Path
        d="M 2 12 L 22 12"
        variants={{
          closed: { opacity: 1 },
          open: { opacity: 0 }
        }}
        transition={{ duration: 0.1 }}
      />
      <Path
        variants={{
          closed: { d: "M 2 19 L 22 19" },
          open: { d: "M 4 5 L 20 19" }
        }}
        transition={motionTokens.springs.defaultSpatial}
      />
    </motion.svg>
  )
}

// Tercih edilen ve en modern animasyon budur.
export default StylishAnimatedMenuIcon;