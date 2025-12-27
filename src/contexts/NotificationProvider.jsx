// --- src/contexts/NotificationProvider.jsx ---
import React from 'react';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { NotificationContext } from '@/contexts/NotificationContext'; // DÜZELTME: Doğru import yolu

export const NotificationProvider = ({ children }) => {
  const { notifications, addNotification, removeNotification } = useNotifications();

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};