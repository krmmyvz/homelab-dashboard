import React from 'react';
import { motion } from 'framer-motion';
import { motionTokens } from '@/theme/tokens/motion';
import styles from './SidebarButton.module.css';

/**
 * Reusable Sidebar Button Component
 * Provides consistent styling, accessibility, and interaction patterns
 * for all sidebar buttons across the application.
 */
const SidebarButton = ({
  children,
  onClick,
  onKeyDown,
  isActive = false,
  isLoading = false,
  hasError = false,
  disabled = false,
  variant = 'default', // 'default', 'category', 'group', 'action'
  size = 'medium', // 'small', 'medium', 'large'
  ariaLabel,
  ariaExpanded,
  ariaHaspopup,
  className = '',
  ...props
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onClick && !disabled && !isLoading) {
        onClick(e);
      }
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const buttonClasses = [
    styles.sidebarButton,
    styles[variant],
    styles[size],
    isActive && styles.active,
    isLoading && styles.loading,
    hasError && styles.error,
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      className={buttonClasses}
      onClick={disabled || isLoading ? undefined : onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || isLoading}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHaspopup}
      whileTap={disabled || isLoading ? {} : { scale: 0.98 }}
      transition={motionTokens.springs.fastEffects}
      {...props}
    >
      <div className={styles.buttonContent}>
        {children}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className={styles.loadingIndicator} aria-hidden="true">
          <div className={styles.spinner} />
        </div>
      )}
    </motion.button>
  );
};

export default React.memo(SidebarButton);