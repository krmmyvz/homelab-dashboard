import React, { useContext, useMemo, useCallback } from 'react';
import { Edit3, Tag, Server } from 'lucide-react';
import EmptyState from '@/components/EmptyState/EmptyState';
import { ServerDataContext } from '@/contexts/ServerDataContext';
import { GridUtils } from '@/utils/gridUtils';
import { UIContext } from '@/contexts/UIContext';
import styles from './MainContent.module.css';
import { MODAL_TYPES, VIEW_TYPES } from '@/constants/appConstants';
import Group from '@/features/dashboard/Group';
import Button from '@/components/Button/Button';

const LoadingIndicator = React.memo(() => (
  <div className={styles.loadingContainer} role="status" aria-label="Yükleniyor">
    <div className={styles.loadingSpinner} aria-hidden="true"></div>
    <span className="sr-only">İçerik yükleniyor...</span>
  </div>
));

LoadingIndicator.displayName = 'LoadingIndicator';

const MainContent = () => {
  const { categories, handleLayoutScale } = useContext(ServerDataContext);
  const {
    uiPrefs, openModal, editMode, toggleEditMode, activeTags, mainContentRef
  } = useContext(UIContext);

  const { activeView } = uiPrefs;
  const { type: viewType, id: viewId } = activeView;

  const { ungroupedItems, groupsToDisplay, viewTitle, viewSubtitle, activeContainer } = useMemo(() => {
    let container = null;
    let title = 'Dashboard';
    let subtitle = 'Tüm servisleriniz';
    let ungroupedItems = [];
    let groupsToDisplay = [];

    if (viewType === VIEW_TYPES.FAVORITES) {
      // Favoriler görünümü: tüm kategorilerdeki favori sunucuları topla
      title = 'Favoriler';
      subtitle = 'Favori olarak işaretlediğiniz servisler';
      const favoriteServers = [];

      categories.forEach(cat => {
        // Kategori seviyesindeki favori sunucular
        (cat.servers || []).forEach(server => {
          if (server.isFavorite) {
            favoriteServers.push(server);
          }
        });

        // Grup içindeki favori sunucular
        (cat.groups || []).forEach(group => {
          (group.servers || []).forEach(server => {
            if (server.isFavorite) {
              favoriteServers.push(server);
            }
          });
        });
      });

      // Favori sunucuları grid item'larına çevir
      ungroupedItems = favoriteServers.map((server, index) => ({
        i: server.id,
        x: (index % 6) * 2, // 6 kolon varsayılan
        y: Math.floor(index / 6) * 2,
        w: 2,
        h: 2,
        server: server,
        containerId: 'favorites',
      }));
    } else if (viewType === VIEW_TYPES.CATEGORY) {
      container = categories.find(c => c.id === viewId);
      if (container) {
        title = container.title;
        // Grupsuz öğeleri ayır
        const containerHeight = GridUtils.getLayoutHeight(container.layout || []);
        ungroupedItems = (container.servers || []).map(server => {
          const layoutItem = (container.layout || []).find(l => l.i === server.id);
          return {
            i: server.id,
            x: layoutItem?.x ?? 0, y: layoutItem?.y ?? containerHeight,
            w: layoutItem?.w ?? 2, h: layoutItem?.h ?? 2,
            server: server, containerId: container.id,
          };
        });
        // Grupları ve içindeki öğeleri ayır
        groupsToDisplay = (container.groups || []).map(group => {
          const groupHeight = GridUtils.getLayoutHeight(group.layout || []);
          const groupItems = (group.servers || []).map(server => {
            const layoutItem = (group.layout || []).find(l => l.i === server.id);
            return {
              i: server.id,
              x: layoutItem?.x ?? 0, y: layoutItem?.y ?? groupHeight,
              w: layoutItem?.w ?? 2, h: layoutItem?.h ?? 2,
              server: server, containerId: group.id,
            };
          });
          return { ...group, items: groupItems };
        });
      }
    } else if (viewType === VIEW_TYPES.GROUP) {
      // Grup görünümü: sadece seçili grubun kartlarını göster
      for (const cat of categories) {
        const group = (cat.groups || []).find(g => g.id === viewId);
        if (group) {
          container = group;
          title = group.title;
          subtitle = cat.title + ' / ' + group.title;
          const groupHeight = GridUtils.getLayoutHeight(group.layout || []);
          ungroupedItems = (group.servers || []).map(server => {
            const layoutItem = (group.layout || []).find(l => l.i === server.id);
            return {
              i: server.id,
              x: layoutItem?.x ?? 0, y: layoutItem?.y ?? groupHeight,
              w: layoutItem?.w ?? 2, h: layoutItem?.h ?? 2,
              server: server, containerId: group.id,
            };
          });
          break;
        }
      }
    }
    return { ungroupedItems, groupsToDisplay, viewTitle: title, viewSubtitle: subtitle, activeContainer: container };
  }, [categories, viewType, viewId]);

  const onScale = useCallback((containerId, oldCols, newCols) => {
    if (containerId) {
      handleLayoutScale(containerId, oldCols, newCols);
    }
  }, [handleLayoutScale]);

  const renderCurrentView = () => {
    const hasContent = ungroupedItems.length > 0 || groupsToDisplay.length > 0;
    if (!hasContent) {
      return <EmptyState icon={Server} title="Henüz Öğe Yok" message="Bu bölümde görüntülenecek bir öğe bulunmuyor." actionText="Yeni Öğe Ekle" onActionClick={() => openModal(MODAL_TYPES.SERVER)} />;
    }

    return (
      <div className={styles.categoryContentLayout}>
        {/* Grupsuz öğeler için bir Group bileşeni render et */}
        {/* Edit mode'da veya grupsuz öğe varsa göster */}
        {(ungroupedItems.length > 0 || (editMode && viewType === VIEW_TYPES.CATEGORY)) && (
          <Group
            group={activeContainer || { id: viewId || 'default', title: viewTitle }}
            categoryId={activeContainer?.id || viewId || 'default'}
            items={ungroupedItems}
            isUngrouped={true}
            onScale={(oldCols, newCols) => onScale(activeContainer?.id || viewId || 'default', oldCols, newCols)}
          />
        )}
        {/* Her bir grup için ayrı bir Group bileşeni render et */}
        {groupsToDisplay.map(group => (
          <Group
            key={group.id}
            group={group}
            categoryId={activeContainer?.id || viewId || 'default'}
            items={group.items}
            onScale={(oldCols, newCols) => onScale(group.id, oldCols, newCols)}
          />
        ))}
      </div>
    );
  };

  return (
    <main className={styles.mainContent + (editMode ? ' ' + styles.editModeActive : '')} ref={mainContentRef}>
      <header className={styles.mainHeader}>
        <div className={styles.headerTextContent}>
          <h1 className={styles.mainTitle}>{viewTitle}</h1>
          <div className={styles.mainSubtitle}>{viewSubtitle}</div>
        </div>
        <div className={styles.controlsWrapper}>
          {/* Düzenleme Modu Butonu */}
          {/* Düzenleme Modu Butonu */}
          <Button
            variant={editMode ? 'primary' : 'secondary'}
            icon={<Edit3 size={20} />}
            onClick={toggleEditMode}
            aria-pressed={editMode}
            title={editMode ? 'Düzenleme modunu kapat' : 'Düzenleme modunu aç'}
          >
            {editMode ? 'Düzenleme Açık' : 'Düzenle'}
          </Button>
        </div>
      </header>
      {editMode && (
        <div className={styles.editModeBanner}>
          <span>🛠️ Düzenleme Modu Aktif - Kartları sürükleyip bırakabilir, düzenleyebilirsiniz.</span>
        </div>
      )}
      <div className={styles.mainContentBody}>
        {renderCurrentView()}
      </div>
    </main>
  );
};

export default React.memo(MainContent);