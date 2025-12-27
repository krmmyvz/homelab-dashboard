// --- src/features/modals/ConfirmModal.jsx ---

import React, { useContext } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { UIContext } from '../../contexts/UIContext';
import { motionTokens } from '../../theme/tokens/motion';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import styles from './Modal.module.css';

// Animasyon varyantları
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

const ConfirmModal = () => {
  const { isModalOpen, closeModal, editingData } = useContext(UIContext);
  
  const confirmData = editingData.confirm;

  const modalRef = useFocusTrap(isModalOpen.confirm);
  useEscapeKey(() => closeModal('confirm'), isModalOpen.confirm);

  return (
    <AnimatePresence>
      {isModalOpen.confirm && confirmData && (
        <motion.div 
          className={styles.modalOverlay} 
          onClick={() => closeModal('confirm')}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
          transition={motionTokens.springs.fastEffects}
        >
          <motion.div 
            ref={modalRef}
            className={`${styles.modalContent} ${styles.confirmModal}`} 
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            transition={motionTokens.springs.defaultSpatial}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-description"
          >
            <div className={styles.confirmModalBody}>
              <div className={styles.confirmIconWrapper}>
                <AlertTriangle size={24} className={styles.confirmIcon} />
              </div>
              <div className={styles.confirmTextContent}>
                <h3 id="confirm-modal-title" className={styles.modalTitle}>{confirmData.title}</h3>
                <p id="confirm-modal-description" className={styles.modalDescription}>{confirmData.message}</p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.button} onClick={() => closeModal('confirm')}>İptal</button>
              <button type="button" className={`${styles.button} ${styles.danger}`} onClick={confirmData.onConfirm}>
                {confirmData.confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;