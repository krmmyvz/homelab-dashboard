import React, { useContext, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { SettingsContext } from '@/contexts/SettingsContext';
import { UIContext } from '@/contexts/UIContext';
import { useWindowSize } from '@/hooks/useWindowSize';
import '@/App.css';
import Header from '@/features/header/Header';
import Sidebar from '@/features/sidebar/Sidebar';
import HorizontalSidebar from '@/features/sidebar/HorizontalSidebar';
import MainContent from '@/features/serverDisplay/MainContent';
import { ToastContainer } from '@/features/notifications/components/Toast';
import ModalManager from '@/features/modals/ModalManager';
import SettingsSheet from '@/features/settings/SettingsSheet';
import SidebarSkeleton from '@/components/Skeletons/SidebarSkeleton';
import MainContentSkeleton from '@/components/Skeletons/MainContentSkeleton';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';

function App() {
  const { isInitialLoad, appSettings } = useContext(SettingsContext);
  const { isMobileMenuOpen, toggleMobileMenu, effectiveIsDarkMode, editMode, isSettingsOpen, closeSettings, isMobile, setUiPref } = useContext(UIContext);
  const { width } = useWindowSize();

  // Determine effective sidebar configuration based on settings and viewport
  const sidebarConfig = useMemo(() => {
    if (!appSettings?.sidebar) {
      return { position: 'left', mode: 'fixed', isHorizontal: false, isOverlay: false };
    }

    const sidebarSettings = appSettings.sidebar;
    let position = sidebarSettings.position || 'left';
    let mode = sidebarSettings.mode || 'fixed';

    // Auto position logic (Using centralized breakpoints)
    const mdBreakpoint = 768; // Based on breakpoint-md
    const lgBreakpoint = 1024; // Based on breakpoint-lg

    if (position === 'auto') {
      if (width < mdBreakpoint) {
        // Mobile: horizontal at top
        position = 'top';
        mode = 'fixed';
      } else if (width < lgBreakpoint) {
        // Tablet: overlay on left
        position = 'left';
        mode = 'overlay';
      } else {
        // Desktop: fixed on left
        position = 'left';
        mode = 'fixed';
      }
    }

    // Force horizontal mode to fixed (no overlay for horizontal)
    if (position === 'top' || position === 'bottom') {
      mode = 'fixed';
    }

    const isHorizontal = position === 'top' || position === 'bottom';
    const isOverlay = mode === 'overlay';

    return { position, mode, isHorizontal, isOverlay };
  }, [appSettings?.sidebar, width]);

  useEffect(() => {
    if (appSettings?.customWallpaper) {
      document.body.classList.add('has-custom-wallpaper-body');
    } else {
      document.body.classList.remove('has-custom-wallpaper-body');
    }
  }, [appSettings?.customWallpaper]);

  // Glass morphism CSS değişkenlerini ayarla
  useEffect(() => {
    if (appSettings?.cardOpacity !== undefined) {
      document.documentElement.style.setProperty('--card-opacity', appSettings.cardOpacity / 100);
    }
    if (appSettings?.cardBlur !== undefined) {
      document.documentElement.style.setProperty('--card-blur', `${appSettings.cardBlur}px`);
    }
  }, [appSettings?.cardOpacity, appSettings?.cardBlur]);

  if (isInitialLoad) {
    const loadingTheme = effectiveIsDarkMode ? 'theme-dark' : 'theme-light';
    return (
      <div className={`dashboard ${loadingTheme}`}>
        {/* Skip navigation for keyboard users */}
        <a href="#main-content" className="skip-link">
          Ana içeriğe geç
        </a>

        <ErrorBoundary>
          <Header />
        </ErrorBoundary>
        <div className="dashboard-body">
          <ErrorBoundary>
            <SidebarSkeleton />
          </ErrorBoundary>
          <div className="main-view-wrapper">
            <ErrorBoundary>
              <MainContentSkeleton />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    );
  }

  const mainContainerClasses = `
    dashboard 
    ${effectiveIsDarkMode ? 'theme-dark' : 'theme-light'} 
    ${appSettings.customWallpaper ? 'has-custom-wallpaper' : ''} 
    ${isMobileMenuOpen ? 'mobile-menu-open' : ''}
    ${!appSettings.animations ? 'animations-disabled' : ''}
    ${editMode ? 'edit-mode' : ''}
    sidebar-${sidebarConfig.position}
    sidebar-mode-${sidebarConfig.mode}
  `;
  const wallpaperStyle = {
    backgroundImage: `url(${appSettings.customWallpaper})`,
    filter: `blur(${appSettings.wallpaperSettings?.blur || 0}px) brightness(${appSettings.wallpaperSettings?.brightness || 100}%)`
  };

  // Arka plan deseni stilini oluştur
  const getBackgroundPatternStyle = () => {
    const pattern = appSettings.backgroundPattern || 'none';
    if (pattern === 'none') return {};

    const patternColor = 'var(--color-on-surface)';
    const patterns = {
      dots: {
        background: `radial-gradient(circle, ${patternColor} 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
      },
      grid: {
        background: `
          linear-gradient(${patternColor} 1px, transparent 1px),
          linear-gradient(90deg, ${patternColor} 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
      },
      diagonal: {
        background: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${patternColor} 10px, ${patternColor} 11px)`,
      },
      waves: {
        background: `
          radial-gradient(ellipse at 50% 0%, ${patternColor} 0%, transparent 50%),
          radial-gradient(ellipse at 50% 100%, ${patternColor} 0%, transparent 50%)
        `,
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0, 20px 20px',
      },
      hexagon: {
        background: `
          linear-gradient(60deg, transparent 33.33%, ${patternColor} 33.33%, ${patternColor} 66.66%, transparent 66.66%),
          linear-gradient(-60deg, transparent 33.33%, ${patternColor} 33.33%, ${patternColor} 66.66%, transparent 66.66%)
        `,
        backgroundSize: '50px 87px',
      },
      zigzag: {
        background: `
          linear-gradient(135deg, transparent 25%, ${patternColor} 25%),
          linear-gradient(225deg, transparent 25%, ${patternColor} 25%),
          linear-gradient(45deg, transparent 75%, ${patternColor} 75%),
          linear-gradient(315deg, transparent 75%, ${patternColor} 75%)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 0, 10px -10px, 0px 10px',
      },
      crosses: {
        background: `
          linear-gradient(transparent 0%, transparent 40%, ${patternColor} 40%, ${patternColor} 60%, transparent 60%, transparent 100%),
          linear-gradient(90deg, transparent 0%, transparent 40%, ${patternColor} 40%, ${patternColor} 60%, transparent 60%, transparent 100%)
        `,
        backgroundSize: '20px 20px',
      },
    };

    return patterns[pattern] || {};
  };

  return (
    <ErrorBoundary>
      <DndProvider backend={HTML5Backend}>
        {/* Skip navigation for keyboard users */}
        <a href="#main-content" className="skip-link">
          Ana içeriğe geç
        </a>

        {appSettings.customWallpaper && <div className="wallpaper-bg" style={wallpaperStyle}></div>}

        {/* Arka plan deseni */}
        {appSettings.backgroundPattern && appSettings.backgroundPattern !== 'none' && (
          <div
            className="background-pattern"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 0,
              pointerEvents: 'none',
              opacity: 0.05,
              ...getBackgroundPatternStyle()
            }}
          />
        )}

        {/* Centralized modal management */}
        <ErrorBoundary>
          <ModalManager />
        </ErrorBoundary>
        <ErrorBoundary><ToastContainer /></ErrorBoundary>

        <motion.div
          className={mainContainerClasses.trim()}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            ease: [0.34, 1.56, 0.64, 1]
          }}
        >
          {/* Header always at top */}
          <ErrorBoundary>
            <Header />
          </ErrorBoundary>

          <div className="dashboard-body">
            {/* Horizontal sidebar for top/bottom positions */}
            {sidebarConfig.isHorizontal && (
              <ErrorBoundary>
                <HorizontalSidebar />
              </ErrorBoundary>
            )}

            {/* Vertical sidebar for left/right positions */}
            {!sidebarConfig.isHorizontal && (
              <ErrorBoundary>
                <Sidebar position={sidebarConfig.position} mode={sidebarConfig.mode} />
              </ErrorBoundary>
            )}

            <div className="main-view-wrapper">
              <ErrorBoundary>
                <MainContent />
              </ErrorBoundary>
            </div>
          </div>

          {/* Overlay backdrop for overlay mode */}
          {sidebarConfig.isOverlay && !isMobile && (
            <div
              className="sidebar-overlay-backdrop"
              onClick={() => setUiPref('isSidebarCollapsed', true)}
            />
          )}
        </motion.div>
        {isMobileMenuOpen && <div className="mobile-overlay" onClick={toggleMobileMenu}></div>}

        {/* Settings Sheet */}
        <ErrorBoundary>
          <SettingsSheet isOpen={isSettingsOpen} onClose={closeSettings} />
        </ErrorBoundary>
      </DndProvider>
    </ErrorBoundary>
  );
}

export default App;