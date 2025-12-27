import React from 'react';
import { motion } from 'framer-motion';
import { motion as motionTokens } from '@/theme/tokens/motion';
import styles from './GridCell.module.css';

/**
 * Enhanced Widget Container
 * Advanced animations and interactions for dashboard widgets
 * Supports different sizes and interaction states
 */
const GridCell = ({
  children,
  isDragging = false,
  isHovered = false,
  size = '1x1',
  className = ''
}) => {
  // Animation variants based on state
  const containerVariants = {
    idle: {
      scale: 1,
      rotateY: 0,
      zIndex: 1,
    },
    hover: {
      scale: 1.02,
      rotateY: 0,
      zIndex: 2,
      transition: motionTokens.expressive.fastSpatial
    },
    dragging: {
      scale: 1.05,
      rotateY: 5,
      zIndex: 10,
      transition: motionTokens.expressive.defaultSpatial
    }
  };

  // Size-based classes
  const sizeClass = styles[`size${size.replace('x', 'x')}`];

  return (
    <motion.div
      className={`${styles.widgetWrapper} ${sizeClass} ${className}`}
      variants={containerVariants}
      initial="idle"
      animate={isDragging ? 'dragging' : isHovered ? 'hover' : 'idle'}
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      drag={isDragging}
      dragElastic={0.1}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      style={{
        willChange: 'transform, opacity',
      }}
    >
      <div className={styles.widgetContent}>
        {children}
      </div>

      {/* Subtle glow effect on hover */}
      <motion.div
        className={styles.glowEffect}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.1 }}
        transition={motionTokens.expressive.fastEffects}
      />
    </motion.div>
  );
};

export default GridCell;