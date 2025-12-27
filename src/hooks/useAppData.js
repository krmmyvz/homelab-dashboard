import { useState, useEffect, useRef, useCallback } from 'react';
import { websocketManager } from '@/utils/websocket';

export const useAppData = () => {
  // State management
  const [settings, setSettings] = useState({});
  const [categories, setCategories] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [saveError, setSaveError] = useState(null);
  const saveTimeoutRef = useRef(null);

  // WebSocket status update handler
  const handleStatusUpdate = useCallback((statusUpdates) => {
    setCategories(currentCategories => {
      if (!currentCategories || !statusUpdates) return currentCategories;

      // Clone categories for immutable update
      const newCategories = structuredClone(currentCategories);
      let hasChanged = false;

      // Update server statuses efficiently
      newCategories.forEach(cat => {
        // Update category servers
        (cat.servers || []).forEach(server => {
          if (statusUpdates[server.id] && server.status !== statusUpdates[server.id]) {
            server.status = statusUpdates[server.id];
            hasChanged = true;
            console.log(`📊 Updated ${server.name}: ${statusUpdates[server.id]}`);
          }
        });

        // Update group servers
        (cat.groups || []).forEach(group => {
          (group.servers || []).forEach(server => {
            if (statusUpdates[server.id] && server.status !== statusUpdates[server.id]) {
              server.status = statusUpdates[server.id];
              hasChanged = true;
              console.log(`📊 Updated ${server.name}: ${statusUpdates[server.id]}`);
            }
          });
        });
      });

      return hasChanged ? newCategories : currentCategories;
    });
  }, []);

  // Fallback HTTP status fetch (for initial load and WebSocket failures)
  const fetchStatuses = useCallback(async () => {
    try {
      const response = await fetch('/api/statuses');
      if (!response.ok) throw new Error('Network response was not ok');
      const statuses = await response.json();
      handleStatusUpdate(statuses);
    } catch (error) {
      console.error('❌ HTTP status fetch failed:', error);
    }
  }, [handleStatusUpdate]);

  const fetchInitialData = useCallback(async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Network response was not ok');
      const serverData = await response.json();
      if (serverData) {
        // Accept responses that contain settings and/or categories independently.
        if (serverData.settings) {
          setSettings(serverData.settings);
        } else {
          console.info('[useAppData] API response missing settings; keeping existing settings');
        }

        if (serverData.categories && Array.isArray(serverData.categories) && serverData.categories.length > 0) {
          // Normalize categories/groups to the UI-expected shape
          const normalizedCategories = (serverData.categories || []).map(cat => ({
            ...cat,
            title: cat.title || cat.name || cat.label || null,
            iconName: cat.iconName || cat.icon || null,
            groups: (cat.groups || []).map(g => ({ ...g, title: g.title || g.name || null })),
            servers: cat.servers || [],
            layout: cat.layout || []
          }));

          // Validate & coerce categories to avoid JSON shape mismatches
          const validated = validateAndNormalizeCategories(normalizedCategories);

          // Set categories from API
          setCategories(validated);
          console.info('[useAppData] Loaded categories from API, count =', (validated || []).length);

          // Fetch initial statuses only when we actually have categories
          await fetchStatuses();
        } else {
          console.warn('[useAppData] API response does not contain categories');
          // Set empty categories array if API returns nothing
          setCategories([]);
        }
      }

      // Helper: validate categories array and fill missing required fields
      function validateAndNormalizeCategories(catArray) {
        if (!Array.isArray(catArray)) return [];
        return catArray.map((cat, idx) => {
          const fixedCat = { ...cat };
          if (!fixedCat.id) {
            fixedCat.id = `cat-${Date.now()}-${idx}`;
            console.warn('[useAppData] category missing id, generated:', fixedCat.id, fixedCat);
          }
          if (!fixedCat.title) {
            fixedCat.title = fixedCat.name || `Kategori ${fixedCat.id}`;
            console.warn('[useAppData] category missing title, using fallback:', fixedCat.title, fixedCat);
          }
          if (!Array.isArray(fixedCat.groups)) fixedCat.groups = [];
          fixedCat.groups = fixedCat.groups.map((g, gidx) => {
            const ng = { ...g };
            if (!ng.id) { ng.id = `grp-${fixedCat.id}-${gidx}`; console.warn('[useAppData] group missing id, generated:', ng.id, ng); }
            if (!ng.title) ng.title = ng.name || `Grup ${ng.id}`;
            if (!Array.isArray(ng.servers)) ng.servers = [];
            return ng;
          });
          if (!Array.isArray(fixedCat.servers)) fixedCat.servers = [];
          fixedCat.servers = fixedCat.servers.map((s, sidx) => ({ id: s.id || `srv-${fixedCat.id}-${sidx}`, name: s.name || s.title || `Sunucu ${sidx}`, ...s }));
          if (!Array.isArray(fixedCat.layout)) fixedCat.layout = [];
          return fixedCat;
        });
      }
    } catch (error) {
      console.error('❌ Initial data fetch failed:', error);
      // Set empty defaults if fetch fails
      setCategories([]);
    } finally {
      setIsInitialLoad(false);
    }
  }, [fetchStatuses]);

  // WebSocket event handlers
  useEffect(() => {
    const handleConnect = () => {
      setConnectionStatus('connected');
      console.log('✅ WebSocket connected - real-time updates active');

      // Request initial status when connected
      websocketManager.send('request_status', {});
    };

    const handleDisconnect = () => {
      setConnectionStatus('disconnected');
      console.log('🔌 WebSocket disconnected - falling back to HTTP polling');
    };

    const handleError = (error) => {
      setConnectionStatus('error');
      console.error('❌ WebSocket error:', error);
    };

    // Register WebSocket event listeners
    websocketManager.on('connected', handleConnect);
    websocketManager.on('disconnected', handleDisconnect);
    websocketManager.on('error', handleError);
    websocketManager.on('status_update', handleStatusUpdate);

    // Cleanup function
    return () => {
      websocketManager.off('connected', handleConnect);
      websocketManager.off('disconnected', handleDisconnect);
      websocketManager.off('error', handleError);
      websocketManager.off('status_update', handleStatusUpdate);
    };
  }, [handleStatusUpdate]);

  // Initial data load
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Fallback HTTP polling when WebSocket is not available
  useEffect(() => {
    let intervalId;

    const refreshInterval = settings?.pingInterval;

    // Only use HTTP polling if WebSocket is not connected and interval is set
    if (connectionStatus !== 'connected' && refreshInterval && refreshInterval > 0) {
      console.log(`🔄 Starting HTTP polling fallback (${refreshInterval}ms)`);
      intervalId = setInterval(fetchStatuses, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [settings?.pingInterval, connectionStatus, fetchStatuses]);

  // Auto-save settings changes (Categories are now saved granularly via ServerDataProvider)
  useEffect(() => {
    if (isInitialLoad) {
      return;
    }

    clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      const saveData = async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
          const response = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings }),
          });
          if (!response.ok) throw new Error('Failed to save settings');
          // Success
          setSaveError(null);
        } catch (error) {
          console.error('❌ Data save failed:', error);
          setSaveError(error.message);
        } finally {
          setIsSaving(false);
        }
      };
      saveData();
    }, 1000);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [settings, isInitialLoad]);

  // Manual server ping function
  const pingServer = (serverId) => {
    if (connectionStatus === 'connected') {
      websocketManager.send('ping_server', { serverId });
    } else {
      fetchStatuses(); // Fallback to HTTP
    }
  };

  // Manual retry for settings save
  const retrySave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (!response.ok) throw new Error('Failed to save settings');
    } catch (error) {
      console.error('❌ Manual retry save failed:', error);
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    settings,
    setSettings,
    categories,
    setCategories,
    isInitialLoad,
    isSaving,
    saveError,
    connectionStatus,
    pingServer,
    retrySave
  };
};