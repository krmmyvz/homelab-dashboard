// --- src/features/settings/components/LoadingSpinner.jsx ---
import React from 'react';
import styles from '../Settings.module.css';

const LoadingSpinner = ({
  size = 'medium',
  className = '',
  ariaLabel = 'Yükleniyor...'
}) => {
  return (
    <div
      className={`${styles.loadingSpinner} ${styles[`loadingSpinner-${size}`]} ${className}`}
      role="status"
      aria-label={ariaLabel}
    >
      <div className={styles.spinnerRing}></div>
      <span className={styles.srOnly}>{ariaLabel}</span>
    </div>
  );
};

export default React.memo(LoadingSpinner);