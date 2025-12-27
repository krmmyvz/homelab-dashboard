// --- src/services/statusMonitor.js ---
// Real StatusMonitor implementation using ProtocolCheckers

import MetricsCollector from './metricsCollector.js';
import AlertManager from './alertManager.js';
import ProtocolCheckers from './protocolCheckers.js';

class StatusMonitor {
  constructor(config = {}) {
    this.config = config;
    this.checkInterval = 30000; // 30 seconds
    this.serverStatuses = new Map();
    this.metricsCollector = new MetricsCollector();
    this.alertManager = new AlertManager();
    this.protocolCheckers = new ProtocolCheckers();
    this.monitoringInterval = null;
    this.clients = new Set();

    // Initialize server statuses from config
    (config.servers || []).forEach((s) => {
      this.serverStatuses.set(s.id, {
        status: s.status ?? 'pending',
        responseTime: 0,
        timestamp: null,
      });
    });
  }

  cleanup() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  getServerStatus(serverId) {
    return this.serverStatuses.get(serverId) || null;
  }

  startMonitoring(intervalMs) {
    const period = intervalMs || this.checkInterval || 30000;
    if (this.monitoringInterval) return; // already running

    console.log(`🔄 Starting StatusMonitor (interval: ${period}ms)`);

    // immediate first pass
    this.updateAllServerStatuses().catch(err => console.error('Initial check failed:', err));

    this.monitoringInterval = setInterval(() => {
      this.updateAllServerStatuses().catch(err => console.error('Periodic check failed:', err));
    }, period);
  }

  stop() {
    this.cleanup();
  }

  getAllServerStatuses() {
    const out = {};
    for (const [id, status] of this.serverStatuses.entries()) {
      out[id] = { ...status };
    }
    return out;
  }

  updateServerStatus(serverId, data) {
    const prev = this.serverStatuses.get(serverId) || { status: 'pending' };
    const next = {
      ...prev,
      ...data,
      timestamp: data.timestamp || new Date(),
      responseTime: data.responseTime ?? prev.responseTime ?? 0,
    };
    this.serverStatuses.set(serverId, next);

    // Record metrics
    this.metricsCollector.recordCheck(serverId, {
      status: next.status,
      responseTime: next.responseTime || 0,
      timestamp: next.timestamp,
    });

    // Trigger alert on status change
    if (prev.status !== next.status && prev.status !== 'pending') {
      const severity = (next.status === 'offline' || next.status === 'error') ? 'error' : 'info';
      this.alertManager.sendAlert({
        type: 'status_change',
        severity,
        serviceId: serverId,
        message: `Status changed: ${prev.status} -> ${next.status}`,
      });
    }
  }

  getServerMetrics(serverId) {
    return this.metricsCollector.getServiceMetrics(serverId);
  }

  async pingServer(serverId) {
    const server = (this.config.servers || []).find((s) => s.id === serverId);
    if (!server) {
      return {
        status: 'error',
        error: 'Server not found',
        responseTime: 0,
        timestamp: new Date(),
      };
    }

    try {
      // Use ProtocolCheckers to check the service
      const result = await this.protocolCheckers.checkService({
        id: server.id,
        url: server.url,
        protocol: server.protocol || 'http', // Default to http if not specified
        timeout: 5000
      });

      return result;
    } catch (error) {
      return {
        status: 'offline',
        responseTime: 0,
        timestamp: new Date(),
        error: error.message
      };
    }
  }

  async forceCheckServer(serverId) {
    const result = await this.pingServer(serverId);
    this.updateServerStatus(serverId, result);
    return result;
  }

  async updateAllServerStatuses(_force = false) {
    const servers = this.config.servers || [];
    const results = {};

    // Process in parallel
    const promises = servers.map(async (s) => {
      const r = await this.pingServer(s.id);
      this.updateServerStatus(s.id, r);
      results[s.id] = r;
    });

    await Promise.all(promises);
    return results;
  }

  getMonitoringStats() {
    const all = Array.from(this.serverStatuses.values());
    const total = all.length;
    const online = all.filter((s) => s.status === 'online').length;
    const offline = all.filter((s) => s.status === 'offline').length;
    const pending = all.filter((s) => s.status === 'pending').length;
    const lastCheck = all.reduce((acc, s) => (s.timestamp > acc ? s.timestamp : acc), null);

    return {
      totalServers: total,
      onlineServers: online,
      offlineServers: offline,
      pendingServers: pending,
      lastCheck,
      uptime: process.uptime(),
    };
  }

  exportMonitoringData(format = 'json', timeframe = '24h') {
    const data = {
      serverStatuses: this.getAllServerStatuses(),
      metricsOverview: this.metricsCollector.getServicesOverview(timeframe),
      alerts: this.alertManager.getRecentAlerts(24),
    };
    if (format === 'csv') {
      return this.metricsCollector.exportToCsv(data);
    }
    return data;
  }
}

export default StatusMonitor;
