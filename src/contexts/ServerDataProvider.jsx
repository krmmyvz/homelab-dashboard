import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { produce } from 'immer';
import { ServerDataContext } from '@/contexts/ServerDataContext';
import { NotificationContext } from '@/contexts/NotificationContext';
import { DND_TYPES } from '@/constants/appConstants';
import { GridUtils } from '@/utils/gridUtils';

export const ServerDataProvider = ({ children, categories, setCategories, settings, setSettings }) => {
  const { addNotification } = React.useContext(NotificationContext);
  const importInputRef = useRef(null);

  // Normalize categories for UI consumers
  const normalizeCategory = (cat) => ({
    ...cat,
    title: cat.title || cat.name || cat.label || null,
    iconName: cat.iconName || cat.icon || null,
    groups: (cat.groups || []).map(g => ({ ...g, title: g.title || g.name || null })),
    servers: cat.servers || [],
    layout: cat.layout || []
  });

  const normalizedCategories = useMemo(() => (Array.isArray(categories) ? categories.map(cat => {
    const nc = normalizeCategory(cat);

    // Ensure category layout exists and contains entries for each server
    nc.layout = Array.isArray(nc.layout) ? [...nc.layout] : [];
    for (const srv of (nc.servers || [])) {
      if (!nc.layout.find(l => l.i === srv.id)) {
        const defaultSize = GridUtils.DEFAULT_ITEM_SIZE || { w: 2, h: 1 };
        const pos = GridUtils.findOptimalPosition(nc.layout, defaultSize, 12);
        nc.layout.push({ i: srv.id, x: pos.x, y: pos.y, w: defaultSize.w, h: defaultSize.h });
      }
    }
    nc.layout = GridUtils.validateAndFixLayout(nc.layout, 12);

    // Ensure groups have layout entries for their servers
    nc.groups = (nc.groups || []).map(g => {
      const ng = { ...g };
      ng.layout = Array.isArray(ng.layout) ? [...ng.layout] : [];
      for (const srv of (ng.servers || [])) {
        if (!ng.layout.find(l => l.i === srv.id)) {
          const defaultSize = GridUtils.DEFAULT_ITEM_SIZE || { w: 2, h: 1 };
          const pos = GridUtils.findOptimalPosition(ng.layout, defaultSize, 12);
          ng.layout.push({ i: srv.id, x: pos.x, y: pos.y, w: defaultSize.w, h: defaultSize.h });
        }
      }
      ng.layout = GridUtils.validateAndFixLayout(ng.layout, 12);
      return ng;
    });

    return nc;
  }) : []), [categories]);

  // API Helpers
  const api = {
    server: {
      add: async (data) => fetch('/api/servers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
      update: async (id, data) => fetch(`/api/servers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
      delete: async (id) => fetch(`/api/servers/${id}`, { method: 'DELETE' })
    },
    category: {
      add: async (data) => fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
      update: async (id, data) => fetch(`/api/categories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
      delete: async (id) => fetch(`/api/categories/${id}`, { method: 'DELETE' })
    },
    group: {
      add: async (data) => fetch('/api/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
      update: async (id, data) => fetch(`/api/groups/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
      delete: async (id) => fetch(`/api/groups/${id}`, { method: 'DELETE' })
    }
  };

  const updateItemLayout = useCallback((itemId, containerId, newLayoutProps, cols) => {
    setCategories(produce(draft => {
      let container = null;
      let isGroup = false;
      for (const category of draft) {
        if (category.id === containerId) { container = category; break; }
        const group = (category.groups || []).find(g => g.id === containerId);
        if (group) { container = group; isGroup = true; break; }
      }
      if (!container) return;

      if (!container.layout) container.layout = [];

      // Layout logic (same as before)
      if (newLayoutProps.x !== undefined && newLayoutProps.w !== undefined) {
        const movedLayout = GridUtils.moveItem(container.layout, itemId, { x: newLayoutProps.x, y: newLayoutProps.y }, cols, { allowPush: true, allowCompact: true });
        const minW = GridUtils.MIN_ITEM_SIZE?.w || 1;
        const minH = GridUtils.MIN_ITEM_SIZE?.h || 1;
        const targetW = Math.max(minW, Math.round(newLayoutProps.w || minW));
        const targetH = Math.max(minH, Math.round(newLayoutProps.h || minH));
        container.layout = GridUtils.resizeItem(movedLayout, itemId, { w: targetW, h: targetH }, cols, { allowCollision: true, allowCompact: true });
      } else if (newLayoutProps.x !== undefined) {
        container.layout = GridUtils.moveItem(container.layout, itemId, { x: newLayoutProps.x, y: newLayoutProps.y }, cols, { allowPush: true, allowCompact: true });
      } else if (newLayoutProps.w !== undefined) {
        const minW = GridUtils.MIN_ITEM_SIZE?.w || 1;
        const minH = GridUtils.MIN_ITEM_SIZE?.h || 1;
        const targetW = Math.max(minW, Math.round(newLayoutProps.w || minW));
        const targetH = Math.max(minH, Math.round(newLayoutProps.h || minH));
        container.layout = GridUtils.resizeItem(container.layout, itemId, { w: targetW, h: targetH }, cols, { allowCollision: true, allowCompact: true });
      }

      // Persist layout change
      if (isGroup) {
        api.group.update(container.id, { layout: container.layout }).catch(console.error);
      } else {
        api.category.update(container.id, { layout: container.layout }).catch(console.error);
      }
    }));
  }, [setCategories]);

  const handleLayoutScale = useCallback((containerId, oldCols, newCols) => {
    if (!containerId || !oldCols || !newCols || oldCols === newCols) return;
    setCategories(produce(draft => {
      let container = null;
      let isGroup = false;
      for (const category of draft) {
        if (category.id === containerId) { container = category; break; }
        const group = (category.groups || []).find(g => g.id === containerId);
        if (group) { container = group; isGroup = true; break; }
      }
      if (!container || !Array.isArray(container.layout)) return;

      const scale = newCols / oldCols;
      container.layout = container.layout.map(l => ({ ...l, x: Math.round((l.x || 0) * scale), w: Math.max(1, Math.round((l.w || 1) * scale)) }));

      // Persist layout change
      if (isGroup) {
        api.group.update(container.id, { layout: container.layout }).catch(console.error);
      } else {
        api.category.update(container.id, { layout: container.layout }).catch(console.error);
      }
    }));
  }, [setCategories]);

  const moveServerBetweenContainers = useCallback((serverId, fromContainerId, toContainerId) => {
    setCategories(produce(draft => {
      let fromContainer = null, toContainer = null, serverData = null, layoutItem = null;
      let toCategory = null, toGroup = null;

      // Find containers
      for (const category of draft) {
        if (category.id === fromContainerId) fromContainer = category;
        if (category.id === toContainerId) { toContainer = category; toCategory = category; }

        const fromGroup = (category.groups || []).find(g => g.id === fromContainerId);
        if (fromGroup) fromContainer = fromGroup;

        const toGroupFound = (category.groups || []).find(g => g.id === toContainerId);
        if (toGroupFound) { toContainer = toGroupFound; toGroup = toGroupFound; }
      }

      if (!fromContainer || !toContainer) return;

      // Remove from source
      if (fromContainer.servers) {
        const idx = fromContainer.servers.findIndex(s => s.id === serverId);
        if (idx !== -1) {
          serverData = fromContainer.servers.splice(idx, 1)[0];
        }
      }
      if (fromContainer.layout) {
        const lidx = fromContainer.layout.findIndex(l => l.i === serverId);
        if (lidx !== -1) {
          layoutItem = fromContainer.layout.splice(lidx, 1)[0];
        }
      }

      // Add to destination
      if (serverData) {
        if (!toContainer.servers) toContainer.servers = [];

        // Update server data references
        if (toGroup) {
          serverData.group_id = toGroup.id;
          serverData.category_id = null; // Or parent category? Usually group implies category, but let's keep it simple
        } else if (toCategory) {
          serverData.category_id = toCategory.id;
          serverData.group_id = null;
        }

        toContainer.servers.push(serverData);

        // Persist server move
        api.server.update(serverId, {
          category_id: serverData.category_id,
          group_id: serverData.group_id
        }).catch(console.error);
      }

      if (layoutItem) {
        if (!toContainer.layout) toContainer.layout = [];
        const sanitized = {
          i: layoutItem.i || serverId,
          x: typeof layoutItem.x === 'number' && Number.isFinite(layoutItem.x) ? layoutItem.x : 0,
          y: typeof layoutItem.y === 'number' && Number.isFinite(layoutItem.y) ? layoutItem.y : 0,
          w: typeof layoutItem.w === 'number' && Number.isFinite(layoutItem.w) ? Math.max(1, layoutItem.w) : 1,
          h: typeof layoutItem.h === 'number' && Number.isFinite(layoutItem.h) ? Math.max(1, layoutItem.h) : 1,
        };
        const optimalPos = GridUtils.findOptimalPosition(toContainer.layout, { w: sanitized.w, h: sanitized.h }, 12);
        toContainer.layout.push({ ...sanitized, x: optimalPos.x, y: optimalPos.y });
        toContainer.layout = GridUtils.validateAndFixLayout(toContainer.layout, 12);

        // Persist layout changes for both containers
        // Source layout update
        if (fromContainer.id) { // check if it has ID
          // Determine type
          const isFromGroup = !draft.some(c => c.id === fromContainer.id);
          if (isFromGroup) api.group.update(fromContainer.id, { layout: fromContainer.layout }).catch(console.error);
          else api.category.update(fromContainer.id, { layout: fromContainer.layout }).catch(console.error);
        }

        // Dest layout update
        if (toGroup) api.group.update(toGroup.id, { layout: toContainer.layout }).catch(console.error);
        else if (toCategory) api.category.update(toCategory.id, { layout: toContainer.layout }).catch(console.error);
      }
    }));
  }, [setCategories]);

  const addServer = useCallback((serverData, categoryId = null) => {
    // Optimistic update
    const newServerId = serverData.id || `server-${Date.now()}`;
    const newServer = {
      ...serverData,
      id: newServerId,
      status: 'pending',
      category_id: categoryId,
      group_id: null // Assuming direct add to category
    };

    setCategories(produce(draft => {
      let category = draft.find(cat => cat.id === categoryId);
      if (!category && !categoryId) {
        // Uncategorized
        category = draft.find(cat => cat.id === 'uncategorized');
        if (!category) {
          category = { id: 'uncategorized', name: 'Uncategorized', servers: [], layout: [] };
          draft.push(category);
        }
      }

      if (category) {
        if (!category.servers) category.servers = [];
        category.servers.push(newServer);

        if (!category.layout) category.layout = [];
        const maxY = GridUtils.getLayoutHeight(category.layout);
        const defaultSize = GridUtils.DEFAULT_ITEM_SIZE || { w: 2, h: 1 };
        category.layout.push({ i: newServer.id, x: 0, y: maxY, w: defaultSize.w, h: defaultSize.h });
        category.layout = GridUtils.validateAndFixLayout(category.layout, 12);

        // Persist layout
        api.category.update(category.id, { layout: category.layout }).catch(console.error);
      }
    }));

    // Persist server
    api.server.add(newServer).catch(err => {
      console.error('Failed to add server', err);
      addNotification('error', 'Failed to add server');
      // TODO: Revert optimistic update?
    });
  }, [setCategories, addNotification]);

  const updateServer = useCallback((serverId, updates) => {
    setCategories(produce(draft => {
      for (const category of draft) {
        const serverIndex = (category.servers || []).findIndex(s => s.id === serverId);
        if (serverIndex !== -1) {
          Object.assign(category.servers[serverIndex], updates);
          return;
        }
        for (const group of (category.groups || [])) {
          const groupServerIndex = (group.servers || []).findIndex(s => s.id === serverId);
          if (groupServerIndex !== -1) {
            Object.assign(group.servers[groupServerIndex], updates);
            return;
          }
        }
      }
    }));

    // Persist
    api.server.update(serverId, updates).catch(console.error);
  }, [setCategories]);

  const deleteServer = useCallback((serverId) => {
    setCategories(produce(draft => {
      for (const category of draft) {
        if (category.servers) {
          const idx = category.servers.findIndex(s => s.id === serverId);
          if (idx !== -1) {
            category.servers.splice(idx, 1);
            // Update layout
            if (category.layout) {
              const lidx = category.layout.findIndex(l => l.i === serverId);
              if (lidx !== -1) category.layout.splice(lidx, 1);
              // Persist layout
              api.category.update(category.id, { layout: category.layout }).catch(console.error);
            }
            return;
          }
        }
        for (const group of (category.groups || [])) {
          if (group.servers) {
            const idx = group.servers.findIndex(s => s.id === serverId);
            if (idx !== -1) {
              group.servers.splice(idx, 1);
              if (group.layout) {
                const lidx = group.layout.findIndex(l => l.i === serverId);
                if (lidx !== -1) group.layout.splice(lidx, 1);
                // Persist layout
                api.group.update(group.id, { layout: group.layout }).catch(console.error);
              }
              return;
            }
          }
        }
      }
    }));

    // Persist
    api.server.delete(serverId).catch(console.error);
  }, [setCategories]);

  const handleAddOrUpdate = useCallback((type, payload = {}) => {
    try {
      const typeStr = (type || '').toString().toLowerCase();
      if (typeStr === 'server') {
        if (payload.serverData) {
          const categoryId = payload.categoryKey || payload.categoryId || null;
          if (payload.serverData.id) {
            updateServer(payload.serverData.id, payload.serverData);
          } else {
            addServer(payload.serverData, categoryId);
          }
        }
      } else if (typeStr === 'group') {
        if (payload.id) {
          // Update group
          setCategories(produce(draft => {
            for (const cat of draft) {
              const grp = (cat.groups || []).find(g => g.id === payload.id);
              if (grp) {
                Object.assign(grp, payload);
                api.group.update(grp.id, payload).catch(console.error);
                return;
              }
            }
          }));
        } else if (payload.title && payload.categoryId) {
          // Add group
          const newGroupId = `group-${Date.now()}`;
          const newGroup = { id: newGroupId, title: payload.title, name: payload.title, category_id: payload.categoryId, servers: [], layout: [] };
          setCategories(produce(draft => {
            const category = draft.find(c => c.id === payload.categoryId);
            if (category) {
              if (!category.groups) category.groups = [];
              category.groups.push(newGroup);
            }
          }));
          api.group.add(newGroup).catch(console.error);
        }
      } else if (typeStr === 'category') {
        if (payload.id) {
          // Update category
          setCategories(produce(draft => {
            const cat = draft.find(c => c.id === payload.id);
            if (cat) {
              Object.assign(cat, payload);
              api.category.update(cat.id, payload).catch(console.error);
            } else {
              // Create if not exists (rare case for update)
              const newCat = { ...payload, groups: [], servers: [], layout: [] };
              draft.push(newCat);
              api.category.add(newCat).catch(console.error);
            }
          }));
        } else {
          // Add category (if id not provided but needed)
          const newId = `cat-${Date.now()}`;
          const newCat = { ...payload, id: newId, groups: [], servers: [], layout: [] };
          setCategories(produce(draft => draft.push(newCat)));
          api.category.add(newCat).catch(console.error);
        }
      }
    } catch (err) {
      console.error('handleAddOrUpdate error', err);
    }
  }, [addServer, updateServer, setCategories]);

  // Export/Import/Reset (kept mostly same, but import should probably trigger API calls too? For now leave as local + auto-save might be disabled)
  // If we disable auto-save, import needs to be smarter.
  // For now, let's assume Import is a "bulk replace" which might need a special API endpoint or just rely on the user refreshing?
  // Actually, if we disable auto-save, Import won't save to DB!
  // We should probably implement a bulk import API.

  const exportData = useCallback(() => {
    const data = { categories, settings, exportDate: new Date().toISOString(), version: '2.0.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homelab-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addNotification('success', 'Data exported successfully');
  }, [categories, settings, addNotification]);

  const importData = useCallback(async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.categories && data.settings) {
          // For now, just update local state. 
          // Ideally we should send this to a /api/import endpoint.
          // But since we don't have one, we'll just set state.
          // WARNING: This won't persist if auto-save is disabled!
          // Let's try to use the /api/data endpoint for bulk save if it supported it.
          // Since we haven't implemented bulk save for categories in backend, Import is broken for persistence.
          // I will add a TODO note.
          setCategories(data.categories);
          setSettings(data.settings);
          addNotification('warning', 'Imported data locally. Persistence not fully supported yet.');
        } else {
          addNotification('error', 'Invalid file format');
        }
      } catch {
        addNotification('error', 'Failed to import data');
      }
    };
    reader.readAsText(file);
  }, [setCategories, setSettings, addNotification]);

  const resetData = useCallback(async () => {
    try {
      const response = await fetch('/api/reset', { method: 'POST' });
      if (response.ok) window.location.reload();
      else addNotification('error', 'Failed to reset data');
    } catch {
      addNotification('error', 'Failed to reset data');
    }
  }, [addNotification]);

  const triggerImport = useCallback(() => { importInputRef.current?.click(); }, []);

  const toggleFavorite = useCallback((serverId) => {
    let newState = false;
    setCategories(produce(draft => {
      for (const category of draft) {
        const s = (category.servers || []).find(s => s.id === serverId);
        if (s) { s.isFavorite = !s.isFavorite; newState = s.isFavorite; return; }
        for (const group of (category.groups || [])) {
          const gs = (group.servers || []).find(s => s.id === serverId);
          if (gs) { gs.isFavorite = !gs.isFavorite; newState = gs.isFavorite; return; }
        }
      }
    }));
    api.server.update(serverId, { isFavorite: newState }).catch(console.error);
  }, [setCategories]);

  const value = useMemo(() => ({
    categories: normalizedCategories,
    updateItemLayout,
    handleLayoutScale,
    moveServerBetweenContainers,
    addServer,
    updateServer,
    deleteServer,
    handleAddOrUpdate,
    toggleFavorite,
    exportData,
    importData,
    resetData,
    triggerImport,
    importInputRef,
    DND_TYPES
  }), [normalizedCategories, updateItemLayout, handleLayoutScale, moveServerBetweenContainers, addServer, updateServer, deleteServer, handleAddOrUpdate, toggleFavorite, exportData, importData, resetData, triggerImport]);

  return (
    <ServerDataContext.Provider value={value}>
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importData(file);
        }}
      />
      {children}
    </ServerDataContext.Provider>
  );
};
