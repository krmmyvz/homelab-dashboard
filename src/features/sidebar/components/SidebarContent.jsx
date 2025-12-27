import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { ServerDataContext } from '@/contexts/ServerDataContext';
import { UIContext } from '@/contexts/UIContext';
import AnimatedMenuIcon from '@/components/AnimatedMenuIcon/AnimatedMenuIcon';
import SidebarCategory from './SidebarCategory';
import styles from '../Sidebar.module.css';
import { VIEW_TYPES } from '@/constants/appConstants';

const SidebarContent = ({ position: _position = 'left', isVertical = true, isHorizontal = false }) => {
  const { categories } = useContext(ServerDataContext);
  const { uiPrefs, toggleSidebar } = useContext(UIContext);
  const { isSidebarCollapsed } = uiPrefs;
  
  // For horizontal sidebars (top/bottom), hide settings and add buttons
  const showFullUI = isVertical;

  return (
    <>
      {showFullUI && (
        <motion.div
          className={styles.header}
          layout="position" 
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <button onClick={toggleSidebar} className={styles.menuButton} aria-label="Kenar çubuğunu aç/kapat">
            <AnimatedMenuIcon isOpen={!isSidebarCollapsed} />
          </button>
        </motion.div>
      )}
      <div className={styles.menu} role="menu" aria-label="Navigasyon menüsü" data-horizontal={isHorizontal}>
        <SidebarCategory type={VIEW_TYPES.FAVORITES} item={{ id: 'favorites', title: 'Favoriler', iconName: 'Star' }} />
        <div className={styles.divider} />
        {(categories || []).map((category) => (
          <SidebarCategory key={category.id} category={category} type={VIEW_TYPES.CATEGORY} />
        ))}
      </div>
    </>
  );
};

export default React.memo(SidebarContent);