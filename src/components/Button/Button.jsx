import React from 'react';
import { motion } from 'framer-motion';
import styles from './Button.module.css';
import Ripple from '../Ripple/Ripple';

// MD3 variant mapping for backward compatibility
const variantMap = {
  // New MD3 names
  filled: 'filled',
  filledTonal: 'filledTonal',
  outlined: 'outlined',
  elevated: 'elevated',
  text: 'text',
  // Legacy names (backward compatibility)
  primary: 'filled',
  secondary: 'filledTonal',
  tertiary: 'filledTonal',
  danger: 'danger',
  ghost: 'text',
};

/**
 * Button Component - MD3 compliant button system
 * @param {string} variant - 'filled' | 'filledTonal' | 'outlined' | 'elevated' | 'text' | 'danger'
 *                           Legacy: 'primary' | 'secondary' | 'tertiary' | 'ghost'
 * @param {string} size - 'small' | 'medium' | 'large'
 * @param {boolean} fullWidth - Button takes full width
 * @param {boolean} disabled - Disabled state
 * @param {boolean} loading - Loading state
 * @param {React.ReactNode} icon - Leading icon
 * @param {React.ReactNode} endIcon - Trailing icon
 * @param {boolean} iconOnly - Icon-only button (no text)
 * @param {boolean} disableRipple - Disable ripple effect
 */
const Button = ({
  children,
  variant = 'filled',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  endIcon,
  iconOnly = false,
  disableRipple = false,
  onClick,
  onKeyDown,
  type = 'button',
  ariaLabel,
  ariaDescribedBy,
  className = '',
  ...props
}) => {
  // Map legacy variant names to MD3 names
  const mappedVariant = variantMap[variant] || variant;

  const handleKeyDown = (e) => {
    if (disabled || loading) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(e);
    }

    onKeyDown?.(e);
  };

  const buttonClasses = [
    styles.button,
    styles[mappedVariant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    loading && styles.loading,
    iconOnly && styles.iconOnly,
    className
  ].filter(Boolean).join(' ');

  // Determine ripple color based on variant
  const getRippleColor = () => {
    switch (mappedVariant) {
      case 'filled':
      case 'danger':
        return 'var(--color-on-primary)';
      case 'filledTonal':
        return 'var(--color-on-secondary-container)';
      case 'outlined':
      case 'text':
      case 'elevated':
        return 'var(--color-primary)';
      default:
        return 'currentColor';
    }
  };

  return (
    <motion.button
      type={type}
      className={buttonClasses}
      onClick={disabled || loading ? undefined : onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || loading}
      aria-label={ariaLabel || (iconOnly ? 'Button' : undefined)}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {/* MD3 Ripple Effect */}
      {!disableRipple && !disabled && !loading && (
        <Ripple color={getRippleColor()} />
      )}

      {loading && (
        <span className={styles.loadingSpinner} aria-hidden="true">
          <svg className={styles.spinner} viewBox="0 0 24 24">
            <circle
              className={styles.spinnerCircle}
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="3"
            />
          </svg>
        </span>
      )}

      {!loading && icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}

      {!iconOnly && children && (
        <span className={styles.label}>
          {children}
        </span>
      )}

      {!loading && endIcon && (
        <span className={styles.endIcon} aria-hidden="true">
          {endIcon}
        </span>
      )}
    </motion.button>
  );
};

export default Button;
