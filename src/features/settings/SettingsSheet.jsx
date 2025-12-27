import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { backdropVariants, slideVariants } from '@/theme/tokens/variants';
import Portal from '@/components/Portal';
import SettingsView from './SettingsView';
import SettingsSearch from './SettingsSearch';
import styles from './SettingsSheet.module.css';

const SettingsSheet = ({ isOpen, onClose }) => {
  const sheetRef = useRef(null);
  const [focusedElementBeforeOpen, setFocusedElementBeforeOpen] = useState(null);
  
  // Search and filter state
  const [searchValue, setSearchValue] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');
  const [filterTags, setFilterTags] = useState([]);

  // Define settings groups for navigation
  const settingsGroups = [
    { id: 'all', label: 'All Settings' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'layout', label: 'Layout' },
    { id: 'sidebar', label: 'Sidebar' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'functionality', label: 'Functionality' },
    { id: 'data', label: 'Data Management' },
    { id: 'header', label: 'Header' }
  ];

  const handleSearchChange = (value) => {
    setSearchValue(value);
  };

  const handleGroupChange = (groupId) => {
    setActiveGroup(groupId);
  };

  const handleFilterTagRemove = (tagId) => {
    setFilterTags(tags => tags.filter(tag => tag.id !== tagId));
  };

  // Escape key handler
  useEscapeKey(onClose, isOpen);

  // Focus trap
  useFocusTrap(sheetRef, isOpen);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      setFocusedElementBeforeOpen(document.activeElement);
      
      document.body.style.overflow = 'hidden';
      
      // Focus the sheet after animation
      const timer = setTimeout(() => {
        if (sheetRef.current) {
          const focusableElements = sheetRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        }
      }, 300); // Match animation duration
      
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = '';
      
      // Restore focus when closing
      if (focusedElementBeforeOpen && typeof focusedElementBeforeOpen.focus === 'function') {
        focusedElementBeforeOpen.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, focusedElementBeforeOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle close button key events
  const handleCloseKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <Portal>
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className={styles.backdrop}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={handleBackdropClick}
              aria-hidden="true"
            />

            {/* Side Sheet */}
            <motion.div
              ref={sheetRef}
              className={styles.sheet}
              variants={slideVariants.fromRight}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-title"
            >
              {/* Header */}
              <div className={styles.header}>
                <h2 id="settings-title" className={styles.title}>
                  Ayarlar
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={onClose}
                  onKeyDown={handleCloseKeyDown}
                  aria-label="Ayarları kapat"
                  type="button"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Search and Filter */}
              <SettingsSearch
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                filterTags={filterTags}
                onFilterTagRemove={handleFilterTagRemove}
                groupNavItems={settingsGroups}
                activeGroup={activeGroup}
                onGroupChange={handleGroupChange}
                placeholder="Search settings..."
              />

              {/* Content */}
              <div className={styles.content}>
                <SettingsView 
                  searchValue={searchValue}
                  activeGroup={activeGroup}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
};

export default SettingsSheet;
