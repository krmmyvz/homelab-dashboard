import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader } from 'lucide-react';
import styles from './StatusIndicator.module.css';

const StatusIndicator = ({ status }) => {
  return (
    <div className={styles.indicatorContainer}>
      <AnimatePresence mode="wait">
        {status === 'saving' && (
          <motion.div
            key="saving"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`${styles.indicator} ${styles.saving}`}
          >
            <Loader size={14} className={styles.loaderIcon} />
            Kaydediliyor...
          </motion.div>
        )}
        {status === 'saved' && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`${styles.indicator} ${styles.saved}`}
          >
            <Check size={14} />
            Kaydedildi
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatusIndicator;
