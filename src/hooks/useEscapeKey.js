import { useEffect } from 'react';

/**
 * Custom hook to handle Escape key press
 * @param {Function} callback - Function to call when Escape is pressed
 * @param {boolean} enabled - Whether the hook is active
 */
export const useEscapeKey = (callback, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape' || event.keyCode === 27) {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [callback, enabled]);
};
