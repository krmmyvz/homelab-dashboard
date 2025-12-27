// --- src/components/Ripple/Ripple.jsx ---
// MD3 Ripple Effect Component

import React, { useState, useCallback, useRef } from 'react';
import styles from './Ripple.module.css';

/**
 * MD3 Ripple Effect Component
 * Add to any interactive element for Material Design ripple animation
 * 
 * @param {string} color - Ripple color (default: currentColor)
 * @param {number} duration - Animation duration in ms (default: 600)
 * @param {boolean} disabled - Disable ripple effect
 */
const Ripple = ({
    color = 'currentColor',
    duration = 600,
    disabled = false,
    className = ''
}) => {
    const [ripples, setRipples] = useState([]);
    const containerRef = useRef(null);

    const createRipple = useCallback((event) => {
        if (disabled) return;

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;

        // Calculate ripple position from click/touch point
        let x, y;
        if (event.type === 'touchstart') {
            const touch = event.touches[0];
            x = touch.clientX - rect.left - size / 2;
            y = touch.clientY - rect.top - size / 2;
        } else {
            x = event.clientX - rect.left - size / 2;
            y = event.clientY - rect.top - size / 2;
        }

        const newRipple = {
            id: Date.now(),
            x,
            y,
            size,
        };

        setRipples(prev => [...prev, newRipple]);

        // Remove ripple after animation completes
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, duration);
    }, [disabled, duration]);

    const handleMouseDown = useCallback((event) => {
        // Only trigger on primary mouse button
        if (event.button === 0) {
            createRipple(event);
        }
    }, [createRipple]);

    const handleTouchStart = useCallback((event) => {
        createRipple(event);
    }, [createRipple]);

    return (
        <span
            ref={containerRef}
            className={`${styles.rippleContainer} ${className}`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            aria-hidden="true"
        >
            {ripples.map(ripple => (
                <span
                    key={ripple.id}
                    className={styles.ripple}
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: ripple.size,
                        height: ripple.size,
                        backgroundColor: color,
                        animationDuration: `${duration}ms`,
                    }}
                />
            ))}
        </span>
    );
};

export default Ripple;
