import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to trap focus within a container (for modals)
 * MD3 Accessibility compliant
 * 
 * @param {boolean} active - Whether focus trap is active
 * @param {Object} options - Configuration options
 * @param {Function} options.onEscape - Callback when Escape key is pressed
 * @param {boolean} options.returnFocus - Return focus to trigger element on unmount
 */
export const useFocusTrap = (active = true, options = {}) => {
  const { onEscape, returnFocus = true } = options;
  const containerRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Handle keyboard events
  const handleKeyDown = useCallback((e) => {
    // Handle Escape key
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      e.stopPropagation();
      onEscape();
      return;
    }

    // Handle Tab key
    if (e.key !== 'Tab') return;
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, [onEscape]);

  useEffect(() => {
    if (!active) return;

    // Store the currently focused element
    if (returnFocus) {
      previousActiveElement.current = document.activeElement;
    }

    if (!containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    // Focus first element on mount
    if (focusableElements.length > 0) {
      requestAnimationFrame(() => {
        focusableElements[0].focus();
      });
    }

    // Add event listener at document level for Escape key
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Return focus to previous element
      if (returnFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, handleKeyDown, returnFocus]);

  return containerRef;
};

export default useFocusTrap;
