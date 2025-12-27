import React, { useContext, useState, useMemo } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, X, Server, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { UIContext } from '@/contexts/UIContext';
import { ServerDataContext } from '@/contexts/ServerDataContext';
import { MODAL_TYPES, DND_TYPES } from '@/constants/appConstants';
import DashboardGrid from '@/features/dashboard/DashboardGrid';
import GridCell from '@/features/dashboard/GridCell';
import ServerCard from '@/features/dashboard/ServerCard';
import EmptyState from '@/components/EmptyState/EmptyState';
import Button from '@/components/Button/Button';
import { motion as motionTokens } from '@/theme/tokens/motion';
import styles from './Group.module.css';

const Group = ({
  group,
  categoryId,
  items,
  isUngrouped = false,
  onScale,
  isCollapsed: externalCollapsed,
  onToggleCollapse
}) => {
  const { openModal, editMode } = useContext(UIContext);
  const { handleDelete } = useContext(ServerDataContext);
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Use external collapse state if provided, otherwise internal
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  const onEditGroup = (e) => {
    e.stopPropagation();
    openModal(MODAL_TYPES.GROUP, { group: { ...group, categoryId }, categoryId });
  };

  const onDeleteGroup = (e) => {
    e.stopPropagation();
    openModal(MODAL_TYPES.CONFIRM, {
      title: 'Grubu Sil',
      message: `"${group.title}" grubunu silmek istediğinizden emin misiniz? İçindeki sunucular 'Gruplanmamış' alanına taşınacaktır.`,
      confirmText: 'Evet, Sil',
      onConfirm: () => handleDelete(DND_TYPES.GROUP, { categoryId, groupId: group.id })
    });
  };

  // DND: Grup sürüklenebilir yapma
  const [{ isDragging }, dragRef, previewRef] = useDrag({
    type: 'GROUP',
    item: { groupId: group.id, categoryId },
    canDrag: editMode && !isUngrouped,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // DND: Drop target - Hem SERVER_CARD hem de GROUP kabul et
  const { moveServerBetweenContainers } = useContext(ServerDataContext);
  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: ['SERVER_CARD', 'GROUP'],
    canDrop: (dragged, monitor) => {
      if (!editMode) return false;

      const itemType = monitor.getItemType();

      // SERVER_CARD için
      if (itemType === 'SERVER_CARD') {
        return dragged.containerId !== group.id;
      }

      // GROUP için - farklı gruplara sürüklenebilir (yeniden sıralama için)
      if (itemType === 'GROUP') {
        return dragged.groupId !== group.id && dragged.categoryId === categoryId;
      }

      return false;
    },
    drop: (dragged, monitor) => {
      const itemType = monitor.getItemType();

      if (itemType === 'SERVER_CARD' && dragged.containerId !== group.id) {
        moveServerBetweenContainers(dragged.id, dragged.containerId, group.id);
      }

      // GROUP drop logic burada eklenebilir (grup sıralaması için)
      if (itemType === 'GROUP' && dragged.groupId !== group.id) {
        // TODO: Implement group reordering
        console.log('Group reordering:', dragged.groupId, 'dropped on', group.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Stats for the group header
  const groupStats = useMemo(() => {
    const total = items.length;
    const online = items.filter(item => item.server?.status === 'online').length;
    const offline = total - online;
    return { total, online, offline };
  }, [items]);

  return (
    <motion.div
      className={`${styles.groupContainer} ${isOver && canDrop ? styles.isDropTarget : ''} ${isDragging ? styles.isDragging : ''}`}
      ref={(node) => {
        dropRef(node);
        if (editMode && !isUngrouped && previewRef) previewRef(node);
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={motionTokens.expressive.defaultSpatial}
    >
      <motion.header
        className={styles.groupHeader}
        onClick={!editMode ? toggleCollapse : undefined}
        onKeyDown={(e) => {
          if (!editMode && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            toggleCollapse();
          }
        }}
        style={{ cursor: !editMode ? 'pointer' : 'default' }}
        role="button"
        tabIndex={!editMode && !isUngrouped ? 0 : -1}
        aria-expanded={!isCollapsed}
        aria-label={`${isUngrouped ? 'Gruplanmamış' : group.title} grubu ${isCollapsed ? 'genişlet' : 'daralt'}`}
      >
        {/* Collapse Toggle */}
        {!isUngrouped && (
          <motion.div
            className={styles.collapseToggle}
            animate={{ rotate: isCollapsed ? 0 : 90 }}
            transition={motionTokens.standard.fast}
          >
            <ChevronRight size={20} />
          </motion.div>
        )}

        {/* Drag Handle */}
        {editMode && !isUngrouped && (
          <div
            ref={dragRef}
            className={styles.dragHandle}
            aria-label="Grubu sürükle"
          >
            <GripVertical size={20} />
          </div>
        )}

        {/* Group Info */}
        <div className={styles.groupInfo}>
          <h3 className={styles.groupTitle}>
            {isUngrouped ? 'Gruplanmamış' : group.title}
          </h3>
          <div className={styles.groupStats}>
            <span className={styles.statItem}>
              <span className={`${styles.statusDot} ${styles.online}`} />
              {groupStats.online}
            </span>
            <span className={styles.statItem}>
              <span className={`${styles.statusDot} ${styles.offline}`} />
              {groupStats.offline}
            </span>
            <span className={styles.totalCount}>
              Toplam: {groupStats.total}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {editMode && !isUngrouped && (
          <div className={styles.headerActionButtons}>
            <Button
              variant="ghost"
              size="small"
              iconOnly
              icon={<Edit3 size={16} />}
              onClick={onEditGroup}
              ariaLabel="Grubu düzenle"
            />
            <Button
              variant="ghost"
              size="small"
              iconOnly
              icon={<X size={16} />}
              onClick={onDeleteGroup}
              ariaLabel="Grubu sil"
              className={styles.deleteButton}
            />
          </div>
        )}
      </motion.header>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            className={styles.groupContent}
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: 'auto',
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
            transition={motionTokens.expressive.defaultSpatial}
          >
            {items.length === 0 ? (
              <div className={styles.emptyGroupContainer}>
                <EmptyState
                  icon={Server}
                  title={isUngrouped ? (editMode ? "Buraya sunucu sürükleyin" : "Gruplanmamış sunucu yok") : "Grup boş"}
                  message={isUngrouped
                    ? (editMode ? "Gruplardan çıkarmak istediğiniz sunucuları buraya sürükleyin." : "Tüm sunucular gruplara atanmış.")
                    : (editMode ? "Buraya sunucu sürükleyebilirsiniz." : "Bu gruba henüz sunucu eklenmedi.")
                  }
                  actionText={editMode ? null : "Sunucu Ekle"}
                  onActionClick={editMode ? null : () => openModal(MODAL_TYPES.SERVER)}
                />
              </div>
            ) : (
              <DashboardGrid onScale={onScale}>
                {items.map(item => (
                  <GridCell key={item.i} item={item}>
                    <ServerCard server={item.server} />
                  </GridCell>
                ))}
              </DashboardGrid>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default React.memo(Group);