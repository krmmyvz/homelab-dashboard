import React, { useState, useEffect, useContext } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ServerDataContext } from '../../contexts/ServerDataContext';
import { UIContext } from '../../contexts/UIContext';
import { motionTokens } from '../../theme/tokens/motion';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import styles from './Modal.module.css';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

const AddGroupModal = () => {
  const { categories, handleAddOrUpdate } = useContext(ServerDataContext);
  const { isModalOpen, closeModal, editingData } = useContext(UIContext);

  // editingData.group içinde {group: actualGroup, categoryId: ...} şeklinde geliyor
  const existingGroup = editingData?.group?.group || null;
  const preselectedCategoryId = editingData?.group?.categoryId || null;
  const [group, setGroup] = useState({ title: '', categoryId: '' });

  const modalRef = useFocusTrap(isModalOpen.group);
  useEscapeKey(() => closeModal('group'), isModalOpen.group);

  useEffect(() => {
    if (isModalOpen.group) {
        if (existingGroup) {
            // Düzenleme modu
            setGroup(existingGroup);
        } else {
            // Ekleme modu: Önceden seçilmiş bir kategori var mı kontrol et, yoksa ilk kategoriyi seç
            const initialCategoryId = preselectedCategoryId || (categories.length > 0 ? categories[0].id : '');
            setGroup({ title: '', categoryId: initialCategoryId });
        }
    }
  }, [existingGroup, preselectedCategoryId, isModalOpen.group, categories]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setGroup(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!group.categoryId) {
        alert("Lütfen bir kategori seçin.");
        return;
    }
    // handleAddOrUpdate fonksiyonuna hem grup bilgilerini hem de ait olduğu categoryId'yi gönder
    handleAddOrUpdate('group', { ...group });
    closeModal('group');
  };
  
  return (
    <AnimatePresence>
      {isModalOpen.group && (
        <motion.div 
          className={styles.modalOverlay} 
          onClick={() => closeModal('group')}
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
            aria-labelledby="group-modal-title"
          >
            <div className={styles.modalHeader}>
              <h2 id="group-modal-title" className={styles.modalTitle}>{existingGroup?.id ? 'Grubu Düzenle' : 'Yeni Grup Ekle'}</h2>
              <button onClick={() => closeModal('group')} className={styles.closeButton} aria-label="Modalı kapat"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="title">Grup Adı</label>
                <input id="title" name="title" type="text" className={styles.input} value={group.title} onChange={handleChange} placeholder="örn., Yayın Sunucuları" required />
              </div>
              <div className={styles.formGroup}>
                  <label htmlFor="categoryId">Kategori</label>
                  <select id="categoryId" name="categoryId" className={styles.select} value={group.categoryId} onChange={handleChange} required>
                    <option value="" disabled>Kategori Seçin...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.title}</option>
                    ))}
                  </select>
                </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.button} onClick={() => closeModal('group')}>İptal</button>
                <button type="submit" className={`${styles.button} ${styles.primary}`}>{existingGroup?.id ? 'Değişiklikleri Kaydet' : 'Grup Ekle'}</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddGroupModal;
