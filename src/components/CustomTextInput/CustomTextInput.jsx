// --- src/components/CustomTextInput/CustomTextInput.jsx ---
// MD3 Compliant Text Field Component

import React, { useState, useCallback, useId } from 'react';
import { motion } from 'framer-motion';
import styles from './CustomTextInput.module.css';
import { motionTokens } from '../../theme/tokens/motion';
import { validateInput, sanitizeInput } from '../../utils/validation';

const labelVariants = {
  inactive: {
    y: 0,
    scale: 1,
    color: 'var(--color-onSurfaceVariant)',
  },
  active: {
    y: -22,
    scale: 0.85,
    color: 'var(--color-primary)',
  },
  error: {
    y: -22,
    scale: 0.85,
    color: 'var(--color-error)',
  }
};

/**
 * MD3 Text Field Component
 * @param {string} variant - 'filled' | 'outlined' (default: 'filled')
 * @param {ReactNode} leadingIcon - Icon at the start of the input
 * @param {ReactNode} trailingIcon - Icon at the end of the input
 * @param {string} prefix - Prefix text (e.g., "$")
 * @param {string} suffix - Suffix text (e.g., "kg")
 * @param {boolean} showCounter - Show character counter
 */
const CustomTextInput = ({
  value,
  onChange,
  placeholder,
  name,
  type = 'text',
  variant = 'filled',
  required = false,
  disabled = false,
  error,
  helperText,
  maxLength,
  minLength,
  pattern,
  autoComplete = 'off',
  leadingIcon,
  trailingIcon,
  prefix,
  suffix,
  showCounter = false,
  'aria-describedby': ariaDescribedBy,
  onValidation,
  validateOnChange = false,
  sanitize = true,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalError, setInternalError] = useState('');
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const counterId = `${inputId}-counter`;

  const isFilled = value && value.length > 0;
  const isActive = isFocused || isFilled;
  const displayError = error || internalError;
  const currentLength = value?.length || 0;

  const handleChange = useCallback((event) => {
    let newValue = event.target.value;

    // Sanitize input if enabled
    if (sanitize && type === 'text') {
      newValue = sanitizeInput(newValue);
    }

    // Validate input if enabled
    if (validateOnChange && onValidation) {
      const validationResult = validateInput(newValue, {
        required,
        minLength,
        maxLength,
        pattern,
        type
      });

      if (!validationResult.isValid) {
        setInternalError(validationResult.error);
      } else {
        setInternalError('');
      }

      onValidation(validationResult);
    }

    onChange({ ...event, target: { ...event.target, value: newValue } });
  }, [onChange, sanitize, type, validateOnChange, onValidation, required, minLength, maxLength, pattern]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);

    // Validate on blur if validation is enabled
    if (onValidation) {
      const validationResult = validateInput(value, {
        required,
        minLength,
        maxLength,
        pattern,
        type
      });

      if (!validationResult.isValid) {
        setInternalError(validationResult.error);
      } else {
        setInternalError('');
      }

      onValidation(validationResult);
    }
  }, [value, onValidation, required, minLength, maxLength, pattern, type]);

  const describedBy = [
    displayError && errorId,
    helperText && !displayError && helperId,
    showCounter && maxLength && counterId,
    ariaDescribedBy
  ].filter(Boolean).join(' ') || undefined;

  // Determine label variant
  const getLabelVariant = () => {
    if (displayError && isActive) return 'error';
    if (isActive) return 'active';
    return 'inactive';
  };

  const containerClasses = [
    styles.inputContainer,
    styles[variant],
    displayError && styles.error,
    disabled && styles.disabled,
    isFocused && styles.focused,
    leadingIcon && styles.hasLeadingIcon,
    trailingIcon && styles.hasTrailingIcon,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {/* Leading Icon */}
      {leadingIcon && (
        <span className={styles.leadingIcon} aria-hidden="true">
          {leadingIcon}
        </span>
      )}

      {/* Prefix */}
      {prefix && isActive && (
        <span className={styles.prefix} aria-hidden="true">
          {prefix}
        </span>
      )}

      <motion.label
        htmlFor={inputId}
        className={styles.label}
        variants={labelVariants}
        animate={getLabelVariant()}
        transition={motionTokens.springs.defaultSpatial}
      >
        {placeholder}
        {required && <span className={styles.required} aria-label="required">*</span>}
      </motion.label>

      <input
        id={inputId}
        name={name}
        type={type}
        className={`${styles.input} ${displayError ? styles.inputError : ''}`}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        autoComplete={autoComplete}
        aria-describedby={describedBy}
        aria-invalid={displayError ? 'true' : 'false'}
        aria-required={required}
        {...props}
      />

      {/* Suffix */}
      {suffix && isActive && (
        <span className={styles.suffix} aria-hidden="true">
          {suffix}
        </span>
      )}

      {/* Trailing Icon */}
      {trailingIcon && (
        <span className={styles.trailingIcon} aria-hidden="true">
          {trailingIcon}
        </span>
      )}

      {/* Supporting Text Row */}
      <div className={styles.supportingRow}>
        {/* Error Message */}
        {displayError && (
          <div
            id={errorId}
            className={styles.errorMessage}
            role="alert"
            aria-live="polite"
          >
            {displayError}
          </div>
        )}

        {/* Helper Text */}
        {helperText && !displayError && (
          <div
            id={helperId}
            className={styles.helperText}
          >
            {helperText}
          </div>
        )}

        {/* Character Counter */}
        {showCounter && maxLength && (
          <div
            id={counterId}
            className={`${styles.counter} ${currentLength >= maxLength ? styles.counterMax : ''}`}
            aria-live="polite"
          >
            {currentLength}/{maxLength}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomTextInput;