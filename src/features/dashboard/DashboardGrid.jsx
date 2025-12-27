import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { SettingsContext } from '@/contexts/SettingsContext';
import { motion as motionTokens } from '@/theme/tokens/motion';
import styles from './DashboardGrid.module.css';

/**
 * Advanced Widget Grid System
 * Material Design 3 responsive grid with auto-placement
 * Supports different widget sizes and density settings
 */
const DashboardGrid = ({ children, className = '' }) => {
  const { appSettings } = useContext(SettingsContext);

  // Grid density based on settings
  const gridDensity = appSettings?.gridDensity || 'medium';
  const customColumns = appSettings?.gridColumns;
  const cardSize = appSettings?.cardSize || 'medium';
  
  // Eğer custom columns varsa onu kullan, yoksa density'den
  const gridClass = customColumns 
    ? styles.gridCustom 
    : styles[`grid${gridDensity.charAt(0).toUpperCase() + gridDensity.slice(1)}`];

  // Custom inline style for column count and card size
  const customStyle = customColumns ? {
    gridTemplateColumns: `repeat(${customColumns}, 1fr)`
  } : {};

  return (
    <motion.div
      className={`${styles.widgetGrid} ${gridClass} ${className}`}
      style={customStyle}
      data-card-size={cardSize}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={motionTokens.expressive.defaultEffects}
    >
      {children}
    </motion.div>
  );
};

export default DashboardGrid;