// --- src/hooks/useEventListener.js ---
/**
 * Memory-safe event listener hook with automatic cleanup
 * Prevents memory leaks by properly removing event listeners
 */

import { useEffect, useRef } from 'react';

const useEventListener = (eventName, handler, element = window, options = {}) => {
  // Use ref to store the latest handler without causing re-renders
  const savedHandler = useRef(handler);

  // Update ref.current value if handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Make sure element supports addEventListener
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    // Create event listener that calls handler function stored in ref
    const eventListener = (event) => savedHandler.current(event);

    // Add event listener
    element.addEventListener(eventName, eventListener, options);

    // Remove event listener on cleanup
    return () => {
      element.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]); // Re-run if eventName, element, or options change
};

export default useEventListener;
