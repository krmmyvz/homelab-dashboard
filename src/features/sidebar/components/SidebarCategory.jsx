import React, { useContext, useEffect, useRef, useState } from 'react';
// DÜZELTME: Artık kullanılmayan import'lar kaldırıldı
import { Settings, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Portal from '@/components/Portal';
import { UIContext } from '@/contexts/UIContext';
import { SettingsContext } from '@/contexts/SettingsContext';
import { iconComponents } from '@/utils/constants';
import SidebarGroup from './SidebarGroup';
import SidebarButton from './SidebarButton';
import styles from './SidebarCategory.module.css';
import { VIEW_TYPES } from '@/constants/appConstants';

let hideFlyoutTimeout = null;

const FlyOutPanel = ({ category, parentRef }) => {
    const { editMode, setHoveredCategory } = useContext(UIContext);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (parentRef.current) {
            const rect = parentRef.current.getBoundingClientRect();
            setPosition({ top: rect.top, left: rect.right + 4 });
        }
    }, [parentRef]);

    const handleMouseEnter = () => clearTimeout(hideFlyoutTimeout);
    const handleMouseLeave = () => setHoveredCategory(null);

    if (!category) return null;

    const panelStyle = { top: `${position.top}px`, left: `${position.left}px` };
    const hasGroups = category.groups && category.groups.length > 0;

    return (
        <Portal>
            <motion.div
                style={panelStyle}
                className={styles.flyOutPanel}
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{
                    duration: 0.2,
                    ease: [0.4, 0, 0.2, 1]
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className={styles.flyOutPanelHeader}>
                    <h3 className={styles.flyOutPanelTitle}>
                        {category?.title || category?.name || category?.id || 'Kategori'}
                    </h3>
                </div>
                {hasGroups && (
                    <div className={styles.flyOutPanelContent}>
                        {(category.groups || []).map(group => (<SidebarGroup key={group.id} group={group} categoryId={category.id} inFlyout={true} />))}
                    </div>
                )}
            </motion.div>
        </Portal>
    );
};

const SidebarCategory = ({ item, category, type }) => {
    const data = item || category;
    const wrapperRef = useRef(null);
    const { uiPrefs, setUiPref, hoveredCategory, setHoveredCategory, openSettings } = useContext(UIContext);
    const { appSettings } = useContext(SettingsContext);
    const { activeView, isSidebarCollapsed } = uiPrefs;
    
    const sidebarSettings = appSettings?.sidebar || {};
    const showLabels = sidebarSettings.showLabels !== false; // Default true
    
    const isSelected = activeView.id === data.id;
    // Use data.groups from server
    const categoryGroups = (data && data.groups) ? data.groups : [];
    
    const hasGroups = type === VIEW_TYPES.CATEGORY && categoryGroups.length > 0;
    const isDropdownOpen = !isSidebarCollapsed && uiPrefs?.activeCategoryDropdown === data.id;

    // Loading and error states - enhanced with retry mechanism
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [retryCount, setRetryCount] = useState(0);

    // Enhanced error handling with retry mechanism
    const handleError = (error, context) => {
        console.error(`SidebarCategory error in ${context}:`, error);
        setHasError(true);
        setErrorMessage(error.message || 'Bir hata oluştu');
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

    // Log render state for debugging dropdown mount issues
    useEffect(() => {}, [hasGroups, isDropdownOpen, uiPrefs?.activeCategoryDropdown, categoryGroups.length]);
    const showFlyOut = hoveredCategory === data.id && isSidebarCollapsed;
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };
    
    const handleClick = () => {
        // Settings özel davranışı
        if (type === VIEW_TYPES.SETTINGS) {
            openSettings();
            return;
        }

        // Debug: log click intent and current state to help trace dropdown toggle
    // click handler - no debug logs

        setUiPref('activeView', { type: type, id: data.id });
        setHoveredCategory(null);
        if (!isSidebarCollapsed && hasGroups) {
            const next = (uiPrefs?.activeCategoryDropdown === data.id) ? null : data.id;
            // Debug: show the computed next value
            // toggling activeCategoryDropdown
            setUiPref('activeCategoryDropdown', next);
        } else {
            setUiPref('activeCategoryDropdown', null);
        }
    };
    
    const handleMouseEnter = () => {
        if (isSidebarCollapsed) {
            clearTimeout(hideFlyoutTimeout);
            setHoveredCategory(data.id);
        }
    };
    const handleMouseLeave = () => {
        if (isSidebarCollapsed) {
            hideFlyoutTimeout = setTimeout(() => {
                setHoveredCategory(null);
            }, 100);
        }
    };
    
    useEffect(() => { return () => clearTimeout(hideFlyoutTimeout); }, []);
    
    const IconComponent = iconComponents[(data || {}).iconName] || Settings;

    return (
        <div ref={wrapperRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {/* DÜZELTME: Dnd-kit ile ilgili prop'lar (ref, style vb.) kaldırıldı */}
            <div className={styles.itemWrapper}>
                <SidebarButton
                    variant="category"
                    size="medium"
                    isActive={isSelected}
                    isLoading={isLoading}
                    hasError={hasError}
                    ariaLabel={`${data?.title || data?.name || data?.id || 'Kategori'}${hasGroups ? `, ${categoryGroups.length} grup` : ''}`}
                    ariaExpanded={hasGroups ? isDropdownOpen : undefined}
                    ariaHaspopup={hasGroups ? "menu" : undefined}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                    className={`${isSidebarCollapsed ? styles.collapsed : ''}`}
                >
                    <div className={styles.iconWrapper}>
                        <IconComponent size={20} />
                    </div>
                    {showLabels && (
                        <motion.span 
                            className={styles.title}
                            animate={{ opacity: isSidebarCollapsed ? 0 : 1, width: isSidebarCollapsed ? 0 : 'auto', marginLeft: isSidebarCollapsed ? 0 : 'var(--spacing-3)' }}
                            transition={{ duration: 0.2 }}
                        >
                            {data?.title || data?.name || data?.id || 'Kategori'}
                        </motion.span>
                    )}
                    <AnimatePresence>
                        {!isSidebarCollapsed && hasGroups && (
                            <motion.div 
                                className={styles.chevron}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                transition={{ duration: 0.1 }}
                                style={{ rotate: isDropdownOpen ? 90 : 0 }}
                            >
                                <ChevronRight size={16} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </SidebarButton>
                
                {/* Error Message with Retry */}
                {hasError && errorMessage && (
                  <div className={`${styles.errorMessage} ${styles.small}`} role="alert" aria-live="polite">
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
                
                <AnimatePresence>
                    {!isSidebarCollapsed && isDropdownOpen && (
                        <motion.div 
                            className={styles.dropdownContainer} 
                            initial="collapsed" 
                            animate="open" 
                            exit="collapsed" 
                            variants={{ open: { opacity: 1, height: 'auto' }, collapsed: { opacity: 0, height: 0 } }} 
                            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}>
                            {/* DÜZELTME: SortableContext kaldırıldı */}
                            {categoryGroups.map(group => (<SidebarGroup key={group.id} group={group} categoryId={data.id} />))}
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence>{showFlyOut && <FlyOutPanel category={data} parentRef={wrapperRef} />}</AnimatePresence>
            </div>
        </div>
    );
};

export default React.memo(SidebarCategory);