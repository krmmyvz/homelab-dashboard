import React from 'react';
import { useAppData } from '@/hooks/useAppData';
import { NotificationProvider } from '@/contexts/NotificationProvider';
import { SettingsProvider } from '@/contexts/SettingsProvider';
import { ServerDataProvider } from '@/contexts/ServerDataProvider';
import { UIProvider } from '@/contexts/UIContext';
import { ThemeProvider } from '@/theme/ThemeContext';

export const GlobalProvider = ({ children }) => {
  const {
    settings,
    setSettings,
    categories,
    setCategories,
    isInitialLoad,
    isSaving,
    saveError,
    retrySave
  } = useAppData();

  return (
    <NotificationProvider>
      <SettingsProvider
        settings={settings}
        setSettings={setSettings}
        isInitialLoad={isInitialLoad}
        isSaving={isSaving}
        saveError={saveError}
        retrySave={retrySave}
      >
        <ServerDataProvider
          categories={categories}
          setCategories={setCategories}
          settings={settings} // DÜZELTME: exportData için settings de gerekli
          setSettings={setSettings} // DÜZELTME: importData için setSettings de gerekli
        >
          <UIProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </UIProvider>
        </ServerDataProvider>
      </SettingsProvider>
    </NotificationProvider>
  );
};