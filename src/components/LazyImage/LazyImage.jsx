// --- src/components/LazyImage/LazyImage.jsx ---
/**
 * Performance-optimized lazy loading image component
 * Features: Progressive loading, error fallback, intersection observer
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './LazyImage.module.css';

const LazyImage = ({ 
  src, 
  alt, 
  placeholder, 
  className = '', 
  fallback,
  blur = true,
  ...props 
}) => {
  const [loadingState, setLoadingState] = useState('loading'); // loading, loaded, error
  const [inView, setInView] = useState(false);
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px', // Start loading 50px before the image comes into view
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Handle image loading
  useEffect(() => {
    if (!inView || !src) return;

    const img = new Image();
    img.onload = () => setLoadingState('loaded');
    img.onerror = () => setLoadingState('error');
    img.src = src;
  }, [inView, src]);

  const containerClassName = `${styles.lazyImageContainer} ${className}`;

  return (
    <div ref={imgRef} className={containerClassName} {...props}>
      <AnimatePresence mode="wait">
        {/* Loading State */}
        {loadingState === 'loading' && (
          <motion.div
            key="loading"
            className={styles.placeholder}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {placeholder || (
              <div className={styles.loadingSkeleton}>
                <div className={styles.pulse}></div>
              </div>
            )}
          </motion.div>
        )}

        {/* Loaded State */}
        {loadingState === 'loaded' && (
          <motion.img
            key="loaded"
            src={src}
            alt={alt}
            className={`${styles.image} ${blur ? styles.imageBlur : ''}`}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            loading="lazy"
            onLoad={() => {
              // Remove blur class after image loads
              if (blur && imgRef.current) {
                const img = imgRef.current.querySelector(`.${styles.image}`);
                if (img) {
                  setTimeout(() => {
                    img.classList.remove(styles.imageBlur);
                  }, 100);
                }
              }
            }}
          />
        )}

        {/* Error State */}
        {loadingState === 'error' && (
          <motion.div
            key="error"
            className={styles.errorState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {fallback || (
              <div className={styles.errorPlaceholder}>
                <span className={styles.errorIcon}>🖼️</span>
                <span className={styles.errorText}>Failed to load image</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(LazyImage);
