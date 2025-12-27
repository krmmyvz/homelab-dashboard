import React, { useContext, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Server, Star, Edit, Trash2, Activity, Wifi, WifiOff } from 'lucide-react';
import { UIContext } from '@/contexts/UIContext';
import { ServerDataContext } from '@/contexts/ServerDataContext';
import { SettingsContext } from '@/contexts/SettingsContext';
import { iconComponents } from '@/utils/constants';
import { DND_TYPES } from '@/constants/appConstants';
import { motion as motionTokens } from '@/theme/tokens/motion';
import styles from './ServerCard.module.css';

/**
 * Enhanced Server Widget Card
 * Rich information display with metrics, charts, and beautiful Material Design 3 styling
 * Perfect for homelab server monitoring
 */
const ServerCard = React.memo(({ server }) => {
  const { appSettings } = useContext(SettingsContext);
  const { editMode, openModal } = useContext(UIContext);
  const { handleDelete, toggleFavorite } = useContext(ServerDataContext);

  // Icon lookup with fallback
  const Icon = useMemo(() => iconComponents[server.icon] || Server, [server.icon]);

  // Status-based styling and icons
  const statusConfig = useMemo(() => {
    switch (server.status) {
      case 'online':
        return {
          className: styles.statusOnline,
          icon: Wifi,
          color: 'var(--status-online)',
          label: 'Çevrimiçi'
        };
      case 'offline':
        return {
          className: styles.statusOffline,
          icon: WifiOff,
          color: 'var(--status-offline)',
          label: 'Çevrimdışı'
        };
      case 'pending':
        return {
          className: styles.statusPending,
          icon: Activity,
          color: 'var(--status-pending)',
          label: 'Kontrol Ediliyor'
        };
      default:
        return {
          className: styles.statusUnknown,
          icon: Server,
          color: 'var(--color-outline)',
          label: 'Bilinmiyor'
        };
    }
  }, [server.status]);

  // Single metric: response time from server data if available
  const responseTime = useMemo(() =>
    server.responseTime || null,
    [server.responseTime]
  );

  // Event handlers
  const handleCardClick = useCallback(() => {
    if (editMode) return;
    const target = appSettings.linkBehavior === 'newTab' ? '_blank' : '_self';
    window.open(server.url, target, 'noopener,noreferrer');
  }, [editMode, server.url, appSettings.linkBehavior]);

  const handleCardKeyDown = useCallback((e) => {
    if (editMode) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  }, [editMode, handleCardClick]);

  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    openModal('server', { server });
  }, [openModal, server]);

  const handleToggleFavorite = useCallback((e) => {
    e.stopPropagation();
    toggleFavorite(server.id);
  }, [toggleFavorite, server.id]);

  const handleDeleteClick = useCallback((e) => {
    e.stopPropagation();
    openModal('confirm', {
      title: 'Sunucuyu Sil',
      message: `"${server.name}" sunucusunu silmek istediğinizden emin misiniz?`,
      confirmText: 'Sil',
      onConfirm: () => handleDelete(DND_TYPES.SERVER, { serverId: server.id })
    });
  }, [openModal, server.name, server.id, handleDelete]);

  return (
    <motion.div
      className={`${styles.widget} ${editMode ? styles.editMode : ''}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      tabIndex={!editMode ? 0 : -1}
      role="button"
      aria-label={`${server.name} - ${statusConfig.label} - ${responseTime}ms response time`}
      layout
      transition={motionTokens.expressive.defaultSpatial}
    >
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.iconContainer}>
          <Icon size={20} strokeWidth={2} />
          {server.isFavorite && (
            <div className={styles.favoriteBadge}>
              <Star size={10} fill="currentColor" />
            </div>
          )}
        </div>

        {/* Response Time Badge - Top Right, left of status */}
        {appSettings.showCardMetrics !== false && responseTime && (
          <div className={styles.responseTimeBadge}>
            <Activity size={12} />
            <span>{responseTime}ms</span>
          </div>
        )}

        {/* Status Indicator - Top Right */}
        {appSettings.showCardStatus !== false && (
          <div className={`${styles.statusIndicator} ${statusConfig.className}`}>
            <statusConfig.icon size={12} />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        <h3 className={styles.title}>{server.name}</h3>

        {/* Description - Conditional */}
        {appSettings.showCardDescriptions && server.description && (
          <p className={styles.description}>{server.description}</p>
        )}

        {/* URL - Conditional */}
        {appSettings.showCardUrls && server.url && (
          <p className={styles.url}>{new URL(server.url).hostname}</p>
        )}
      </div>

      {/* Tags - Conditional */}
      {appSettings.showCardTags !== false && server.tags && server.tags.length > 0 && (
        <div className={styles.tagsContainer}>
          {server.tags.slice(0, 3).map((tag, index) => (
            <motion.span
              key={tag}
              className={styles.tag}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.1,
                ...motionTokens.expressive.fastEffects
              }}
            >
              {tag}
            </motion.span>
          ))}
        </div>
      )}

      {/* Edit Mode Actions */}
      {editMode && (
        <motion.div
          className={styles.actions}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={motionTokens.expressive.fastEffects}
        >
          <button
            onClick={handleToggleFavorite}
            className={`${styles.actionBtn} ${server.isFavorite ? styles.favorite : ''}`}
            aria-label="Favori"
          >
            <Star size={14} fill={server.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleEdit}
            className={styles.actionBtn}
            aria-label="Düzenle"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={handleDeleteClick}
            className={`${styles.actionBtn} ${styles.delete}`}
            aria-label="Sil"
          >
            <Trash2 size={14} />
          </button>
        </motion.div>
      )}

    </motion.div>
  );
});

ServerCard.displayName = 'ServerCard';

export default ServerCard;
