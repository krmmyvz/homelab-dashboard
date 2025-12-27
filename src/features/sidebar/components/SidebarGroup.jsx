import React, { useContext, useState } from 'react';
// DÜZELTME: Artık kullanılmayan @dnd-kit/sortable ve CSS import'ları kaldırıldı
import { motion } from 'framer-motion';
import { UIContext } from '@/contexts/UIContext';
import { SettingsContext } from '@/contexts/SettingsContext';
import SidebarButton from './SidebarButton';
import styles from './SidebarGroup.module.css';
import { VIEW_TYPES } from '@/constants/appConstants';

const SidebarGroup = ({ group, inFlyout = false }) => {
  const { uiPrefs, setUiPref } = useContext(UIContext);
  const { appSettings } = useContext(SettingsContext);
  const isActive = uiPrefs.activeView.type === VIEW_TYPES.GROUP && uiPrefs.activeView.id === group.id;

  const sidebarSettings = appSettings?.sidebar || {};
  const showLabels = sidebarSettings.showLabels !== false; // Default true
  const showGroupCounts = sidebarSettings.showGroupCounts !== false; // Default true

  // Loading and error states - enhanced with retry mechanism
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced error handling with retry mechanism
  const handleError = (error, context) => {
    console.error(`SidebarGroup error in ${context}:`, error);
    setHasError(true);
    setErrorMessage(error.message || 'Grup yüklenirken hata oluştu');
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

  const handleGroupKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleGroupClick(e);
    }
  };
  
  const handleGroupClick = (e) => {
    e.stopPropagation();
    setUiPref('activeView', { type: VIEW_TYPES.GROUP, id: group.id });
  };

  return (
    // DÜZELTME: dnd-kit ile ilgili prop'lar (ref, style vb.) kaldırıldı
    <div className={`${styles.groupItemWrapper} ${inFlyout ? styles.inFlyout : ''}`}>
      <SidebarButton
        variant="group"
        size="small"
        isActive={isActive}
        isLoading={isLoading}
        hasError={hasError}
        ariaLabel={`${group.title}, ${group.servers?.length || 0} sunucu`}
        onClick={handleGroupClick}
        onKeyDown={handleGroupKeyDown}
      >
        {showLabels && <span className={styles.groupButtonText}>{group.title}</span>}
        {showGroupCounts && !inFlyout && (
          <div className={styles.groupButtonControls}>
            <span className={styles.serverCountBadge}>{(group.servers || []).length}</span>
          </div>
        )}
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
    </div>
  );
};

export default React.memo(SidebarGroup);