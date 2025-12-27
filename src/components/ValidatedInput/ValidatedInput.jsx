import React, { useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import styles from './ValidatedInput.module.css';

const ValidatedInput = React.forwardRef(({
  label,
  type = 'text',
  value = '',
  onChange,
  onBlur,
  validator,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  description,
  autoComplete,
  ...props
}, ref) => {
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const validateInput = useCallback(async (inputValue) => {
    if (!validator || (!required && !inputValue)) {
      setError('');
      return true;
    }

    setIsValidating(true);
    
    try {
      const result = typeof validator === 'function' 
        ? await validator(inputValue)
        : validator;
        
      if (result.isValid) {
        setError('');
        return true;
      } else {
        setError(result.message);
        return false;
      }
  } catch { // ignore specific validation error object
      setError('Doğrulama hatası oluştu');
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [validator, required]);

  const handleChange = useCallback((e) => {
    // const newValue = e.target.value; // value accessed through event; variable removed to satisfy lint
    onChange(e);
    
    // Clear error when user starts typing
    if (error && touched) {
      setError('');
    }
  }, [onChange, error, touched]);

  const handleBlur = useCallback(async (e) => {
    setTouched(true);
    await validateInput(e.target.value);
    onBlur?.(e);
  }, [validateInput, onBlur]);

  const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = error && touched;
  const showError = hasError && !isValidating;

  return (
    <div className={`${styles.inputGroup} ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className={styles.label}
        >
          {label}
          {required && <span className={styles.required} aria-label="zorunlu">*</span>}
        </label>
      )}
      
      {description && (
        <p className={styles.description} id={`${inputId}-desc`}>
          {description}
        </p>
      )}
      
      <div className={styles.inputWrapper}>
        <input
          ref={ref}
          id={inputId}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          className={`
            ${styles.input} 
            ${hasError ? styles.error : ''} 
            ${isValidating ? styles.validating : ''}
          `.trim()}
          aria-invalid={hasError}
          aria-describedby={
            [
              description && `${inputId}-desc`,
              showError && `${inputId}-error`
            ].filter(Boolean).join(' ') || undefined
          }
          {...props}
        />
        
        {isValidating && (
          <div className={styles.validatingIcon} aria-hidden="true">
            <div className={styles.spinner}></div>
          </div>
        )}
        
        {showError && (
          <AlertCircle 
            className={styles.errorIcon} 
            size={16} 
            aria-hidden="true"
          />
        )}
      </div>
      
      {showError && (
        <div 
          className={styles.errorMessage}
          id={`${inputId}-error`}
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
});

ValidatedInput.displayName = 'ValidatedInput';

export default ValidatedInput;
