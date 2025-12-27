// --- src/components/ToggleSwitch/ToggleSwitch.jsx ---
// MD3 Compliant Switch Component with Icon Support

import React, { useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { motionTokens } from '../../theme/tokens/motion';
import styles from './ToggleSwitch.module.css';

const trackVariants = {
  unchecked: {
    backgroundColor: 'var(--color-surfaceVariant)',
    border: '2px solid var(--color-outline)'
  },
  checked: {
    backgroundColor: 'var(--color-primary)',
    border: '2px solid transparent'
  },
};

const handleVariants = {
  unchecked: {
    x: 4,
    width: 24, // Standardized to 24 for consistency
    height: 24,
    backgroundColor: 'var(--color-outline)',
  },
  checked: {
    x: 24,
    width: 24,
    height: 24,
    backgroundColor: 'var(--color-onPrimary)',
  },
};

// M3 Pressed state - handle grows to 28dp
const handlePressedVariants = {
  unchecked: {
    x: 2,
    width: 28,
    height: 28,
  },
  checked: {
    x: 22,
    width: 28,
    height: 28,
  },
};

const iconVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1 },
};

/**
 * MD3 Switch Component
 * @param {Object} icons - { checked: ReactNode, unchecked: ReactNode }
 * @param {boolean} showOnlySelectedIcon - Only show icon for current state
 */
const ToggleSwitch = ({
  checked,
  onChange,
  disabled = false,
  label,
  id,
  icons,
  showOnlySelectedIcon = true,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  name
}) => {
  // Ensure consistent but unique id; allow external id override
  const reactId = useId();
  const uniqueSuffix = Math.random().toString(36).slice(2, 6);
  const switchId = id ? `${id}` : `${reactId}-input-${uniqueSuffix}`;

  // Determine which icon to show
  const currentIcon = checked ? icons?.checked : icons?.unchecked;
  const hasIcons = icons && (icons.checked || icons.unchecked);

  return (
    <div className={`${styles.toggleContainer} ${disabled ? styles.disabled : ''}`}>
      {label && (
        <label
          htmlFor={switchId}
          className={styles.label}
        >
          {label}
        </label>
      )}

      <motion.label
        className={`${styles.toggleSwitch} ${hasIcons ? styles.hasIcons : ''}`}
      >
        <input
          id={switchId}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          name={name}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          className={styles.hiddenInput}
        />
        <motion.span
          className={styles.slider}
          animate={checked ? 'checked' : 'unchecked'}
          variants={trackVariants}
          transition={motionTokens.springs.fastEffects}
          aria-hidden="true"
        />
        {/* M3 State Layer - 40dp hover/focus indicator */}
        <span className={styles.stateLayer} aria-hidden="true" />
        <motion.span
          className={`${styles.handle} ${hasIcons ? styles.handleWithIcon : ''}`}
          animate={checked ? 'checked' : 'unchecked'}
          variants={handleVariants}
          whileTap={disabled ? undefined : handlePressedVariants[checked ? 'checked' : 'unchecked']}
          transition={motionTokens.springs.fastSpatial}
          layout
          aria-hidden="true"
        >
          {/* Icon inside handle */}
          {hasIcons && (
            <AnimatePresence mode="wait">
              {showOnlySelectedIcon ? (
                currentIcon && (
                  <motion.span
                    key={checked ? 'checked' : 'unchecked'}
                    className={styles.icon}
                    variants={iconVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ duration: 0.15 }}
                  >
                    {currentIcon}
                  </motion.span>
                )
              ) : (
                <motion.span
                  key={checked ? 'checked' : 'unchecked'}
                  className={styles.icon}
                  variants={iconVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.15 }}
                >
                  {checked ? icons.checked : icons.unchecked}
                </motion.span>
              )}
            </AnimatePresence>
          )}
        </motion.span>
      </motion.label>
    </div>
  );
};

export default ToggleSwitch;