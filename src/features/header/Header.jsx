import React, { useContext, useCallback, useMemo, useState, useRef } from 'react';
import { Search, Server, Plus, Settings, FolderPlus, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UIContext } from '@/contexts/UIContext';
import { SettingsContext } from '@/contexts/SettingsContext';
import { ServerDataContext } from '@/contexts/ServerDataContext';
import { ThemeContext } from '@/theme/ThemeContext';
import { useScrollTracker } from '@/hooks/useScrollTracker';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { searchEngines, MODAL_TYPES } from '@/constants/appConstants';
import { motionTokens } from '@/theme/tokens/motion';
import styles from './Header.module.css';

const Avatar = React.memo(({ customLogoUrl }) => {
  if (customLogoUrl) {
    return <img src={customLogoUrl} alt="Custom Logo" className={styles.avatar} />;
  }
  return (
    <div className={styles.avatarPlaceholder}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor" />
      </svg>
    </div>
  );
});

Avatar.displayName = 'Avatar';

const Header = () => {
  const { appSettings } = useContext(SettingsContext);
  const { categories } = useContext(ServerDataContext);
  const { searchQuery, setSearchQuery, isSearchActive, setIsSearchActive, mainContentRef, openModal, openSettings } = useContext(UIContext);
  const themePalette = useContext(ThemeContext);
  const [searchResults, setSearchResults] = useState([]);
  const [isAddMenuOpen, setAddMenuOpen] = useState(false);
  const addButtonRef = useRef(null);

  const isScrolled = useScrollTracker(mainContentRef, 10);
  const settings = appSettings?.header || {};
  const headerOpacity = (appSettings.headerOpacity ?? 100) / 100;

  // Close search on Escape
  useEscapeKey(() => {
    if (isSearchActive) {
      setIsSearchActive(false);
      setSearchQuery('');
    }
  }, isSearchActive);

  // Get all servers for search
  const allServers = useMemo(() => {
    if (!categories) return [];
    const servers = [];
    categories.forEach(category => {
      if (category.groups) {
        category.groups.forEach(group => {
          if (group.servers) {
            servers.push(...group.servers.map(s => ({ ...s, categoryName: category.title, groupName: group.title })));
          }
        });
      }
    });
    return servers;
  }, [categories]);

  const headerStyle = useMemo(() => {
    const style = {};

    if (headerOpacity === 1) {
      style.backgroundColor = 'var(--color-surface)';
      style.backdropFilter = 'none';
    } else {
      style.backgroundColor = `rgba(var(--color-surface-rgb), ${headerOpacity})`;
      style.backdropFilter = `blur(${appSettings.wallpaperSettings?.blur ?? 0}px)`;
    }

    return style;
  }, [headerOpacity, appSettings.wallpaperSettings?.blur]);

  // Memoize event handlers
  const handleSearchActivate = useCallback(() => {
    setIsSearchActive(true);
  }, [setIsSearchActive]);

  const handleSearchDeactivate = useCallback(() => {
    setIsSearchActive(false);
    setSearchQuery('');
    setSearchResults([]);
  }, [setIsSearchActive, setSearchQuery]);

  const handleSearchInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim() === '') {
      setSearchResults([]);
      return;
    }

    // Fuzzy search - search in name, description, tags, url
    const query = value.toLowerCase();
    const filtered = allServers.filter(server =>
      server.name.toLowerCase().includes(query) ||
      server.description?.toLowerCase().includes(query) ||
      server.url?.toLowerCase().includes(query) ||
      server.tags?.some(tag => tag.toLowerCase().includes(query))
    ).slice(0, 5); // Limit to 5 results

    setSearchResults(filtered);
  }, [setSearchQuery, allServers]);

  const handleServerClick = useCallback((server) => {
    const target = appSettings.linkBehavior === 'newTab' ? '_blank' : '_self';
    window.open(server.url, target, 'noopener,noreferrer');
    handleSearchDeactivate();
  }, [appSettings.linkBehavior, handleSearchDeactivate]);

  const handleSearch = useCallback((event) => {
    if (event.key === 'Enter' && searchQuery.trim() !== '') {
      // If no results, do external search
      if (searchResults.length === 0) {
        let searchUrl;
        if (settings.searchEngine === 'custom' && settings.customSearchUrl) {
          searchUrl = `${settings.customSearchUrl}${encodeURIComponent(searchQuery)}`;
        } else {
          const baseUrl = searchEngines[settings.searchEngine] || searchEngines.google;
          searchUrl = `${baseUrl}${encodeURIComponent(searchQuery)}`;
        }
        window.open(searchUrl, '_blank', 'noopener,noreferrer');
        handleSearchDeactivate();
      } else {
        // Open first result
        handleServerClick(searchResults[0]);
      }
    }
  }, [searchQuery, settings.searchEngine, settings.customSearchUrl, searchResults, handleSearchDeactivate, handleServerClick]);

  const handleOverlayClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  // Add menu handlers
  const handleAddClick = useCallback((type) => {
    if (typeof type === 'string') {
      openModal(type);
      setAddMenuOpen(false);
    }
  }, [openModal]);

  const handleSettingsClick = useCallback(() => {
    openSettings();
  }, [openSettings]);

  // Close add menu on escape
  useEscapeKey(() => {
    if (isAddMenuOpen) {
      setAddMenuOpen(false);
    }
  }, isAddMenuOpen);

  return (
    <>
      <header
        className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}
        style={headerStyle}
      >
        <div className={styles.headerContent}>
          <div className={styles.leftControls}>
            {(settings.showTitle || settings.showSubtitle) && (
              <div className={styles.headerTitleContainer}>
                {settings.showTitle && (
                  <h1 className={styles.headerTitle}>{settings.titleText || 'My Homelab'}</h1>
                )}
                {settings.showSubtitle && (
                  <span className={styles.headerSubtitle}>{settings.subtitleText || 'Dashboard'}</span>
                )}
              </div>
            )}
          </div>
          <div className={styles.centerControls}>
            <motion.button
              className={styles.searchPill}
              onClick={handleSearchActivate}
              whileTap={{ scale: 0.98 }}
            >
              <Search size={18} />
              <span className={styles.searchPillText}>Ara...</span>
            </motion.button>
          </div>
          <div className={styles.rightControls}>
            {/* Add Menu */}
            <div className={styles.addMenuContainer}>
              <AnimatePresence>
                {isAddMenuOpen && (
                  <motion.div
                    className={styles.addPopupMenu}
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{
                      duration: 0.2,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                  >
                    <button onClick={() => handleAddClick(MODAL_TYPES.SERVER)}>
                      <Server size={16} />
                      <span>Yeni Sunucu</span>
                    </button>
                    <button onClick={() => handleAddClick(MODAL_TYPES.GROUP)}>
                      <FolderPlus size={16} />
                      <span>Yeni Grup</span>
                    </button>
                    <button onClick={() => handleAddClick(MODAL_TYPES.CATEGORY)}>
                      <LayoutGrid size={16} />
                      <span>Yeni Kategori</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button
                ref={addButtonRef}
                onClick={() => setAddMenuOpen(prev => !prev)}
                className={styles.headerButton}
                title="Yeni Ekle"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus size={20} />
              </motion.button>
            </div>

            {/* Settings Button */}
            <motion.button
              onClick={handleSettingsClick}
              className={styles.headerButton}
              title="Ayarlar"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings size={20} />
            </motion.button>

            {settings.showLogo && <Avatar customLogoUrl={settings.customLogo} />}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isSearchActive && (
          <motion.div
            className={styles.searchOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSearchDeactivate}
          >
            <motion.div
              className={styles.searchContainer}
              initial={{ y: -20, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -20, scale: 0.98 }}
              transition={motionTokens.springs.defaultSpatial}
              onClick={handleOverlayClick}
            >
              <div className={styles.searchBarContainer}>
                <Search className={styles.searchBarIcon} size={20} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Sunucu ara..."
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onKeyDown={handleSearch}
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <motion.div
                  className={styles.searchResults}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {searchResults.map((server) => (
                    <motion.button
                      key={server.id}
                      className={styles.searchResultItem}
                      onClick={() => handleServerClick(server)}
                      whileHover={{ backgroundColor: 'var(--color-surfaceVariant)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={styles.resultIcon}>
                        <Server size={20} />
                      </div>
                      <div className={styles.resultInfo}>
                        <div className={styles.resultName}>{server.name}</div>
                        <div className={styles.resultMeta}>
                          {server.categoryName} → {server.groupName}
                        </div>
                      </div>
                      <div className={`${styles.statusDot} ${styles[server.status]}`} />
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {/* No Results */}
              {searchQuery && searchResults.length === 0 && (
                <motion.div
                  className={styles.noResults}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p>Sonuç bulunamadı</p>
                  <span>Enter'a basarak web'de ara</span>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default React.memo(Header);