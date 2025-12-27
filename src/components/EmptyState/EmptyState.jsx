// --- src/components/EmptyState/EmptyState.jsx (YENİ DOSYA) ---

import React from 'react';
import { motion } from 'framer-motion';
import styles from './EmptyState.module.css';
import { motionTokens } from '../../theme/tokens/motion';

// Konteyner ve içindeki elemanların animasyonlu bir şekilde görünmesi için varyantlar
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ...motionTokens.springs.defaultEffects,
      staggerChildren: 0.1, // İç elemanların art arda gelmesini sağlar
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

const EmptyState = ({ icon, title, message, actionText, onActionClick }) => {
  const IconComponent = icon;

  return (
    <motion.div
      className={styles.emptyStateContainer}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {IconComponent && (
        <motion.div className={styles.iconWrapper} variants={itemVariants}>
          <IconComponent size={40} strokeWidth={1.5} />
        </motion.div>
      )}
      <motion.h2 className={styles.title} variants={itemVariants}>
        {title}
      </motion.h2>
      <motion.p className={styles.message} variants={itemVariants}>
        {message}
      </motion.p>
      {actionText && onActionClick && (
        <motion.button
          className={styles.actionButton}
          onClick={onActionClick}
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {actionText}
        </motion.button>
      )}
    </motion.div>
  );
};

export default EmptyState;
