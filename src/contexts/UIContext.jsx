/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { useWindowSize } from '@/hooks/useWindowSize';
import { ServerDataContext } from '@/contexts/ServerDataContext';
import { SettingsContext } from '@/contexts/SettingsContext';

export const UIContext = createContext(null);

const UI_PREFS_KEY = 'homelab-ui-prefs';

const getFromStorage = (key, defaultValue) => {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      return { ...defaultValue, ...JSON.parse(storedValue) };
    }
    return defaultValue;
  } catch (error) {
    console.error(`localStorage'dan veri okunurken hata oluştu (${key}):`, error);
    return defaultValue;
  }
};

export const UIProvider = ({ children }) => {
  const { categories } = useContext(ServerDataContext);
  const { appSettings, isInitialLoad } = useContext(SettingsContext);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const mainContentRef = useRef(null);

  const [uiPrefs, setUiPrefs] = useState(() => getFromStorage(UI_PREFS_KEY, {
    activeView: { type: 'category', id: null },
    isGridView: true,
    isSidebarCollapsed: false,
    activeCategoryDropdown: null,
    sidebarWidth: 280,
  }));

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [effectiveIsDarkMode, setEffectiveIsDarkMode] = useState(true);
  const [activeTags, setActiveTags] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState({ server: false, category: false, group: false, confirm: false, tags: false });
  const [editingData, setEditingData] = useState({ server: null, category: null, group: null, confirm: null });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (!appSettings || !appSettings.theme) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => {
      const isSystemDark = mediaQuery.matches;
      setEffectiveIsDarkMode(appSettings.theme === 'system' ? isSystemDark : appSettings.theme === 'dark');
    };
    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [appSettings]);

  useEffect(() => {
    document.body.classList.toggle('theme-dark', effectiveIsDarkMode);
    document.body.classList.toggle('theme-light', !effectiveIsDarkMode);
    if (appSettings) { document.body.dataset.font = appSettings.font; }
  }, [effectiveIsDarkMode, appSettings]);

  useEffect(() => {
    localStorage.setItem(UI_PREFS_KEY, JSON.stringify(uiPrefs));
  }, [uiPrefs]);

  useEffect(() => {
    if (!isInitialLoad && categories.length > 0) {
      const { type, id } = uiPrefs.activeView;
      const viewExists = id === 'settings' || id === 'favorites' || (type === 'category' && categories.some(c => c.id === id)) || (type === 'group' && (categories.some(c => c.groups && c.groups.some(g => g.id === id))));
      if (!id || !viewExists) {
        const firstValidCategory = categories.find(c => c && c.id);
        if (firstValidCategory) { setUiPrefs(prev => ({ ...prev, activeView: { type: 'category', id: firstValidCategory.id } })); }
      }
    } else if (!isInitialLoad && categories.length === 0 && uiPrefs.activeView.id !== 'settings') {
      setUiPrefs(prev => ({ ...prev, activeView: { type: 'settings', id: 'settings' } }));
    }
  }, [isInitialLoad, categories, uiPrefs.activeView]);

  const setUiPref = (key, value) => {
    setUiPrefs(prev => ({ ...prev, [key]: value }));
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileMenuOpen(prev => !prev);
    } else {
      const willCollapse = !uiPrefs.isSidebarCollapsed;
      setUiPref('isSidebarCollapsed', willCollapse);
      setUiPref('sidebarWidth', willCollapse ? 80 : 280);
      if (willCollapse) {
        setUiPref('activeCategoryDropdown', null);
      }
    }
  };

  const handleSidebarMouseEnter = () => {
    if (appSettings.sidebarAutoCollapse && uiPrefs.isSidebarCollapsed) {
      setUiPref('isSidebarCollapsed', false);
      setUiPref('sidebarWidth', 280);
    }
  };

  const handleSidebarMouseLeave = () => {
    if (appSettings.sidebarAutoCollapse && !uiPrefs.isSidebarCollapsed) {
      setUiPref('isSidebarCollapsed', true);
      setUiPref('sidebarWidth', 80);
      setUiPref('activeCategoryDropdown', null);
    }
  };

  const toggleTagFilter = (tagName) => setActiveTags(prev => new Set(prev).has(tagName) ? [...new Set(prev)].filter(t => t !== tagName) : [...new Set(prev), tagName]);
  const clearTagFilter = () => setActiveTags([]);
  const toggleEditMode = () => setEditMode(prev => !prev);
  const toggleSettings = () => setIsSettingsOpen(prev => !prev);
  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  const openModal = (type, data = null) => {
    if (type === 'confirm' && data.onConfirm) {
      const confirmAndClose = () => { data.onConfirm(); closeModal('confirm'); };
      setEditingData(prev => ({ ...prev, [type]: { ...data, onConfirm: confirmAndClose } }));
    } else {
      setEditingData(prev => ({ ...prev, [type]: data }));
    }
    setIsModalOpen(prev => ({ ...prev, [type]: true }));
  };

  const closeModal = (type) => {
    setIsModalOpen(prev => ({ ...prev, [type]: false }));
    setEditingData(prev => ({ ...prev, [type]: null }));
  };

  const { activeCategoryDropdown, sidebarWidth } = uiPrefs;

  const value = {
    uiPrefs, setUiPref,
    toggleSidebar,
    handleSidebarMouseEnter,
    handleSidebarMouseLeave,
    isMobile,
    mainContentRef,
    effectiveIsDarkMode,
    editMode, setEditMode, toggleEditMode,
    // DÜZELTME: draggingItemId kaldırıldı
    searchQuery, setSearchQuery,
    isSearchActive, setIsSearchActive,
    isMobileMenuOpen, setIsMobileMenuOpen,
    openModal, closeModal, isModalOpen, editingData,
    activeTags, toggleTagFilter, clearTagFilter,
    hoveredCategory, setHoveredCategory,
    activeCategoryDropdown,
    sidebarWidth,
    isSettingsOpen, toggleSettings, openSettings, closeSettings,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};