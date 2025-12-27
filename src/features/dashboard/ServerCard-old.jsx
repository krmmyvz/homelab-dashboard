import React, { useContext, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Server, X, Edit, Star } from 'lucide-react';
import { UIContext } from '@/contexts/UIContext';
import { ServerDataContext } from '@/contexts/ServerDataContext';
import { SettingsContext } from '@/contexts/SettingsContext';
import { iconComponents } from '@/utils/constants';
import { DND_TYPES } from '@/constants/appConstants';
import styles from './ServerCard.module.css';

const tagsContainerVariants = {
  rest: { opacity: 0, transition: { when: "afterChildren", staggerChildren: 0.02, staggerDirection: -1 } },
  hover: { opacity: 1, transition: { when: "beforeChildren", staggerChildren: 0.03 } },
};

const tagVariants = {
  rest: { y: 10, opacity: 0 },
  hover: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 600, damping: 25 } },
};

const ServerCard = React.memo(({ server, isInteracting, dragHandleRef }) => {
  const { appSettings } = useContext(SettingsContext);
  const { editMode, openModal } = useContext(UIContext);
  const { handleDelete, toggleFavorite } = useContext(ServerDataContext);
  
  // Memoize icon component to prevent re-lookups
  const Icon = useMemo(() => iconComponents[server.icon] || Server, [server.icon]);
  
  // Memoize displayed tags to prevent re-slicing
  const displayTags = useMemo(() => 
    (server.tags || []).slice(0, 3), 
    [server.tags]
  );

  const handleActionClick = useCallback((e, action) => {
    e.stopPropagation();
    if (action) action();
  }, []);

  const onDelete = useCallback(() => {
    openModal('confirm', { 
      title: 'Öğeyi Sil', 
      message: `"${server.name}" öğesini silmek istediğinizden emin misiniz?`, 
      confirmText: 'Evet, Sil', 
      onConfirm: () => handleDelete(DND_TYPES.SERVER, { serverId: server.id }) 
    });
  }, [openModal, server.name, server.id, handleDelete]);

  const onEdit = useCallback(() => {
    openModal('server', { server });
  }, [openModal, server]);

  const onToggleFavorite = useCallback(() => {
    toggleFavorite(server.id);
  }, [toggleFavorite, server.id]);

  const handleCardClick = useCallback(() => {
    if (editMode) return;
    const target = appSettings.linkBehavior === 'newTab' ? '_blank' : '_self';
    window.open(server.url, target, 'noopener,noreferrer');
  }, [editMode, server.url, appSettings.linkBehavior]);

  // Optimized mouse move handler with requestAnimationFrame
  const handleMouseMove = useCallback((e) => {
    if (editMode) return;
    
    requestAnimationFrame(() => {
      if (e.currentTarget) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
        e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
      }
    });
  }, [editMode]);

  // Memoize motion props to prevent re-creation
  const motionProps = useMemo(() => ({
    className: styles.card,
    onClick: handleCardClick,
    onMouseMove: handleMouseMove,
    initial: "rest",
    whileHover: !isInteracting ? "hover" : "rest",
    animate: "rest"
  }), [handleCardClick, handleMouseMove, isInteracting]);

  return (
    <motion.div {...motionProps}>
      {editMode && (
        <div className={styles.editControls}>
          <motion.button 
            className={`${styles.actionButton} ${server.isFavorite ? styles.isFavorite : ''}`} 
            onClick={(e) => handleActionClick(e, onToggleFavorite)} 
            whileTap={{ scale: 0.9 }} 
            aria-label={server.isFavorite ? "Favorilerden kaldır" : "Favorilere ekle"}
          >
            <Star size={11} />
          </motion.button>
          <motion.button 
            className={styles.actionButton} 
            onClick={(e) => handleActionClick(e, onEdit)} 
            whileTap={{ scale: 0.9 }} 
            aria-label="Düzenle"
          >
            <Edit size={11} />
          </motion.button>
          <motion.button 
            className={`${styles.actionButton} ${styles.deleteBtn}`} 
            onClick={(e) => handleActionClick(e, onDelete)} 
            whileTap={{ scale: 0.9 }} 
            aria-label="Sil"
          >
            <X size={11} />
          </motion.button>
        </div>
      )}
      
      <div ref={dragHandleRef} className={styles.header}>
        <div className={styles.iconWrapper} aria-hidden="true">
          <Icon size={18} />
        </div>
        <div 
          className={`${styles.statusIndicator} ${styles[server.status]}`}
          aria-label={`Durum: ${server.status}`}
        />
      </div>
      
      <h3 className={styles.title}>{server.name}</h3>
      
      {appSettings.showCardDescriptions && server.description && (
        <p className={styles.description}>{server.description}</p>
      )}
      
      <div className={styles.footer}>
        {displayTags.length > 0 && (
          <motion.div 
            className={styles.tagsContainer} 
            variants={tagsContainerVariants}
            role="list"
            aria-label="Etiketler"
          >
            {displayTags.map(tag => (
              <motion.span 
                key={tag} 
                className={styles.tagBadge} 
                variants={tagVariants}
                role="listitem"
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

// Add display name for better debugging
ServerCard.displayName = 'ServerCard';

export default ServerCard;