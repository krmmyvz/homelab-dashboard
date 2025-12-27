import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ServerDataContext } from '../../contexts/ServerDataContext';
import { UIContext } from '../../contexts/UIContext';
import { iconComponents } from '../../utils/constants.js';
import { validateInput, sanitizeInput } from '../../utils/validation';
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

const AddServerModal = () => {
  const { categories, handleAddOrUpdate } = useContext(ServerDataContext);
  const { isModalOpen, closeModal, editingData, uiPrefs } = useContext(UIContext);
  
  // editingData.server içinde {server: actualServer} şeklinde geliyor
  const existingServer = editingData?.server?.server || null;
  const { activeView } = uiPrefs;
  
  const [server, setServer] = useState({ name: '', url: '', description: '', icon: 'Server', categoryId: '', groupId: null, tags: [] });
  const [tagInput, setTagInput] = useState('');
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accessibility hooks
  const modalRef = useFocusTrap(isModalOpen.server);
  useEscapeKey(() => closeModal('server'), isModalOpen.server);

  const availableGroups = useMemo(() => {
    if (!server.categoryId) return [];
    const selectedCategory = categories.find(c => c.id === server.categoryId);
    return selectedCategory?.groups || [];
  }, [server.categoryId, categories]);

  useEffect(() => {
    if (isModalOpen.server) {
      setIsCreatingNewGroup(false);
      setNewGroupName('');

      const initialState = { name: '', url: '', description: '', icon: 'Server', categoryId: '', groupId: null, tags: [] };
      
      if (existingServer) {
        setServer({ ...initialState, ...existingServer, tags: existingServer.tags || [], groupId: existingServer.groupId || null });
      } else {
        let initialCategoryId = '';
        let initialGroupId = null;

        if (activeView.type === 'category') {
          initialCategoryId = activeView.id;
        } else if (activeView.type === 'group') {
          const groupCategory = categories.find(c => c.groups?.some(g => g.id === activeView.id));
          if (groupCategory) {
            initialCategoryId = groupCategory.id;
            initialGroupId = activeView.id;
          }
        }

        if (!initialCategoryId && categories.length > 0) {
          initialCategoryId = categories[0].id;
        }

        if (initialCategoryId && !initialGroupId) {
            const category = categories.find(c => c.id === initialCategoryId);
            if(category?.groups?.length > 0) {
                initialGroupId = category.groups[0].id;
            }
        }

        setServer({ ...initialState, categoryId: initialCategoryId, groupId: initialGroupId });
      }
    }
  }, [existingServer, isModalOpen.server, categories, activeView, editingData]);

  // Validation functions
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Validate server name
    const nameValidation = validateInput(server.name, {
      required: true,
      minLength: 2,
      maxLength: 50
    });
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error;
    }

    // Validate server URL
    const urlValidation = validateInput(server.url, {
      required: true,
      type: 'url'
    });
    if (!urlValidation.isValid) {
      newErrors.url = urlValidation.error;
    }

    // Validate description (optional)
    if (server.description) {
      const descValidation = validateInput(server.description, {
        maxLength: 200
      });
      if (!descValidation.isValid) {
        newErrors.description = descValidation.error;
      }
    }

    // Validate category selection
    if (!server.categoryId) {
      newErrors.categoryId = 'Lütfen bir kategori seçin';
    }

    // Validate new group name if creating new group
    if (isCreatingNewGroup) {
      const groupValidation = validateInput(newGroupName, {
        required: true,
        minLength: 2,
        maxLength: 30
      });
      if (!groupValidation.isValid) {
        newErrors.newGroupName = groupValidation.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [server, newGroupName, isCreatingNewGroup]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    setServer(prev => {
      const newState = { ...prev, [name]: sanitizedValue };
      if (name === 'categoryId') {
        const newCategory = categories.find(c => c.id === value);
        newState.groupId = newCategory?.groups?.[0]?.id || null;
        setIsCreatingNewGroup(false);
      }
      return newState;
    });

    // Real-time validation
    setErrors(prev => {
      const newErrors = { ...prev };
      
      switch(name) {
        case 'name': {
          const nameValidation = validateInput(sanitizedValue, {
            required: true,
            minLength: 2,
            maxLength: 50
          });
          if (!nameValidation.isValid) {
            newErrors.name = nameValidation.error;
          } else {
            delete newErrors.name;
          }
          break;
        }
          
        case 'url': {
          const urlValidation = validateInput(sanitizedValue, {
            required: true,
            type: 'url'
          });
          if (!urlValidation.isValid) {
            newErrors.url = urlValidation.error;
          } else {
            delete newErrors.url;
          }
          break;
        }
          
        case 'description': {
          if (sanitizedValue) {
            const descValidation = validateInput(sanitizedValue, {
              maxLength: 200
            });
            if (!descValidation.isValid) {
              newErrors.description = descValidation.error;
            } else {
              delete newErrors.description;
            }
          } else {
            delete newErrors.description;
          }
          break;
        }
          
        case 'categoryId': {
          if (!sanitizedValue) {
            newErrors.categoryId = 'Lütfen bir kategori seçin';
          } else {
            delete newErrors.categoryId;
          }
          break;
        }
      }
      
      return newErrors;
    });
  }, [categories]);

  const handleNewGroupChange = useCallback((e) => {
    const sanitizedValue = sanitizeInput(e.target.value);
    setNewGroupName(sanitizedValue);

    // Real-time validation for new group name
    if (isCreatingNewGroup) {
      const groupValidation = validateInput(sanitizedValue, {
        required: true,
        minLength: 2,
        maxLength: 30
      });
      
      setErrors(prev => {
        const newErrors = { ...prev };
        if (!groupValidation.isValid) {
          newErrors.newGroupName = groupValidation.error;
        } else {
          delete newErrors.newGroupName;
        }
        return newErrors;
      });
    }
  }, [isCreatingNewGroup]);  const handleGroupChange = useCallback((e) => {
    const { value } = e.target;
    if (value === '_CREATE_NEW_') {
        setIsCreatingNewGroup(true);
        setServer(prev => ({ ...prev, groupId: null }));
    } else if (value === '_NO_GROUP_') {
        setIsCreatingNewGroup(false);
        setServer(prev => ({ ...prev, groupId: null }));
    } else {
        setIsCreatingNewGroup(false);
        setServer(prev => ({ ...prev, groupId: value }));
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let finalGroupId = server.groupId;
      let finalCategoryKey = server.categoryId;

      if (isCreatingNewGroup) {
        const newGroupId = `group-${Date.now()}`;
        handleAddOrUpdate('group', { 
          id: newGroupId, 
          title: newGroupName, 
          categoryId: finalCategoryKey 
        });
        finalGroupId = newGroupId;
      }

      const serverData = { ...server, groupId: finalGroupId };
      handleAddOrUpdate('server', { categoryKey: finalCategoryKey, serverData });
      closeModal('server');
    } catch (error) {
      console.error('Error saving server:', error);
      setErrors({ submit: 'Sunucu kaydedilirken bir hata oluştu' });
    } finally {
      setIsSubmitting(false);
    }
  }, [server, newGroupName, isCreatingNewGroup, handleAddOrUpdate, closeModal, validateForm, isSubmitting]);
  
  const handleTagInputChange = (e) => setTagInput(e.target.value);
  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!server.tags.includes(newTag)) {
        setServer(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      setTagInput('');
    }
  };
  const removeTag = (tagToRemove) => setServer(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));

  // Error display component
  const ErrorDisplay = ({ error }) => {
    if (!error) return null;
    return (
      <motion.div 
        className={styles.errorMessage}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <AlertCircle size={16} />
        <span>{error}</span>
      </motion.div>
    );
  };

  // Dinamik olarak groupId'nin değerini belirle
  let groupSelectValue = '_NO_GROUP_';
  if(isCreatingNewGroup) groupSelectValue = '_CREATE_NEW_';
  else if(server.groupId) groupSelectValue = server.groupId;

  return (
    <AnimatePresence>
      {isModalOpen.server && (
        <motion.div 
          className={styles.modalOverlay} 
          onClick={() => closeModal('server')}
          initial="hidden" animate="visible" exit="hidden"
          variants={overlayVariants} transition={motionTokens.springs.fastEffects}
        >
          <motion.div 
            ref={modalRef}
            className={styles.modalContent} 
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants} transition={motionTokens.springs.defaultSpatial}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className={styles.modalHeader}>
              <h2 id="modal-title" className={styles.modalTitle}>{existingServer?.id ? 'Öğeyi Düzenle' : 'Yeni Öğe Ekle'}</h2>
              <button onClick={() => closeModal('server')} className={styles.closeButton} aria-label="Modalı kapat"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalBody}>
              {/* Submit error display */}
              <AnimatePresence>
                {errors.submit && <ErrorDisplay error={errors.submit} />}
              </AnimatePresence>

              <div className={styles.formGroup}>
                <label htmlFor="name">Ad</label>
                <input 
                  id="name" 
                  name="name" 
                  type="text" 
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  value={server.name} 
                  onChange={handleChange} 
                  placeholder="örn., Plex veya Favori Blog" 
                  required 
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                <AnimatePresence>
                  {errors.name && <ErrorDisplay error={errors.name} />}
                </AnimatePresence>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="url">Adres (URL)</label>
                <input 
                  id="url" 
                  name="url" 
                  type="text" 
                  className={`${styles.input} ${errors.url ? styles.inputError : ''}`}
                  value={server.url} 
                  onChange={handleChange} 
                  placeholder="örn., http://192.168.1.100:32400" 
                  required 
                  aria-describedby={errors.url ? 'url-error' : undefined}
                />
                <AnimatePresence>
                  {errors.url && <ErrorDisplay error={errors.url} />}
                </AnimatePresence>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">Açıklama</label>
                <input 
                  id="description" 
                  name="description" 
                  type="text" 
                  className={`${styles.input} ${errors.description ? styles.inputError : ''}`}
                  value={server.description} 
                  onChange={handleChange} 
                  placeholder="örn., Medya Sunucusu" 
                  aria-describedby={errors.description ? 'description-error' : undefined}
                />
                <AnimatePresence>
                  {errors.description && <ErrorDisplay error={errors.description} />}
                </AnimatePresence>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="categoryId">Kategori</label>
                  <select 
                    id="categoryId" 
                    name="categoryId" 
                    className={`${styles.select} ${errors.categoryId ? styles.inputError : ''}`}
                    value={server.categoryId} 
                    onChange={handleChange} 
                    required
                    aria-describedby={errors.categoryId ? 'categoryId-error' : undefined}
                  >
                    <option value="" disabled>Kategori Seçin...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.title}</option>
                    ))}
                  </select>
                  <AnimatePresence>
                    {errors.categoryId && <ErrorDisplay error={errors.categoryId} />}
                  </AnimatePresence>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="groupId">Grup (İsteğe Bağlı)</label>
                  <select 
                    id="groupId" 
                    name="groupId" 
                    className={styles.select}
                    value={groupSelectValue} 
                    onChange={handleGroupChange} 
                    disabled={!server.categoryId}
                  >
                    <option value="_NO_GROUP_">-- Gruba Ekleme --</option>
                    {availableGroups.map(group => (
                      <option key={group.id} value={group.id}>{group.title}</option>
                    ))}
                    <option value="_CREATE_NEW_">Yeni Grup Oluştur...</option>
                  </select>
                </div>
              </div>
              <AnimatePresence>
                {isCreatingNewGroup && (
                    <motion.div 
                        className={styles.formGroup}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <label htmlFor="newGroupName">Yeni Grup Adı</label>
                        <input 
                          id="newGroupName" 
                          name="newGroupName" 
                          type="text" 
                          className={`${styles.input} ${errors.newGroupName ? styles.inputError : ''}`}
                          value={newGroupName} 
                          onChange={handleNewGroupChange} 
                          placeholder="örn., İndirme Araçları" 
                          aria-describedby={errors.newGroupName ? 'newGroupName-error' : undefined}
                        />
                        <AnimatePresence>
                          {errors.newGroupName && <ErrorDisplay error={errors.newGroupName} />}
                        </AnimatePresence>
                    </motion.div>
                )}
              </AnimatePresence>
              <div className={styles.formGroup}>
                <label htmlFor="icon">İkon</label>
                <select id="icon" name="icon" className={styles.select} value={server.icon} onChange={handleChange}>
                  {Object.keys(iconComponents).map(iconName => (
                    <option key={iconName} value={iconName}>{iconName}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="tags">Etiketler (Enter ile ekleyin)</label>
                <div className={styles.tagInputContainer}>
                  {(server.tags || []).map(tag => (
                    <div key={tag} className={styles.tagPill}>
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}><X size={14} /></button>
                    </div>
                  ))}
                  <input 
                    id="tags" type="text" className={styles.tagInput} value={tagInput}
                    onChange={handleTagInputChange} onKeyDown={handleTagInputKeyDown} placeholder="örn., medya, docker..."
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.button} onClick={() => closeModal('server')}>İptal</button>
                <button 
                  type="submit" 
                  className={`${styles.button} ${styles.primary}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Kaydediliyor...' : (existingServer?.id ? 'Değişiklikleri Kaydet' : 'Öğe Ekle')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddServerModal;
