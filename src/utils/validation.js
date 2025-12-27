/**
 * Input validation and sanitization utilities
 * Provides comprehensive validation functions for forms and user inputs
 */

/**
 * Sanitizes input by removing potentially dangerous HTML and scripts
 * @param {string} input - The input string to sanitize
 * @returns {string} Sanitized input string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove javascript: protocols
    .replace(/javascript:/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\s*on\w+\s*=\s*'[^']*'/gi, '')
    // Trim whitespace
    .trim();
};

/**
 * Validates if a field is required and has content
 * @param {string} value - The value to validate
 * @returns {boolean} True if valid (has content), false otherwise
 */
export const validateRequired = (value) => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Validates email format
 * @param {string} email - The email to validate
 * @returns {boolean} True if valid email format, false otherwise
 */
export const validateEmail = (email) => {
  if (typeof email !== 'string') return false;
  
  // More strict email validation that rejects consecutive dots
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // Additional check for consecutive dots
  if (email.includes('..')) return false;
  
  return emailRegex.test(email);
};

/**
 * Validates URL format
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid URL format, false otherwise
 */
export const validateURL = (url) => {
  if (typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

/**
 * Validates minimum length requirement
 * @param {string} value - The value to validate
 * @param {number} minLength - Minimum required length
 * @returns {boolean} True if meets minimum length, false otherwise
 */
export const validateMinLength = (value, minLength) => {
  if (typeof value !== 'string' || typeof minLength !== 'number') return false;
  return value.length >= minLength;
};

/**
 * Validates maximum length requirement
 * @param {string} value - The value to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} True if within maximum length, false otherwise
 */
export const validateMaxLength = (value, maxLength) => {
  if (typeof value !== 'string' || typeof maxLength !== 'number') return false;
  return value.length <= maxLength;
};

/**
 * Validates against a pattern (regex or string)
 * @param {string} value - The value to validate
 * @param {RegExp|string} pattern - The pattern to match against
 * @returns {boolean} True if matches pattern, false otherwise
 */
export const validatePattern = (value, pattern) => {
  if (typeof value !== 'string') return false;
  
  if (pattern instanceof RegExp) {
    return pattern.test(value);
  }
  
  if (typeof pattern === 'string') {
    const regex = new RegExp(pattern);
    return regex.test(value);
  }
  
  return false;
};

/**
 * Comprehensive input validation function
 * @param {string} value - The value to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.required - Whether the field is required
 * @param {string} options.type - Type of validation (email, url, password, etc.)
 * @param {number} options.minLength - Minimum length requirement
 * @param {number} options.maxLength - Maximum length requirement
 * @param {RegExp|string} options.pattern - Pattern to match against
 * @param {string} options.customMessage - Custom error message
 * @returns {Object} Validation result with isValid and error properties
 */
export const validateInput = (value, options = {}) => {
  const {
    required = false,
    type = 'text',
    minLength,
    maxLength,
    pattern,
    customMessage
  } = options;

  // If not required and empty, it's valid
  if (!required && (!value || value.trim() === '')) {
    return { isValid: true, error: '' };
  }

  // Check required validation
  if (required && !validateRequired(value)) {
    return { 
      isValid: false, 
      error: customMessage || 'Bu alan zorunludur' 
    };
  }

  // Skip other validations if empty and not required
  if (!value || value.trim() === '') {
    return { isValid: true, error: '' };
  }

  // Length validations (check these first)
  if (minLength && !validateMinLength(value, minLength)) {
    return { 
      isValid: false, 
      error: customMessage || `En az ${minLength} karakter girmelisiniz` 
    };
  }

  if (maxLength && !validateMaxLength(value, maxLength)) {
    return { 
      isValid: false, 
      error: customMessage || `En fazla ${maxLength} karakter girebilirsiniz` 
    };
  }

  // Type-specific validation
  switch (type) {
    case 'email':
      if (!validateEmail(value)) {
        return { 
          isValid: false, 
          error: customMessage || 'Geçerli bir e-posta adresi girin' 
        };
      }
      break;
    
    case 'url':
      if (!validateURL(value)) {
        return { 
          isValid: false, 
          error: customMessage || 'Geçerli bir URL girin' 
        };
      }
      break;
    
    case 'password':
      // Basic password validation - at least 8 characters
      if (minLength && !validateMinLength(value, minLength)) {
        return { 
          isValid: false, 
          error: customMessage || `Şifre en az ${minLength} karakter olmalıdır` 
        };
      }
      break;
  }

  // Pattern validation
  if (pattern && !validatePattern(value, pattern)) {
    return { 
      isValid: false, 
      error: customMessage || 'Girilen format geçerli değil' 
    };
  }

  return { isValid: true, error: '' };
};

// Default export with all validation functions
export default {
  sanitizeInput,
  validateRequired,
  validateEmail,
  validateURL,
  validateMinLength,
  validateMaxLength,
  validatePattern,
  validateInput
};
