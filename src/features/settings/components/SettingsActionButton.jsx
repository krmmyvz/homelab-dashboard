// --- src/features/settings/components/SettingsActionButton.jsx (YENİ DOSYA) ---

import React from 'react';
import { motion } from 'framer-motion';
import styles from '../Settings.module.css';

const SettingsActionButton = ({
  icon,
  title,
  subtitle,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  variant = 'primary'
}) => {
  const IconComponent = icon;

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <motion.button
      className={`${styles.actionButton} ${styles[`actionButton-${variant}`]} ${disabled ? styles.disabled : ''} ${styles.focusVisible}`}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={ariaLabel || title}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {IconComponent && (
        <div className={styles.actionIconWrapper}>
          <IconComponent size={22} aria-hidden="true" />
        </div>
      )}
      <div className={styles.actionTextContent}>
        <span className={styles.actionTitle}>{title}</span>
        {subtitle && <span className={styles.actionSubtitle}>{subtitle}</span>}
      </div>
    </motion.button>
  );
};

export default SettingsActionButton;