// --- src/components/CustomSelect/CustomSelect.jsx ---
// Portal kullanımı geri alındı (geçici çözüm).

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { motionTokens } from '../../theme/tokens/motion';
import styles from './CustomSelect.module.css';

const dropdownVariants = {
  hidden: { opacity: 0, scaleY: 0 },
  visible: {
    opacity: 1,
    scaleY: 1,
    transition: {
      duration: 0.15,
      ease: [0.04, 0.62, 0.23, 0.98],
      stiffness: 500,
      damping: 30
    }
  }
};

const CustomSelect = ({ options, value, onChange, label, id, disabled = false, required = false, error, variant = 'outlined', leadingIcon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, maxWidth: 400, openUpward: false });
  const selectRef = useRef(null);
  const buttonRef = useRef(null);
  const optionsRef = useRef([]);
  const selectedOption = options.find(opt => opt.id === value);
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = 250; // max-height from CSS
      const dropdownMaxWidth = 400;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const spaceRight = viewportWidth - rect.left;
      const spaceLeft = rect.right;

      // Decide whether to open upward or downward
      const shouldOpenUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      // Calculate width and position
      let leftPosition = rect.left;
      let availableWidth = dropdownMaxWidth;

      // If not enough space on the right, align to button's right edge and expand left
      if (spaceRight < dropdownMaxWidth + 16) {
        // Use space on the left (up to button's right edge)
        availableWidth = Math.min(dropdownMaxWidth, spaceLeft - 16);
        leftPosition = rect.right - availableWidth;
      } else {
        // Enough space on the right
        availableWidth = Math.min(dropdownMaxWidth, spaceRight - 16);
        leftPosition = rect.left;
      }

      setDropdownPosition({
        top: shouldOpenUpward ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left: Math.max(16, leftPosition), // Don't go beyond left edge
        width: rect.width,
        maxWidth: availableWidth,
        openUpward: shouldOpenUpward
      });
    }
  }, []);

  const toggleDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen(prev => !prev);
      setFocusedIndex(-1);
      if (!isOpen) {
        updateDropdownPosition();
      }
    }
  }, [disabled, isOpen, updateDropdownPosition]);

  const handleSelect = useCallback((optionValue) => {
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
    setFocusedIndex(-1);
    selectRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback((event) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        if (isOpen) {
          event.preventDefault();
          const idx = focusedIndex >= 0 ? focusedIndex : 0;
          handleSelect(options[idx].id);
        } else {
          event.preventDefault();
          setIsOpen(true);
          setFocusedIndex(-1);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        selectRef.current?.focus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev => (prev + 1) % options.length);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(options.length - 1);
        } else {
          setFocusedIndex(prev => prev <= 0 ? options.length - 1 : prev - 1);
        }
        break;
      case 'Home':
        if (isOpen) {
          event.preventDefault();
          setFocusedIndex(0);
        }
        break;
      case 'End':
        if (isOpen) {
          event.preventDefault();
          setFocusedIndex(options.length - 1);
        }
        break;
    }
  }, [disabled, isOpen, focusedIndex, options, handleSelect]);

  const handleKeyUp = useCallback((event) => {
    if (disabled) return;
    if ((event.key === 'Enter' || event.key === ' ') && !isOpen) {
      // Fallback to ensure dropdown opens after key interaction
      setIsOpen(true);
      setFocusedIndex(-1);
    }
  }, [disabled, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, updateDropdownPosition]);

  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionsRef.current[focusedIndex]) {
      const el = optionsRef.current[focusedIndex];
      if (typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);

  return (
    <div className={styles.selectContainer} ref={selectRef}>
      {label && (
        <label
          htmlFor={selectId}
          className={styles.selectLabel}
          aria-hidden="true"
        >
          {label}
          {required && <span className={styles.required} aria-label="required">*</span>}
        </label>
      )}

      <motion.button
        type="button"
        id={selectId}
        ref={buttonRef}
        className={`${styles.selectButton} ${styles[variant]} ${error ? styles.error : ''} ${disabled ? styles.disabled : ''} ${leadingIcon ? styles.hasLeadingIcon : ''}`}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={label ? `${selectId}-label` : undefined}
        aria-describedby={error ? `${selectId}-error` : undefined}
        aria-required={required}
        aria-invalid={error ? 'true' : 'false'}
        whileTap={disabled ? undefined : { scale: 0.98 }}
      >
        {leadingIcon && (
          <span className={styles.leadingIcon} aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <span className={styles.selectedValue}>
          {selectedOption?.label || selectedOption?.name || 'Select an option'}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={motionTokens.springs.fastSpatial}
          aria-hidden="true"
        >
          <ChevronDown size={20} />
        </motion.div>
      </motion.button>

      {error && (
        <div
          id={`${selectId}-error`}
          className={styles.errorMessage}
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {isOpen && (
        <motion.ul
          className={styles.optionsList}
          variants={dropdownVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          style={{
            originY: dropdownPosition.openUpward ? 'bottom' : 'top',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            minWidth: `${dropdownPosition.width}px`,
            maxWidth: `${dropdownPosition.maxWidth}px`
          }}
          role="listbox"
          aria-labelledby={label ? `${selectId}-label` : undefined}
          aria-activedescendant={focusedIndex >= 0 ? `${selectId}-option-${focusedIndex}` : undefined}
        >
          {options.map((option, index) => (
            <motion.li
              key={option.id}
              ref={el => optionsRef.current[index] = el}
              id={`${selectId}-option-${index}`}
              className={`${styles.optionItem} ${option.id === value ? styles.selected : ''} ${index === focusedIndex ? styles.focused : ''}`}
              onClick={() => handleSelect(option.id)}
              role="option"
              aria-selected={option.id === value}
              aria-disabled={option.disabled || false}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              {option.label || option.name}
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
};

export default CustomSelect;