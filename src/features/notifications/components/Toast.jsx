// --- src/features/notifications/components/Toast.jsx ---

import React, { useEffect, useContext, useState } from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, Loader } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { NotificationContext } from '../../../contexts/NotificationContext';
import { SettingsContext } from '../../../contexts/SettingsContext';
import styles from '../Toast.module.css';

// Bildirimler için animasyon varyantları (Material 3 Motion)
const toastVariants = {
  initial: { 
    opacity: 0, 
    x: 100,
    scale: 0.95
  },
  animate: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30
    }
  },
  exit: { 
    opacity: 0, 
    x: 50,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  },
};

const Toast = ({ notification, onDismiss, settings }) => {
  const { id, message, type = 'success', action, duration: notificationDuration, showProgress: notificationProgress } = notification;
  
  // Ayarlardan veya bildirimden gelen değerleri kullan
  const duration = notificationDuration ?? settings?.duration ?? 5000;
  const showProgress = notificationProgress ?? settings?.showProgress ?? true;
  
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (type === 'loading' || duration === 0) return; // Loading toasts don't auto-dismiss

    // Ses çal (eğer etkinse)
    if (settings?.soundEnabled) {
      playNotificationSound(settings.soundType, settings.soundVolume);
    }

    // Progress bar animation
    if (showProgress) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
      }, 50);

      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    } else {
      // Simple timer
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [id, onDismiss, duration, showProgress, type, settings]);

  // Ses çalma fonksiyonu (placeholder - gerçek ses dosyaları eklenebilir)
  const playNotificationSound = (soundType, volume) => {
    // Web Audio API ile basit ses efekti
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Ses tipine göre frekans ayarla
      const frequencies = {
        default: 800,
        chime: 1200,
        ping: 1000,
        bell: 880,
      };
      
      oscillator.frequency.value = frequencies[soundType] || 800;
      gainNode.gain.value = (volume || 50) / 200; // Volume kontrolü
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('Ses çalınamadı:', error);
    }
  };

  const icons = {
    error: <AlertCircle size={20} />,
    success: <CheckCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
    loading: <Loader size={20} className={styles.spinning} />,
  };

  return (
    <motion.div
      className={`${styles.toast} ${styles[type]}`}
      role="alert"
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
    >
      <div className={styles.toastIcon}>{icons[type] || icons.info}</div>
      <div className={styles.toastContent}>
        <p className={styles.toastMessage}>{message}</p>
        {action && (
          <button 
            className={styles.toastActionButton} 
            onClick={() => {
              action.onClick();
              onDismiss(id);
            }}
          >
            {action.label}
          </button>
        )}
      </div>
      {type !== 'loading' && (
        <button className={styles.toastCloseButton} onClick={() => onDismiss(id)} aria-label="Kapat">
          <X size={18} />
        </button>
      )}
      {showProgress && type !== 'loading' && (
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};

export const ToastContainer = () => {
  const { notifications, removeNotification } = useContext(NotificationContext);
  const { appSettings } = useContext(SettingsContext);

  // Bildirim ayarları
  const notificationSettings = appSettings?.notifications || {};
  const position = notificationSettings.position || 'top-right';
  const enabled = notificationSettings.enabled !== false;
  const minLevel = notificationSettings.minLevel || 'all';

  // Seviye hiyerarşisi
  const levelPriority = {
    error: 3,
    warning: 2,
    info: 1,
    success: 1,
    loading: 0,
  };

  const minLevelPriority = {
    error: 3,
    warning: 2,
    info: 1,
    all: 0,
  };

  // Bildirimleri filtrele
  const filteredNotifications = enabled && notifications 
    ? notifications.filter(notification => {
        // Seviye filtrelemesi
        const notificationLevel = levelPriority[notification.type] ?? 0;
        const requiredLevel = minLevelPriority[minLevel] ?? 0;
        
        if (notificationLevel < requiredLevel) {
          return false;
        }

        // Kategori filtrelemesi (eğer notification'da category varsa)
        if (notification.category && notificationSettings.categoryFilters) {
          return notificationSettings.categoryFilters[notification.category] !== false;
        }

        return true;
      })
    : [];

  if (!enabled || !filteredNotifications || filteredNotifications.length === 0) {
    return null;
  }

  return (
    <div className={styles.toastContainer} data-position={position}>
      {/* AnimatePresence, listeden bir eleman kaldırıldığında çıkış animasyonunu tetikler */}
      <AnimatePresence initial={false}>
        {filteredNotifications.map((notification) => (
          <Toast 
            key={notification.id} 
            notification={notification} 
            onDismiss={removeNotification}
            settings={notificationSettings}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};