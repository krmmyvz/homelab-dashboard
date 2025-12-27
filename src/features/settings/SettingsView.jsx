import React, { useContext, useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsContext } from '@/contexts/SettingsContext';
import { NotificationContext } from '@/contexts/NotificationContext';
import HeaderSettings from './components/HeaderSettings';
import AppearanceSettings from './components/AppearanceSettings';
import LayoutSettings from './components/LayoutSettings';
import NotificationSettings from './components/NotificationSettings';
import SidebarSettings from './components/SidebarSettings';
import FunctionalitySettings from './components/FunctionalitySettings';
import DataManagementSettings from './components/DataManagementSettings';
import SettingsActionButton from './components/SettingsActionButton';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import NoResults from './NoResults';
import styles from './Settings.module.css';

const SettingsView = ({ searchValue, activeGroup }) => {
  const { isSaving, connectionStatus, saveError, retrySave } = useContext(SettingsContext);
  const { addNotification } = useContext(NotificationContext);
  const prevIsSaving = useRef(isSaving);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Filter settings components based on search and group
  const filteredSettings = useMemo(() => {
    const allSettings = [
      { id: 'appearance', component: AppearanceSettings, title: 'Appearance' },
      { id: 'layout', component: LayoutSettings, title: 'Layout' },
      { id: 'sidebar', component: SidebarSettings, title: 'Sidebar' },
      { id: 'notifications', component: NotificationSettings, title: 'Notifications' },
      { id: 'functionality', component: FunctionalitySettings, title: 'Functionality' },
      { id: 'data', component: DataManagementSettings, title: 'Data Management' },
      { id: 'header', component: HeaderSettings, title: 'Header' }
    ];

    let filtered = allSettings;

    // Filter by group
    if (activeGroup !== 'all') {
      filtered = filtered.filter(setting => setting.id === activeGroup);
    }

    // Filter by search
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter(setting =>
        setting.title.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [searchValue, activeGroup]);

  useEffect(() => {
    // Kaydetme durumu değiştiğinde toast göster
    if (prevIsSaving.current && !isSaving) {
      if (connectionStatus === 'error' || saveError) {
        setHasError(true);
        setErrorMessage(saveError || 'Ayarlar kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
        addNotification('Ayarlar kaydedilemedi', 'error');
      } else {
        setHasError(false);
        setErrorMessage('');
        addNotification('Ayarlar kaydedildi', 'success');
      }
    }
    prevIsSaving.current = isSaving;
  }, [isSaving, connectionStatus, addNotification]);

  // Connection status error handling
  useEffect(() => {
    if (connectionStatus === 'error' && !isSaving) {
      setHasError(true);
      setErrorMessage('Bağlantı hatası. Ayarlar otomatik olarak senkronize edilemedi.');
    } else if (connectionStatus === 'connected') {
      setHasError(false);
      setErrorMessage('');
    }
  }, [connectionStatus, isSaving]);

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    retrySave();
  };

  return (
    <motion.div
      className={styles.settingsContainer}
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: 0.07,
            delayChildren: hasError ? 0.3 : 0
          }
        }
      }}
    >
      {/* Skip link for accessibility */}
      <a href="#main-settings-content" className={styles.skipLink}>
        Ana içeriğe geç
      </a>

      {/* Error Message */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <ErrorMessage
              message={errorMessage}
              size="large"
              className={styles.settingsError}
            />
            <SettingsActionButton
              title="Tekrar Dene"
              onClick={handleRetry}
              variant="secondary"
              ariaLabel="Ayarları tekrar kaydetmeyi dene"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isSaving && (
          <motion.div
            className={styles.loadingOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.loadingContent}>
              <LoadingSpinner size="large" ariaLabel="Ayarlar kaydediliyor..." />
              <p className={styles.loadingText}>Ayarlar kaydediliyor...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Settings Content */}
      <div id="main-settings-content">
        {/* Settings Components */}
        <div className={styles.settingsContent}>
          {filteredSettings.length > 0 ? (
            filteredSettings.map(({ id, component: _SettingComponent }) => (
              <_SettingComponent key={id} />
            ))
          ) : (
            <NoResults
              title="No settings found"
              description="Try adjusting your search terms or select a different settings group."
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(SettingsView);
