import React, { useContext } from 'react';
import { X, Tag } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ServerDataContext } from '../../contexts/ServerDataContext';
import { UIContext } from '../../contexts/UIContext';
import { motionTokens } from '../../theme/tokens/motion';
import styles from './Modal.module.css';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

const TagsModal = () => {
  const { categories } = useContext(ServerDataContext);
  const { isModalOpen, closeModal, activeTags, toggleTagFilter, clearTagFilter } = useContext(UIContext);

  const allTags = new Set();
  (categories || []).forEach(cat => (cat.groups || []).forEach(group => (group.servers || []).forEach(server => (server.tags || []).forEach(tag => allTags.add(tag)))));
  const uniqueTags = Array.from(allTags).sort();

  return (
    <AnimatePresence>
      {isModalOpen.tags && (
        <motion.div 
          className={styles.modalOverlay} 
          onClick={() => closeModal('tags')}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
          transition={motionTokens.springs.fastEffects}
        >
          <motion.div 
            className={`${styles.modalContent} ${styles.tagsModal}`} 
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            transition={motionTokens.springs.defaultSpatial}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}><Tag size={20} /> Etiketlere Göre Filtrele</h2>
              <button onClick={() => closeModal('tags')} className={styles.closeButton}><X size={24} /></button>
            </div>
            <div className={styles.modalBody}>
                <p className={styles.modalDescription}>Sunucuları görmek için bir veya daha fazla etiket seçin.</p>
                <div className={styles.tagsModalContainer}>
                    {uniqueTags.map(tag => (
                        <button 
                            key={tag} 
                            className={`${styles.tagFilterButton} ${activeTags.includes(tag) ? styles.active : ''}`}
                            onClick={() => toggleTagFilter(tag)}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
            <div className={styles.modalFooter}>
                {activeTags.length > 0 && <button onClick={clearTagFilter} className={`${styles.button} ${styles.text}`}>Filtreyi Temizle</button>}
                <button type="button" className={`${styles.button} ${styles.primary}`} onClick={() => closeModal('tags')}>Kapat</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TagsModal;
