import React, { useContext, useState, useEffect } from 'react';
import { SettingsContext } from '@/contexts/SettingsContext';
import { UIContext } from '@/contexts/UIContext';
import { ThemeContext } from '@/theme/ThemeContext';
import SidebarContent from './components/SidebarContent';
import styles from './Sidebar.module.css';

// Resizer for vertical sidebars
const ResizeHandle = ({ onResize, onResizeStop, position }) => {
  const handleMouseDown = (startEvent) => {
    startEvent.preventDefault();
    const startX = startEvent.clientX;
    const startWidth = startEvent.target.parentElement.offsetWidth;

    const handleMouseMove = (moveEvent) => {
      const delta = position === 'right'
        ? startX - moveEvent.clientX  // Reverse for right sidebar
        : moveEvent.clientX - startX;
      const newWidth = startWidth + delta;
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (onResizeStop) {
        onResizeStop();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return <div className={styles.resizeHandle} data-position={position} onMouseDown={handleMouseDown} />;
};

const Sidebar = ({ position = 'left', mode = 'fixed' }) => {
  const { appSettings } = useContext(SettingsContext);
  const { uiPrefs, setUiPref, isMobile, handleSidebarMouseEnter, handleSidebarMouseLeave } = useContext(UIContext);
  const themePalette = useContext(ThemeContext);
  const { isSidebarCollapsed, sidebarWidth } = uiPrefs;

  const [isResizing, setIsResizing] = useState(false);
  const [localWidth, setLocalWidth] = useState(sidebarWidth);
  const [isHovered, setIsHovered] = useState(false);

  const sidebarSettings = appSettings.sidebar || {};
  const collapsedWidth = sidebarSettings.collapsedWidth || 60;
  const behavior = sidebarSettings.behavior || 'always-visible';
  const isMiniMode = mode === 'mini';

  // Position-based settings - hide certain UI elements for top/bottom sidebars
  const isVertical = position === 'left' || position === 'right';
  const isHorizontal = position === 'top' || position === 'bottom';

  useEffect(() => {
    if (!isResizing) {
      setLocalWidth(sidebarWidth);
    }
  }, [sidebarWidth, isResizing]);

  const onResize = (newWidth) => {
    const clampedWidth = Math.max(collapsedWidth, Math.min(newWidth, 500));
    setLocalWidth(clampedWidth);
    setIsResizing(true);
  };

  const onResizeStop = () => {
    setIsResizing(false);
    setUiPref('sidebarWidth', localWidth);
    // Auto collapse logic
    if (localWidth < 120) {
      if (!isSidebarCollapsed) setUiPref('isSidebarCollapsed', true);
    } else {
      if (isSidebarCollapsed) setUiPref('isSidebarCollapsed', false);
    }
  };

  // Auto-hide behavior
  useEffect(() => {
    if (behavior === 'auto-hide' && !isMobile) {
      const delay = sidebarSettings.autoHideDelay || 3000;
      let timeout;

      if (!isHovered) {
        timeout = setTimeout(() => {
          setUiPref('isSidebarCollapsed', true);
        }, delay);
      } else {
        setUiPref('isSidebarCollapsed', false);
      }

      return () => clearTimeout(timeout);
    }
  }, [behavior, isHovered, isMobile, sidebarSettings.autoHideDelay, setUiPref]);

  // Hover expand behavior
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (behavior === 'hover-expand' || isMiniMode) {
      handleSidebarMouseEnter();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (behavior === 'hover-expand' || isMiniMode) {
      handleSidebarMouseLeave();
    }
  };

  const sidebarOpacity = (appSettings.sidebarOpacity ?? 100) / 100;

  let sidebarStyle = {};
  if (sidebarOpacity === 1) {
    sidebarStyle.backgroundColor = 'var(--color-surface)';
    sidebarStyle.backdropFilter = 'none';
  } else {
    sidebarStyle.backgroundColor = `rgba(var(--color-surface-rgb), ${sidebarOpacity})`;
    sidebarStyle.backdropFilter = `blur(${appSettings.wallpaperSettings?.blur ?? 0}px)`;
  }

  if (isMobile) return null;

  // Calculate effective width
  const effectiveWidth = (isSidebarCollapsed || isMiniMode) ? collapsedWidth : localWidth;

  return (
    <div
      className={`${styles.sidebarContainer} ${isSidebarCollapsed ? 'is-collapsed' : ''} ${isHovered ? 'is-hovered' : ''}`}
      data-position={position}
      data-mode={mode}
      data-density={sidebarSettings.density || 'comfortable'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: `${effectiveWidth}px`,
        transition: isResizing ? 'none' : `width ${isHovered ? '0.2s' : '0.3s'} ${isHovered ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'ease-out'}`,
        [position]: 0 // Position from left or right
      }}
    >
      <aside
        id="sidebar-content"
        className={styles.sidebar}
        style={{
          ...sidebarStyle,
          [position === 'left' ? 'borderRight' : position === 'right' ? 'borderLeft' : position === 'top' ? 'borderBottom' : 'borderTop']: `1px solid rgba(var(--color-outline-rgb), ${sidebarOpacity})`,
          transition: isResizing ? 'none' : 'background-color 0.2s ease-out, border-color 0.2s ease-out, backdrop-filter 0.2s ease-out'
        }}
        role="navigation"
        aria-label="Ana navigasyon"
        data-position={position}
      >
        <SidebarContent position={position} isVertical={isVertical} isHorizontal={isHorizontal} />
      </aside>
      {/* Resize handle - only for fixed mode and not mini */}
      {mode === 'fixed' && !isMiniMode && !isSidebarCollapsed && (
        <ResizeHandle onResize={onResize} onResizeStop={onResizeStop} position={position} />
      )}
    </div>
  );
};

export default Sidebar;