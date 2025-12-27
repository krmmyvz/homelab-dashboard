import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pipette, Check } from 'lucide-react';
import styles from './ColorPicker.module.css';

const ColorPicker = ({ value = '#3b82f6', onChange, label = 'Renk Seç' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);
  const pickerRef = useRef(null);

  // Popüler renkler paleti
  const presetColors = [
    { name: 'Mavi', hex: '#3b82f6' },
    { name: 'Mor', hex: '#8b5cf6' },
    { name: 'Pembe', hex: '#ec4899' },
    { name: 'Kırmızı', hex: '#ef4444' },
    { name: 'Turuncu', hex: '#f97316' },
    { name: 'Sarı', hex: '#eab308' },
    { name: 'Yeşil', hex: '#22c55e' },
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'İndigo', hex: '#6366f1' },
    { name: 'Gül', hex: '#f43f5e' },
    { name: 'Lime', hex: '#84cc16' },
    { name: 'Teal', hex: '#14b8a6' },
  ];

  // Dışarı tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Value prop değiştiğinde customColor'ı güncelle
  useEffect(() => {
    setCustomColor(value);
  }, [value]);

  const handlePresetClick = (hex) => {
    onChange(hex);
    setCustomColor(hex);
  };

  const handleCustomColorChange = (e) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  return (
    <div className={styles.colorPickerWrapper} ref={pickerRef}>
      <motion.button
        className={styles.colorPickerTrigger}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div 
          className={styles.colorPreview} 
          style={{ backgroundColor: value }}
        />
        {label && <span className={styles.colorLabel}>{label}</span>}
        <Pipette size={16} className={styles.colorIcon} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.colorPickerPopover}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
          >
            <div className={styles.colorPickerHeader}>
              <span className={styles.popoverTitle}>Renk Seçin</span>
            </div>

            {/* Özel Renk Seçici */}
            <div className={styles.customColorSection}>
              <div className={styles.customColorInput}>
                <input
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className={styles.nativeColorInput}
                />
                <div className={styles.customColorDisplay}>
                  <div 
                    className={styles.customColorSwatch}
                    style={{ backgroundColor: customColor }}
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      // Validate hex color
                      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                        onChange(e.target.value);
                      }
                    }}
                    className={styles.hexInput}
                    placeholder="#000000"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            <div className={styles.divider} />

            {/* Hazır Renkler */}
            <div className={styles.presetColorsSection}>
              <span className={styles.sectionTitle}>Hazır Renkler</span>
              <div className={styles.presetColorsGrid}>
                {presetColors.map((color) => (
                  <motion.button
                    key={color.hex}
                    className={styles.presetColorButton}
                    onClick={() => handlePresetClick(color.hex)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title={color.name}
                  >
                    <div
                      className={styles.presetColorSwatch}
                      style={{ backgroundColor: color.hex }}
                    />
                    {value === color.hex && (
                      <motion.div
                        className={styles.selectedIndicator}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', duration: 0.3 }}
                      >
                        <Check size={12} />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ColorPicker;
