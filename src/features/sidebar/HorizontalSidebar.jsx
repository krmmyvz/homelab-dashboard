import React, { useState, useContext, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, ChevronLeft, ChevronRight, Settings as SettingsIcon } from 'lucide-react';
import { UIContext } from '@/contexts/UIContext';
import { ServerDataContext } from '@/contexts/ServerDataContext';
import { SettingsContext } from '@/contexts/SettingsContext';
import { iconComponents } from '@/utils/constants';
import { MODAL_TYPES, VIEW_TYPES } from '@/constants/appConstants';
import Portal from '@/components/Portal';
import SidebarButton from './components/SidebarButton';
import styles from './HorizontalSidebar.module.css';

const GroupDropdown = ({ groups, parentRef, onClose }) => {
  const { uiPrefs, setUiPref } = useContext(UIContext);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    if (parentRef.current) {
      const rect = parentRef.current.getBoundingClientRect();
      setPosition({ 
        top: rect.bottom + 8, 
        left: rect.left 
      });
    }
  }, [parentRef]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          parentRef.current && !parentRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, parentRef]);

  const handleGroupClick = (groupId) => {
    setUiPref('activeView', { type: VIEW_TYPES.GROUP, id: groupId });
    onClose();
  };

  return (
    <Portal>
      <motion.div
        ref={menuRef}
        className={styles.groupDropdown}
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {groups.map(group => (
          <motion.button
            key={group.id}
            className={`${styles.groupItem} ${uiPrefs.activeView.id === group.id ? styles.active : ''}`}
            onClick={() => handleGroupClick(group.id)}
            whileHover={{ backgroundColor: 'var(--color-surface-variant)' }}
          >
            {group.title}
          </motion.button>
        ))}
      </motion.div>
    </Portal>
  );
};

const AddMenuDropdown = ({ parentRef, onClose }) => {
  const { openModal, uiPrefs } = useContext(UIContext);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    if (parentRef.current) {
      const rect = parentRef.current.getBoundingClientRect();
      setPosition({ 
        top: rect.bottom + 8, 
        left: rect.left 
      });
    }
  }, [parentRef]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          parentRef.current && !parentRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, parentRef]);

  const handleAddClick = (type) => {
    let modalData = {};
    if (type === MODAL_TYPES.GROUP && uiPrefs.activeView.type === VIEW_TYPES.CATEGORY) {
      modalData.categoryId = uiPrefs.activeView.id;
    }
    openModal(type, modalData);
    onClose();
  };

  return (
    <Portal>
      <motion.div
        ref={menuRef}
        className={styles.addMenuDropdown}
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <motion.button onClick={() => handleAddClick(MODAL_TYPES.SERVER)} whileHover={{ backgroundColor: 'var(--color-surface-variant)' }}>
          Yeni Sunucu
        </motion.button>
        <motion.button onClick={() => handleAddClick(MODAL_TYPES.GROUP)} whileHover={{ backgroundColor: 'var(--color-surface-variant)' }}>
          Yeni Grup
        </motion.button>
        <motion.button onClick={() => handleAddClick(MODAL_TYPES.CATEGORY)} whileHover={{ backgroundColor: 'var(--color-surface-variant)' }}>
          Yeni Kategori
        </motion.button>
      </motion.div>
    </Portal>
  );
};

const HorizontalSidebar = () => {
  const { categories } = useContext(ServerDataContext);
  const { appSettings } = useContext(SettingsContext);
  const { uiPrefs, setUiPref, openSettings } = useContext(UIContext);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef(null);
  const dropdownRefs = useRef({});
  const addButtonRef = useRef(null);

  // Loading and error states - enhanced with retry mechanism
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced error handling with retry mechanism
  const handleError = (error, context) => {
    console.error(`HorizontalSidebar error in ${context}:`, error);
    setHasError(true);
    setErrorMessage(error.message || 'Kategoriler yüklenirken hata oluştu');
    setIsLoading(false);
  };

  const handleRetry = async () => {
    if (retryCount >= 3) return; // Max 3 retries
    
    setRetryCount(prev => prev + 1);
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    
    try {
      // Here you would implement actual data fetching retry logic
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
      setRetryCount(0);
    } catch (error) {
      handleError(error, 'retry');
    }
  };

  const sidebarSettings = appSettings.sidebar || {};
  const showLabels = sidebarSettings.showLabels !== false;
  const iconSize = sidebarSettings.iconSize === 'small' ? 16 : sidebarSettings.iconSize === 'large' ? 24 : 20;

  // Check scroll state
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [categories]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleCategoryClick = (category) => {
    const hasGroups = category.groups && category.groups.length > 0;
    
    if (hasGroups) {
      // Toggle dropdown
      if (activeDropdown === category.id) {
        setActiveDropdown(null);
      } else {
        setActiveDropdown(category.id);
      }
    } else {
      // Navigate to category
      setUiPref('activeView', { type: VIEW_TYPES.CATEGORY, id: category.id });
      setActiveDropdown(null);
    }
  };

  const handleFavoritesClick = () => {
    setUiPref('activeView', { type: VIEW_TYPES.FAVORITES, id: 'favorites' });
    setActiveDropdown(null);
  };

  return (
    <div className={`${styles.horizontalSidebar} ${isLoading ? styles.loading : ''}`} data-density={sidebarSettings.density || 'comfortable'}>
      {/* Error Message with Retry */}
      {hasError && errorMessage && (
        <div className={`${styles.errorMessage} ${styles.medium}`} role="alert" aria-live="polite">
          <span>{errorMessage}</span>
          {retryCount < 3 && (
            <button 
              onClick={handleRetry}
              className={styles.retryButton}
              aria-label="Tekrar dene"
            >
              Tekrar Dene
            </button>
          )}
        </div>
      )}
      
      {/* Left scroll button */}
      <AnimatePresence>
        {canScrollLeft && (
          <motion.button
            className={`${styles.scrollButton} ${styles.scrollLeft}`}
            onClick={() => scroll('left')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ backgroundColor: 'var(--color-surface-variant)' }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scrollable content */}
      <div className={styles.scrollContainer} ref={scrollContainerRef}>
        <SidebarButton
          variant="action"
          size="medium"
          isActive={uiPrefs.activeView.type === VIEW_TYPES.FAVORITES}
          ariaLabel="Favoriler"
          onClick={handleFavoritesClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleFavoritesClick();
            }
          }}
        >
          {React.createElement(iconComponents.Star, { size: iconSize })}
          {showLabels && <span className={styles.label}>Favoriler</span>}
        </SidebarButton>

        {/* Categories */}
        {(categories || []).map((category) => {
          const IconComponent = iconComponents[category.iconName] || iconComponents.Folder;
          const hasGroups = category.groups && category.groups.length > 0;
          const isActive = uiPrefs.activeView.id === category.id;

          return (
            <div key={category.id} className={styles.categoryWrapper}>
              <SidebarButton
                ref={el => dropdownRefs.current[category.id] = el}
                variant="category"
                size="medium"
                isActive={isActive}
                ariaLabel={`${category.title}${hasGroups ? `, ${category.groups?.length || 0} grup` : ''}`}
                ariaExpanded={hasGroups ? activeDropdown === category.id : undefined}
                ariaHaspopup={hasGroups ? "menu" : undefined}
                onClick={() => handleCategoryClick(category)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCategoryClick(category);
                  }
                }}
              >
                <IconComponent size={iconSize} />
                {showLabels && <span className={styles.label}>{category.title}</span>}
                {hasGroups && <ChevronDown size={14} className={styles.chevron} />}
              </SidebarButton>

              {/* Group dropdown */}
              <AnimatePresence>
                {activeDropdown === category.id && hasGroups && (
                  <GroupDropdown
                    groups={category.groups}
                    parentRef={{ current: dropdownRefs.current[category.id] }}
                    onClose={() => setActiveDropdown(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Right scroll button */}
      <AnimatePresence>
        {canScrollRight && (
          <motion.button
            className={`${styles.scrollButton} ${styles.scrollRight}`}
            onClick={() => scroll('right')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ backgroundColor: 'var(--color-surface-variant)' }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className={styles.actions}>
        <SidebarButton
          ref={addButtonRef}
          variant="action"
          size="medium"
          ariaLabel="Yeni ekle menüsü"
          ariaExpanded={isAddMenuOpen}
          ariaHaspopup="menu"
          onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsAddMenuOpen(!isAddMenuOpen);
            }
          }}
        >
          <Plus size={iconSize} />
          {showLabels && <span className={styles.label}>Ekle</span>}
        </SidebarButton>

        <SidebarButton
          variant="action"
          size="medium"
          ariaLabel="Ayarlar"
          onClick={openSettings}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openSettings();
            }
          }}
        >
          <SettingsIcon size={iconSize} />
          {showLabels && <span className={styles.label}>Ayarlar</span>}
        </SidebarButton>
      </div>

      {/* Add menu dropdown */}
      <AnimatePresence>
        {isAddMenuOpen && (
          <AddMenuDropdown
            parentRef={addButtonRef}
            onClose={() => setIsAddMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(HorizontalSidebar);
