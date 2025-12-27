import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import styles from './BackgroundPatternSelector.module.css';

const BackgroundPatternSelector = ({ value = 'none', onChange }) => {
  const patterns = [
    {
      id: 'none',
      name: 'Yok',
      preview: 'solid',
    },
    {
      id: 'dots',
      name: 'Noktalar',
      preview: 'radial-gradient(circle, var(--color-on-surface) 1px, transparent 1px)',
      size: '20px 20px',
    },
    {
      id: 'grid',
      name: 'Izgara',
      preview: `
        linear-gradient(var(--color-on-surface) 1px, transparent 1px),
        linear-gradient(90deg, var(--color-on-surface) 1px, transparent 1px)
      `,
      size: '20px 20px',
    },
    {
      id: 'diagonal',
      name: 'Çizgili',
      preview: 'repeating-linear-gradient(45deg, transparent, transparent 10px, var(--color-on-surface) 10px, var(--color-on-surface) 11px)',
    },
    {
      id: 'waves',
      name: 'Dalgalar',
      preview: `
        radial-gradient(ellipse at 50% 0%, var(--color-on-surface) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 100%, var(--color-on-surface) 0%, transparent 50%)
      `,
      size: '40px 40px',
      position: '0 0, 20px 20px',
    },
    {
      id: 'hexagon',
      name: 'Hexagon',
      preview: `
        linear-gradient(60deg, transparent 33.33%, var(--color-on-surface) 33.33%, var(--color-on-surface) 66.66%, transparent 66.66%),
        linear-gradient(-60deg, transparent 33.33%, var(--color-on-surface) 33.33%, var(--color-on-surface) 66.66%, transparent 66.66%)
      `,
      size: '50px 87px',
    },
    {
      id: 'zigzag',
      name: 'ZigZag',
      preview: `
        linear-gradient(135deg, transparent 25%, var(--color-on-surface) 25%),
        linear-gradient(225deg, transparent 25%, var(--color-on-surface) 25%),
        linear-gradient(45deg, transparent 75%, var(--color-on-surface) 75%),
        linear-gradient(315deg, transparent 75%, var(--color-on-surface) 75%)
      `,
      size: '20px 20px',
      position: '0 0, 10px 0, 10px -10px, 0px 10px',
    },
    {
      id: 'crosses',
      name: 'Artılar',
      preview: `
        linear-gradient(transparent 0%, transparent 40%, var(--color-on-surface) 40%, var(--color-on-surface) 60%, transparent 60%, transparent 100%),
        linear-gradient(90deg, transparent 0%, transparent 40%, var(--color-on-surface) 40%, var(--color-on-surface) 60%, transparent 60%, transparent 100%)
      `,
      size: '20px 20px',
    },
  ];

  const getPatternStyle = (pattern) => {
    if (pattern.id === 'none') {
      return { background: 'var(--color-surface)' };
    }

    return {
      background: pattern.preview,
      backgroundSize: pattern.size || 'auto',
      backgroundPosition: pattern.position || '0 0',
      opacity: 0.05,
    };
  };

  return (
    <div className={styles.patternSelector}>
      <div className={styles.patternGrid}>
        {patterns.map((pattern) => (
          <motion.button
            key={pattern.id}
            className={`${styles.patternButton} ${value === pattern.id ? styles.selected : ''}`}
            onClick={() => onChange(pattern.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={pattern.name}
          >
            <div className={styles.patternPreview}>
              <div 
                className={styles.patternBackground}
                style={getPatternStyle(pattern)}
              />
              {value === pattern.id && (
                <motion.div
                  className={styles.selectedIndicator}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.3 }}
                >
                  <Check size={16} />
                </motion.div>
              )}
            </div>
            <span className={styles.patternName}>{pattern.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default BackgroundPatternSelector;
