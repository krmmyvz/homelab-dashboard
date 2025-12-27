import { describe, it, expect } from 'vitest';
import {
  validateInput,
  sanitizeInput,
  validateEmail,
  validateURL,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validatePattern
} from '../validation';

describe('Validation Utilities', () => {
  describe('sanitizeInput', () => {
    it('removes script tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello');
    });

    it('removes various HTML tags', () => {
      const input = '<div><p>Hello</p><img src="x" onerror="alert(1)"></div>';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello');
    });

    it('removes javascript: protocols', () => {
      const input = 'Click <a href="javascript:alert(1)">here</a>';
      const result = sanitizeInput(input);
      expect(result).toBe('Click here');
    });

    it('removes event handlers', () => {
      const input = '<button onclick="alert(1)">Click me</button>';
      const result = sanitizeInput(input);
      expect(result).toBe('Click me');
    });

    it('preserves safe text', () => {
      const input = 'Hello world! This is safe text.';
      const result = sanitizeInput(input);
      expect(result).toBe(input);
    });

    it('handles empty string', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });

    it('handles null and undefined', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });
  });

  describe('validateRequired', () => {
    it('validates required fields', () => {
      expect(validateRequired('hello')).toBe(true);
      expect(validateRequired('')).toBe(false);
      expect(validateRequired('   ')).toBe(false);
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
      expect(validateEmail('test123@subdomain.example.org')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test..email@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validateURL', () => {
    it('validates correct URLs', () => {
      expect(validateURL('https://example.com')).toBe(true);
      expect(validateURL('http://localhost:3000')).toBe(true);
      expect(validateURL('https://subdomain.example.com/path?query=1')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(validateURL('not-a-url')).toBe(false);
      expect(validateURL('http://')).toBe(false);
      expect(validateURL('javascript:alert(1)')).toBe(false);
      expect(validateURL('ftp://files.example.com')).toBe(false);
      expect(validateURL('')).toBe(false);
    });
  });

  describe('validateMinLength', () => {
    it('validates minimum length', () => {
      expect(validateMinLength('hello', 3)).toBe(true);
      expect(validateMinLength('hello', 5)).toBe(true);
      expect(validateMinLength('hi', 3)).toBe(false);
      expect(validateMinLength('', 1)).toBe(false);
    });
  });

  describe('validateMaxLength', () => {
    it('validates maximum length', () => {
      expect(validateMaxLength('hello', 10)).toBe(true);
      expect(validateMaxLength('hello', 5)).toBe(true);
      expect(validateMaxLength('hello world', 5)).toBe(false);
      expect(validateMaxLength('', 5)).toBe(true);
    });
  });

  describe('validatePattern', () => {
    it('validates against regex patterns', () => {
      const phonePattern = /^\+?[\d\s-()]+$/;
      expect(validatePattern('+1 (555) 123-4567', phonePattern)).toBe(true);
      expect(validatePattern('555-123-4567', phonePattern)).toBe(true);
      expect(validatePattern('abc-def-ghij', phonePattern)).toBe(false);
    });

    it('validates against string patterns', () => {
      expect(validatePattern('hello123', '^[a-z]+[0-9]+$')).toBe(true);
      expect(validatePattern('Hello123', '^[a-z]+[0-9]+$')).toBe(false);
    });
  });

  describe('validateInput', () => {
    it('validates required text input', () => {
      const result = validateInput('hello', { required: true });
      expect(result.isValid).toBe(true);
      expect(result.error).toBe('');
    });

    it('fails validation for empty required input', () => {
      const result = validateInput('', { required: true });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Bu alan zorunludur');
    });

    it('validates email type', () => {
      const result = validateInput('test@example.com', { type: 'email' });
      expect(result.isValid).toBe(true);
      expect(result.error).toBe('');

      const invalidResult = validateInput('invalid-email', { type: 'email' });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBe('Geçerli bir e-posta adresi girin');
    });

    it('validates URL type', () => {
      const result = validateInput('https://example.com', { type: 'url' });
      expect(result.isValid).toBe(true);
      expect(result.error).toBe('');

      const invalidResult = validateInput('not-a-url', { type: 'url' });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBe('Geçerli bir URL girin');
    });

    it('validates minimum length', () => {
      const result = validateInput('hello', { minLength: 3 });
      expect(result.isValid).toBe(true);

      const invalidResult = validateInput('hi', { minLength: 5 });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBe('En az 5 karakter girmelisiniz');
    });

    it('validates maximum length', () => {
      const result = validateInput('hello', { maxLength: 10 });
      expect(result.isValid).toBe(true);

      const invalidResult = validateInput('hello world!', { maxLength: 5 });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBe('En fazla 5 karakter girebilirsiniz');
    });

    it('validates custom patterns', () => {
      const pattern = /^[A-Z][a-z]+$/;
      const result = validateInput('Hello', { pattern });
      expect(result.isValid).toBe(true);

      const invalidResult = validateInput('hello', { pattern });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBe('Girilen format geçerli değil');
    });

    it('validates multiple rules', () => {
      const options = {
        required: true,
        type: 'email',
        minLength: 5,
        maxLength: 50
      };

      const validResult = validateInput('test@example.com', options);
      expect(validResult.isValid).toBe(true);

      const emptyResult = validateInput('', options);
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.error).toBe('Bu alan zorunludur');

      const shortResult = validateInput('a@b', options);
      expect(shortResult.isValid).toBe(false);
      expect(shortResult.error).toBe('En az 5 karakter girmelisiniz');

      const invalidEmailResult = validateInput('invalid-email-format', options);
      expect(invalidEmailResult.isValid).toBe(false);
      expect(invalidEmailResult.error).toBe('Geçerli bir e-posta adresi girin');
    });

    it('returns valid for non-required empty input', () => {
      const result = validateInput('', { required: false, minLength: 3 });
      expect(result.isValid).toBe(true);
      expect(result.error).toBe('');
    });

    it('validates password type with special rules', () => {
      const options = { type: 'password', minLength: 8 };
      
      const validResult = validateInput('password123', options);
      expect(validResult.isValid).toBe(true);

      const shortResult = validateInput('pass', options);
      expect(shortResult.isValid).toBe(false);
    });
  });
});
