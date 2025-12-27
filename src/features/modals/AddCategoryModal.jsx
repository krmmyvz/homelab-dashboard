import React, { useState, useEffect, useContext, useRef } from 'react'; // useRef eklendi
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ServerDataContext } from '@/contexts/ServerDataContext';
import { UIContext } from '@/contexts/UIContext';
import { iconComponents } from '@/utils/constants.js';
import { motionTokens } from '@/theme/tokens/motion';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import styles from './Modal.module.css';
import { DND_TYPES, MODAL_TYPES } from '@/constants/appConstants';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

const AddCategoryModal = () => {
  const { handleAddOrUpdate } = useContext(ServerDataContext);
  const { isModalOpen, closeModal, editingData } = useContext(UIContext);

  // editingData.category içinde {category: actualCategory} veya doğrudan category gelebilir
  const existingCategory = editingData?.category?.category || editingData?.category || null;
  const [category, setCategory] = useState({ title: '', iconName: 'Server' });
  
  // YENİ: Odaklanacak input için ref
  const firstInputRef = useRef(null);
  const modalRef = useFocusTrap(isModalOpen.category);
  useEscapeKey(() => closeModal(MODAL_TYPES.CATEGORY), isModalOpen.category);

  useEffect(() => {
    if (isModalOpen.category) {
      if (existingCategory) {
        setCategory(existingCategory);
      } else {
        setCategory({ title: '', iconName: 'Server' });
      }
      // YENİ: Modal açıldığında 100ms sonra input'a odaklan
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [existingCategory, isModalOpen.category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCategory(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAddOrUpdate(DND_TYPES.CATEGORY, category);
    closeModal(MODAL_TYPES.CATEGORY);
  };

  return (
    <AnimatePresence>
      {isModalOpen.category && (
        <motion.div 
          className={styles.modalOverlay} 
          onClick={() => closeModal(MODAL_TYPES.CATEGORY)}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
          transition={motionTokens.springs.fastEffects}
        >
          <motion.div 
            ref={modalRef}
            className={styles.modalContent} 
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            transition={motionTokens.springs.defaultSpatial}
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
          >
            <div className={styles.modalHeader}>
              <h2 id="category-modal-title" className={styles.modalTitle}>{existingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}</h2>
              <button 
                onClick={() => closeModal(MODAL_TYPES.CATEGORY)} 
                className={styles.closeButton}
                aria-label="Kapat" // YENİ: ARIA etiketi
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="title">Kategori Adı</label>
                <input 
                  id="title" 
                  name="title" 
                  type="text" 
                  className={styles.input} 
                  value={category.title} 
                  onChange={handleChange} 
                  placeholder="örn., Medya Sunucuları" 
                  required 
                  ref={firstInputRef} // YENİ: Ref ataması
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="iconName">İkon</label>
                <select id="iconName" name="iconName" className={styles.select} value={category.iconName} onChange={handleChange}>
                  {Object.keys(iconComponents).map(iconName => (
                    <option key={iconName} value={iconName}>{iconName}</option>
                  ))}
                </select>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.button} onClick={() => closeModal(MODAL_TYPES.CATEGORY)}>İptal</button>
                <button type="submit" className={`${styles.button} ${styles.primary}`}>{existingCategory ? 'Değişiklikleri Kaydet' : 'Kategori Ekle'}</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddCategoryModal;