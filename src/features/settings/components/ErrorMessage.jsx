// --- src/features/settings/components/ErrorMessage.jsx ---
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from '../Settings.module.css';

const ErrorMessage = ({
  message,
  className = '',
  showIcon = true,
  size = 'medium'
}) => {
  if (!message) return null;

  return (
    <div
      className={`${styles.errorMessage} ${styles[`errorMessage-${size}`]} ${className}`}
      role="alert"
      aria-live="polite"
    >
      {showIcon && (
        <AlertTriangle
          size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
          className={styles.errorIcon}
          aria-hidden="true"
        />
      )}
      <span className={styles.errorText}>{message}</span>
    </div>
  );
};

export default React.memo(ErrorMessage);