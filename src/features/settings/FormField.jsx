import React from 'react';
import styles from './Settings.module.css';

/**
 * FormField - Wrapper component for form inputs with label and description
 * Provides consistent styling and accessibility for form elements
 */
const FormField = ({
  label,
  description,
  error,
  required = false,
  children,
  className = "",
  labelClassName = "",
  descriptionClassName = "",
  errorClassName = "",
  id
}) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className={`${styles.formField} ${className}`}>
      {label && (
        <label
          htmlFor={fieldId}
          className={`${styles.formFieldLabel} ${labelClassName}`}
        >
          {label}
          {required && (
            <span aria-label="required" className={styles.requiredIndicator}>
              *
            </span>
          )}
        </label>
      )}

      {children}

      {description && (
        <p
          className={`${styles.formFieldDescription} ${descriptionClassName}`}
          id={`${fieldId}-description`}
        >
          {description}
        </p>
      )}

      {error && (
        <p
          className={`${styles.errorMessage} ${errorClassName}`}
          id={errorId}
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * FormRow - Horizontal layout for form elements
 * Useful for inline controls like checkboxes, switches, or compact inputs
 */
export const FormRow = ({
  children,
  vertical = false,
  className = "",
  ...props
}) => (
  <div
    className={`${vertical ? styles.formRowVertical : styles.formRow} ${className}`}
    {...props}
  >
    {children}
  </div>
);

/**
 * InputGroup - Groups related input elements together
 * Useful for inputs with prefixes, suffixes, or related controls
 */
export const InputGroup = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`${styles.inputGroup} ${className}`} {...props}>
    {children}
  </div>
);

/**
 * SelectWrapper - Wrapper for select elements with consistent styling
 * Adds dropdown arrow and proper accessibility
 */
export const SelectWrapper = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`${styles.selectWrapper} ${className}`} {...props}>
    {children}
  </div>
);

export default FormField;