import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import StatusMonitor from '../src/services/statusMonitor.js';
import MetricsCollector from '../src/services/metricsCollector.js';
import AlertManager from '../src/services/alertManager.js';

describe('StatusMonitor', () => {
  let statusMonitor;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      servers: [
        {
          id: 'test-server-1',
          name: 'Test Server 1',
          url: 'http://localhost:3000',
          status: 'pending'
        }
      ],
      categories: [],
      groups: []
    };

    statusMonitor = new StatusMonitor(mockConfig);
  });

  afterEach(() => {
    if (statusMonitor) {
      statusMonitor.cleanup();
    }
  });

  describe('initialization', () => {
    it('should initialize with config', () => {
      expect(statusMonitor.config).toEqual(mockConfig);
      expect(statusMonitor.serverStatuses).toBeDefined();
      expect(statusMonitor.metricsCollector).toBeInstanceOf(MetricsCollector);
      expect(statusMonitor.alertManager).toBeInstanceOf(AlertManager);
    });

    it('should have default interval of 30 seconds', () => {
      expect(statusMonitor.checkInterval).toBe(30000);
    });
  });

  describe('server checking', () => {
    it('should check server status', async () => {
      const result = await statusMonitor.pingServer('test-server-1');
      
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('responseTime');
      expect(result).toHaveProperty('timestamp');
      expect(['online', 'offline', 'error']).toContain(result.status);
    });

    it('should handle invalid server ID', async () => {
      const result = await statusMonitor.pingServer('invalid-server');
      
      expect(result.status).toBe('error');
      expect(result.error).toBe('Server not found');
    });

    it('should update server status', () => {
      const initialStatus = statusMonitor.getServerStatus('test-server-1');
      expect(initialStatus.status).toBe('pending');

      statusMonitor.updateServerStatus('test-server-1', {
        status: 'online',
        responseTime: 100,
        timestamp: new Date()
      });

      const updatedStatus = statusMonitor.getServerStatus('test-server-1');
      expect(updatedStatus.status).toBe('online');
      expect(updatedStatus.responseTime).toBe(100);
    });
  });

  describe('metrics collection', () => {
    it('should collect metrics when status changes', () => {
      const recordCheckSpy = vi.spyOn(statusMonitor.metricsCollector, 'recordCheck');
      
      statusMonitor.updateServerStatus('test-server-1', {
        status: 'online',
        responseTime: 150,
        timestamp: new Date()
      });

      expect(recordCheckSpy).toHaveBeenCalledWith('test-server-1', expect.objectContaining({
        status: 'online',
        responseTime: 150
      }));
    });

    it('should get server metrics', () => {
      // Add some test metrics
      statusMonitor.metricsCollector.recordCheck('test-server-1', {
        status: 'online',
        responseTime: 100,
        timestamp: new Date()
      });

      const metrics = statusMonitor.getServerMetrics('test-server-1');
      expect(metrics).toHaveProperty('serviceId', 'test-server-1');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('averageResponseTime');
    });
  });

  describe('alert management', () => {
    it('should trigger alert on status change', () => {
      const sendAlertSpy = vi.spyOn(statusMonitor.alertManager, 'sendAlert');
      
      statusMonitor.updateServerStatus('test-server-1', {
        status: 'offline',
        error: 'Connection timeout',
        timestamp: new Date()
      });

      expect(sendAlertSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'status_change',
        severity: 'error',
        serviceId: 'test-server-1'
      }));
    });

    it('should not trigger alert for same status', () => {
      const sendAlertSpy = vi.spyOn(statusMonitor.alertManager, 'sendAlert');
      
      // Set initial status
      statusMonitor.updateServerStatus('test-server-1', {
        status: 'online',
        timestamp: new Date()
      });

      sendAlertSpy.mockClear();

      // Same status again
      statusMonitor.updateServerStatus('test-server-1', {
        status: 'online',
        timestamp: new Date()
      });

      expect(sendAlertSpy).not.toHaveBeenCalled();
    });
  });

  describe('monitoring stats', () => {
    it('should provide monitoring statistics', () => {
      const stats = statusMonitor.getMonitoringStats();
      
      expect(stats).toHaveProperty('totalServers');
      expect(stats).toHaveProperty('onlineServers');
      expect(stats).toHaveProperty('offlineServers');
      expect(stats).toHaveProperty('pendingServers');
      expect(stats).toHaveProperty('lastCheck');
      expect(stats).toHaveProperty('uptime');
    });

    it('should calculate correct server counts', () => {
      statusMonitor.updateServerStatus('test-server-1', {
        status: 'online',
        timestamp: new Date()
      });

      const stats = statusMonitor.getMonitoringStats();
      expect(stats.totalServers).toBe(1);
      expect(stats.onlineServers).toBe(1);
      expect(stats.offlineServers).toBe(0);
    });
  });
});

describe('MetricsCollector', () => {
  let metricsCollector;

  beforeEach(() => {
    metricsCollector = new MetricsCollector();
  });

  describe('metric recording', () => {
    it('should record service check', () => {
      metricsCollector.recordCheck('test-service', {
        status: 'online',
        responseTime: 200,
        timestamp: new Date()
      });

      const metrics = metricsCollector.getServiceMetrics('test-service');
      expect(metrics.serviceId).toBe('test-service');
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should calculate uptime correctly', () => {
      // Record multiple checks
      metricsCollector.recordCheck('test-service', {
        status: 'online',
        responseTime: 100,
        timestamp: new Date()
      });

      metricsCollector.recordCheck('test-service', {
        status: 'online',
        responseTime: 150,
        timestamp: new Date()
      });

      const metrics = metricsCollector.getServiceMetrics('test-service');
      expect(metrics.uptime).toBe(100);
    });

    it('should calculate average response time', () => {
      metricsCollector.recordCheck('test-service', {
        status: 'online',
        responseTime: 100,
        timestamp: new Date()
      });

      metricsCollector.recordCheck('test-service', {
        status: 'online',
        responseTime: 200,
        timestamp: new Date()
      });

      const metrics = metricsCollector.getServiceMetrics('test-service');
      expect(metrics.averageResponseTime).toBe(150);
    });
  });

  describe('system health', () => {
    it('should record system health', () => {
      metricsCollector.recordSystemHealth({
        totalServices: 5,
        onlineServices: 4,
        healthScore: 80,
        timestamp: new Date()
      });

      const health = metricsCollector.getSystemHealth();
      expect(health.currentHealth).toBe(80);
      expect(health.totalServices).toBe(5);
      expect(health.onlineServices).toBe(4);
    });

    it('should provide default health when no data', () => {
      const health = metricsCollector.getSystemHealth();
      expect(health.currentHealth).toBe(100);
      expect(health.status).toBe('healthy');
    });
  });
});

describe('AlertManager', () => {
  let alertManager;

  beforeEach(() => {
    alertManager = new AlertManager();
  });

  describe('alert sending', () => {
    it('should send alert', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await alertManager.sendAlert({
        type: 'status_change',
        severity: 'error',
        serviceId: 'test-service',
        message: 'Service is down'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔔 Alert:'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should not send duplicate alerts', async () => {
      const alert = {
        type: 'status_change',
        severity: 'error',
        serviceId: 'test-service',
        message: 'Service is down'
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await alertManager.sendAlert(alert);
      await alertManager.sendAlert(alert); // Same alert

      // Should only log once due to deduplication
      expect(consoleSpy).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });
  });

  describe('recent alerts', () => {
    it('should get recent alerts', () => {
      // Add some alerts to history
      alertManager.alertHistory.push({
        id: 'alert1',
        timestamp: new Date(),
        type: 'status_change',
        severity: 'error'
      });

      const alerts = alertManager.getRecentAlerts(24);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toBe('alert1');
    });

    it('should filter alerts by time range', () => {
      const oldAlert = {
        id: 'old-alert',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
        type: 'status_change',
        severity: 'error'
      };

      const recentAlert = {
        id: 'recent-alert',
        timestamp: new Date(),
        type: 'status_change',
        severity: 'warning'
      };

      alertManager.alertHistory.push(oldAlert, recentAlert);

      const alerts = alertManager.getRecentAlerts(24); // Last 24 hours
      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toBe('recent-alert');
    });
  });
});
