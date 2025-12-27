import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ColorThief from 'colorthief';
import { SettingsContext } from '@/contexts/SettingsContext';
import { NotificationContext } from '@/contexts/NotificationContext';

export const SettingsProvider = ({ children, settings, setSettings, isInitialLoad, isSaving, saveError, retrySave }) => {
  const { addNotification } = React.useContext(NotificationContext);
  const [wallpaperColors, setWallpaperColors] = useState([]);
  const wallpaperInputRef = useRef(null);
  const logoInputRef = useRef(null);

  // handleSeedColorChange fonksiyonunu önce tanımlayalım
  const handleSeedColorChange = useCallback((colorHex) => {
    setSettings(prev => ({ ...prev, seedColor: colorHex }));
  }, [setSettings]);

  useEffect(() => {
    if (settings?.customWallpaper) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = settings.customWallpaper.split('?')[0];

      img.onload = () => {
        const colorThief = new ColorThief();
        try {
          const palette = colorThief.getPalette(img, 5);
          const hexPalette = palette.map(rgb => `#${rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`);
          setWallpaperColors(hexPalette);
          if (hexPalette.length > 0 && !settings.seedColor) {
            handleSeedColorChange(hexPalette[0]);
          }
        } catch (error) { console.error('Resimden renkler okunurken hata oluştu:', error); }
      };
      img.onerror = () => console.error('Resim yüklenemedi, renkler alınamıyor.');
    } else {
      setWallpaperColors([]);
    }
  }, [settings?.customWallpaper, handleSeedColorChange, settings?.seedColor]);

  const handleFileUpload = useCallback(async (file, type) => {
    if (!file || !file.type.startsWith('image/')) {
      addNotification('Lütfen geçerli bir resim dosyası seçin.', 'error');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Sunucu hatası.');
      const result = await response.json();
      const returnedPath = result.path || result.filePath || (result.filename ? `/uploads/${result.filename}` : null);

      setSettings(prev => {
        const newSettings = structuredClone(prev);
        const filePathWithVersion = (returnedPath || '') + `?v=${new Date().getTime()}`;
        if (type === 'wallpaper') {
          newSettings.customWallpaper = filePathWithVersion;
        } else if (type === 'logo') {
          newSettings.header.customLogo = filePathWithVersion;
        }
        return newSettings;
      });
      addNotification('Dosya başarıyla yüklendi.', 'success');
    } catch (error) {
      addNotification(`Yükleme hatası: ${error.message}`, 'error');
    }
  }, [addNotification, setSettings]);

  const removeFile = useCallback(async (type) => {
    try {
      const filename = type === 'wallpaper' ? 'custom-wallpaper.webp' : 'custom-logo.webp';
      console.log('Deleting file:', filename, 'Type:', type);

      const response = await fetch(`/api/uploads/${filename}`, { method: 'DELETE' });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sunucu hatası.');
      }

      const result = await response.json();
      console.log('Delete response:', result);

      setSettings(prev => {
        const newSettings = structuredClone(prev);
        if (type === 'wallpaper') {
          newSettings.customWallpaper = null;
          newSettings.seedColor = '#3b82f6';
        } else if (type === 'logo') {
          newSettings.header.customLogo = null;
        }
        return newSettings;
      });
      addNotification(`${type === 'wallpaper' ? 'Arka plan' : 'Logo'} başarıyla kaldırıldı.`, 'success');
    } catch (error) {
      console.error('Remove file error:', error);
      addNotification(`Silme hatası: ${error.message}`, 'error');
    }
  }, [addNotification, setSettings]);

  const contextValue = useMemo(() => ({
    appSettings: settings || {},
    setAppSettings: setSettings,
    isInitialLoad,
    isSaving,
    saveError,
    retrySave,
    wallpaperInputRef,
    logoInputRef,
    handleFileUpload,
    removeFile,
    wallpaperColors,
    handleSeedColorChange,
  }), [settings, setSettings, isInitialLoad, isSaving, saveError, retrySave, wallpaperColors, handleFileUpload, removeFile, handleSeedColorChange]);

  return (
    <>
      <input type="file" ref={wallpaperInputRef} onChange={(e) => handleFileUpload(e.target.files[0], 'wallpaper')} style={{ display: 'none' }} accept="image/*" />
      <input type="file" ref={logoInputRef} onChange={(e) => handleFileUpload(e.target.files[0], 'logo')} style={{ display: 'none' }} accept="image/*" />
      <SettingsContext.Provider value={contextValue}>
        {children}
      </SettingsContext.Provider>
    </>
  );
};