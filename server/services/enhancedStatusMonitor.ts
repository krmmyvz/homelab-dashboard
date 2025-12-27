/**
 * Enhanced Status Monitor for Homelab Dashboard Phase 2
 * Integrates all advanced monitoring services for comprehensive system oversight
 */

import ProtocolCheckers from './protocolCheckers.js';
import AlertManager from './alertManager.js';
import MetricsCollector from './metricsCollector.js';
import CacheManager from './cacheManager.js';
import AnalyticsEngine from './analyticsEngine.js';

class EnhancedStatusMonitor {
  constructor(config = {}) {
    this.config = config;
    this.serverStatuses = new Map();
    this.checkInterval = config.checkInterval || 30000; // 30 seconds
    this.intervalId = null;
    this.isRunning = false;
    this.lastCheck = null;
    this.startTime = Date.now();
    this.wsClients = new Set();

    // Initialize enhanced services
    this.protocolCheckers = new ProtocolCheckers();
    this.alertManager = new AlertManager();
    this.metricsCollector = new MetricsCollector();
    this.cacheManager = new CacheManager();
    this.analyticsEngine = new AnalyticsEngine();

    this.initializeServerStatuses();
  }

  /**
   * Initialize enhanced monitoring system
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Enhanced Monitoring System...');

      // Initialize database
      const dbResult = await this.databaseManager.initialize();
      console.log(`📊 Database: ${dbResult.provider} (${dbResult.status})`);

      // Initialize cache
      const cacheResult = await this.cacheManager.initialize();
      console.log(`🟥 Cache: ${cacheResult.provider} (${cacheResult.status})`);

      // Initialize analytics
      await this.analyticsEngine.initialize();
      console.log('📈 Analytics Engine: initialized');

      // Load server configurations from database if available
      await this.loadServerConfigurations();

      console.log('✅ Enhanced monitoring system fully initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize enhanced monitoring:', error);
      return false;
    }
  }

  /**
   * Load server configurations from database
   */
  async loadServerConfigurations() {
    try {
      if (this.databaseManager.isConnected) {
        // Load servers from database
        const servers = await this.databaseManager.query('SELECT * FROM servers ORDER BY name');
        if (servers.length > 0) {
          console.log(`📋 Loaded ${servers.length} servers from database`);
          // Update config with database servers
          this.config.servers = servers;
          this.initializeServerStatuses();
        }
      }
    } catch {
      console.log('📁 Using configuration file servers');
    }
  }

  /**
   * Initialize server statuses
   */
  initializeServerStatuses() {
    if (this.config.servers) {
      this.config.servers.forEach(server => {
        this.serverStatuses.set(server.id, {
          ...server,
          status: 'pending',
          lastCheck: null,
          responseTime: null,
          consecutiveFailures: 0,
          uptime: 0,
          lastStatusChange: new Date(),
          metadata: {}
        });
      });
    }
  }

  /**
   * Start enhanced monitoring
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Enhanced monitoring is already running');
      return;
    }

    // Initialize all services first
    const initialized = await this.initialize();
    if (!initialized) {
      console.error('❌ Failed to start monitoring - initialization failed');
      return false;
    }

    this.isRunning = true;
    console.log(`🔄 Starting enhanced status monitoring (interval: ${this.checkInterval}ms)`);
    console.log(`📊 Protocol checkers: ${this.protocolCheckers.getAvailableProtocols().length} protocols`);
    console.log(`🔔 Alert manager: ${this.alertManager.getActiveChannels().length} notification channels`);
    console.log(`📈 Metrics collector: tracking ${this.metricsCollector.getTrackedServicesCount()} services`);

    this.intervalId = setInterval(() => {
      this.updateAllServerStatuses();
    }, this.checkInterval);

    // Immediate first check
    this.updateAllServerStatuses();
    return true;
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('⏹️ Enhanced monitoring stopped');
  }

  /**
   * Update all server statuses with enhanced checking
   */
  async updateAllServerStatuses() {
    if (!this.config.servers || this.config.servers.length === 0) {
      return;
    }

    console.log(`🔄 Checking ${this.config.servers.length} servers...`);
    const startTime = Date.now();

    try {
      // Use protocol checkers for batch processing
      const results = await this.protocolCheckers.checkServices(
        this.config.servers.map(server => ({
          id: server.id,
          url: server.url,
          protocol: server.protocol || this.protocolCheckers.detectProtocol(server.url),
          timeout: server.timeout || 10000
        }))
      );

      // Process results
      for (const [serverId, result] of Object.entries(results)) {
        await this.processServerResult(serverId, result);
      }

      // Update system health metrics
      const onlineCount = Array.from(this.serverStatuses.values())
        .filter(server => server.status === 'online').length;
      
      const healthScore = this.serverStatuses.size > 0 ? 
        Math.round((onlineCount / this.serverStatuses.size) * 100) : 100;

      this.metricsCollector.recordSystemHealth({
        totalServices: this.serverStatuses.size,
        onlineServices: onlineCount,
        healthScore,
        timestamp: new Date()
      });

      this.lastCheck = new Date();
      const duration = Date.now() - startTime;

      console.log(`📈 Monitoring summary: ${onlineCount} online, ${this.serverStatuses.size - onlineCount} offline (${duration}ms)`);

      // Broadcast updates to WebSocket clients
      this.broadcastUpdates();

    } catch (error) {
      console.error('❌ Error during status update:', error);
    }
  }

  /**
   * Process individual server result with enhanced analytics
   */
  async processServerResult(serverId, result) {
    const currentStatus = this.serverStatuses.get(serverId);
    if (!currentStatus) return;

    const previousStatus = currentStatus.status;
    const statusChanged = previousStatus !== result.status;

    // Update server status
    const updatedStatus = {
      ...currentStatus,
      status: result.status,
      responseTime: result.responseTime,
      lastCheck: new Date(),
      error: result.error || null,
      metadata: {
        ...currentStatus.metadata,
        ...result.details
      }
    };

    if (statusChanged) {
      updatedStatus.lastStatusChange = new Date();
      updatedStatus.consecutiveFailures = result.status === 'online' ? 0 : 
        (currentStatus.consecutiveFailures || 0) + 1;

      console.log(`📊 Server ${currentStatus.name} status changed: ${previousStatus} → ${result.status}`);
    }

    this.serverStatuses.set(serverId, updatedStatus);

    // Record metrics
    this.metricsCollector.recordCheck(serverId, {
      status: result.status,
      responseTime: result.responseTime,
      timestamp: new Date(),
      details: result.details,
      error: result.error
    });

    // Analytics processing
    this.analyticsEngine.processServerMetrics(serverId, {
      status: result.status,
      responseTime: result.responseTime,
      cpuUsage: result.details?.cpuUsage,
      memoryUsage: result.details?.memoryUsage,
      diskUsage: result.details?.diskUsage,
      timestamp: Date.now()
    });

    // Cache server status
    await this.cacheManager.cacheServerStatus(serverId, updatedStatus);

    // Database persistence
    if (this.databaseManager.isConnected) {
      try {
        await this.databaseManager.insertServerMetrics({
          server_id: serverId,
          status: result.status,
          response_time: result.responseTime,
          error_message: result.error,
          cpu_usage: result.details?.cpuUsage,
          memory_usage: result.details?.memoryUsage,
          disk_usage: result.details?.diskUsage
        });
      } catch (error) {
        console.error('Database insert error:', error);
      }
    }

    // Send alerts for status changes or threshold violations
    if (statusChanged) {
      await this.alertManager.sendAlert({
        type: 'status_change',
        severity: result.status === 'offline' ? 'error' : 'info',
        serviceId: serverId,
        serviceName: currentStatus.name,
        message: `${currentStatus.name} is now ${result.status}`,
        previousStatus,
        currentStatus: result.status,
        responseTime: result.responseTime,
        timestamp: new Date(),
        metadata: result.details
      });
    }

    // Check for performance alerts
    if (result.responseTime && result.responseTime > 5000) {
      await this.alertManager.sendAlert({
        type: 'performance',
        severity: 'warning',
        serviceId: serverId,
        serviceName: currentStatus.name,
        message: `High response time detected: ${result.responseTime}ms`,
        responseTime: result.responseTime,
        threshold: 5000,
        timestamp: new Date()
      });
    }
  }

  /**
   * Check single server (for manual requests)
   */
  async checkSingleServer(serverId) {
    const server = this.config.servers?.find(s => s.id === serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    // Check cache first
    const cachedStatus = await this.cacheManager.getCachedServerStatus(serverId);
    if (cachedStatus && Date.now() - new Date(cachedStatus.lastCheck).getTime() < 30000) {
      return cachedStatus;
    }

    // Perform fresh check
    const result = await this.protocolCheckers.checkService({
      id: server.id,
      url: server.url,
      protocol: server.protocol || this.protocolCheckers.detectProtocol(server.url),
      timeout: server.timeout || 10000
    });

    await this.processServerResult(serverId, result);
    return this.serverStatuses.get(serverId);
  }

  /**
   * Get enhanced server metrics
   */
  async getServerMetrics(serverId, timeRange = '24h') {
    // Try cache first
    const cachedMetrics = await this.cacheManager.getCachedServerMetrics(serverId);
    if (cachedMetrics) {
      return cachedMetrics;
    }

    // Get from database if available
    if (this.databaseManager.isConnected) {
      try {
        const dbMetrics = await this.databaseManager.getServerMetrics(serverId, timeRange);
        const processedMetrics = this.processDbMetrics(dbMetrics);
        
        // Cache the result
        await this.cacheManager.cacheServerMetrics(serverId, processedMetrics);
        return processedMetrics;
      } catch (error) {
        console.error('Database metrics error:', error);
      }
    }

    // Fallback to metrics collector
    return this.metricsCollector.getServiceMetrics(serverId, timeRange);
  }

  /**
   * Process database metrics into usable format
   */
  processDbMetrics(dbMetrics) {
    if (!dbMetrics || dbMetrics.length === 0) {
      return { uptime: 0, averageResponseTime: 0, history: [] };
    }

    const onlineCount = dbMetrics.filter(m => m.status === 'online').length;
    const uptime = (onlineCount / dbMetrics.length) * 100;
    
    const responseTimeSum = dbMetrics
      .filter(m => m.response_time)
      .reduce((sum, m) => sum + m.response_time, 0);
    const responseTimeCount = dbMetrics.filter(m => m.response_time).length;
    const averageResponseTime = responseTimeCount > 0 ? responseTimeSum / responseTimeCount : 0;

    const history = dbMetrics.map(m => ({
      timestamp: m.timestamp,
      status: m.status,
      responseTime: m.response_time,
      cpuUsage: m.cpu_usage,
      memoryUsage: m.memory_usage,
      diskUsage: m.disk_usage
    }));

    return { uptime, averageResponseTime, history };
  }

  /**
   * Get comprehensive monitoring statistics
   */
  getMonitoringStats() {
    const servers = Array.from(this.serverStatuses.values());
    const onlineServers = servers.filter(s => s.status === 'online').length;
    const offlineServers = servers.filter(s => s.status === 'offline').length;
    const pendingServers = servers.filter(s => s.status === 'pending').length;

    const uptime = this.startTime ? 
      Math.round((Date.now() - this.startTime) / 1000) : 0;

    return {
      totalServers: servers.length,
      onlineServers,
      offlineServers,
      pendingServers,
      lastCheck: this.lastCheck,
      uptime,
      systemHealth: this.metricsCollector.getSystemHealth(),
      analytics: this.analyticsEngine.getStats(),
      cache: {
        connected: this.cacheManager.isConnected,
        provider: this.cacheManager.isConnected ? 'redis' : 'memory'
      },
      database: {
        connected: this.databaseManager.isConnected,
        provider: this.databaseManager.isConnected ? 'mysql' : 'json'
      }
    };
  }

  /**
   * Generate analytics report for a server
   */
  async generateServerReport(serverId, timeRange = '24h') {
    return this.analyticsEngine.generateReport(serverId, timeRange);
  }

  /**
   * Get server status (with caching)
   */
  async getServerStatus(serverId) {
    // Try cache first
    const cachedStatus = await this.cacheManager.getCachedServerStatus(serverId);
    if (cachedStatus) {
      return cachedStatus;
    }

    // Get from memory
    const status = this.serverStatuses.get(serverId);
    if (status) {
      // Cache for next time
      await this.cacheManager.cacheServerStatus(serverId, status);
    }

    return status;
  }

  /**
   * Get all server statuses
   */
  getAllServerStatuses() {
    return Object.fromEntries(this.serverStatuses);
  }

  /**
   * Add server to monitoring
   */
  async addServer(serverConfig) {
    // Validate server config
    if (!serverConfig.id || !serverConfig.url || !serverConfig.name) {
      throw new Error('Invalid server configuration');
    }

    // Add to database if connected
    if (this.databaseManager.isConnected) {
      await this.databaseManager.query(
        'INSERT INTO servers (id, name, url, protocol, category_id, group_id) VALUES (?, ?, ?, ?, ?, ?)',
        [serverConfig.id, serverConfig.name, serverConfig.url, serverConfig.protocol, 
         serverConfig.categoryId, serverConfig.groupId]
      );
    }

    // Add to memory
    this.serverStatuses.set(serverConfig.id, {
      ...serverConfig,
      status: 'pending',
      lastCheck: null,
      responseTime: null,
      consecutiveFailures: 0,
      uptime: 0,
      lastStatusChange: new Date(),
      metadata: {}
    });

    // Update config
    if (!this.config.servers) this.config.servers = [];
    this.config.servers.push(serverConfig);

    console.log(`✅ Added server: ${serverConfig.name}`);
    return serverConfig;
  }

  /**
   * Remove server from monitoring
   */
  async removeServer(serverId) {
    // Remove from database if connected
    if (this.databaseManager.isConnected) {
      await this.databaseManager.query('DELETE FROM servers WHERE id = ?', [serverId]);
      await this.databaseManager.query('DELETE FROM server_metrics WHERE server_id = ?', [serverId]);
    }

    // Remove from memory
    this.serverStatuses.delete(serverId);

    // Remove from config
    if (this.config.servers) {
      this.config.servers = this.config.servers.filter(s => s.id !== serverId);
    }

    // Clear cache
    await this.cacheManager.clearServerCache(serverId);

    console.log(`🗑️ Removed server: ${serverId}`);
  }

  /**
   * Add WebSocket client
   */
  addWebSocketClient(ws) {
    this.wsClients.add(ws);
  }

  /**
   * Remove WebSocket client
   */
  removeWebSocketClient(ws) {
    this.wsClients.delete(ws);
  }

  /**
   * Broadcast updates to all WebSocket clients
   */
  broadcastUpdates() {
    if (this.wsClients.size === 0) return;

    const data = {
      type: 'status_update',
      serverStatuses: this.getAllServerStatuses(),
      timestamp: new Date(),
      stats: this.getMonitoringStats()
    };

    const message = JSON.stringify(data);
    
    this.wsClients.forEach(ws => {
      try {
        if (ws.readyState === 1) { // WebSocket.OPEN
          ws.send(message);
        }
      } catch (error) {
        console.error('WebSocket broadcast error:', error);
        this.wsClients.delete(ws);
      }
    });

    console.log(`📡 Broadcasted updates to ${this.wsClients.size} clients`);
  }

  /**
   * Health check for the monitoring system
   */
  async healthCheck() {
    const health = {
      timestamp: new Date(),
      status: 'healthy',
      services: {}
    };

    // Check database health
    health.services.database = await this.databaseManager.healthCheck();
    
    // Check cache health  
    health.services.cache = await this.cacheManager.healthCheck();

    // Check if monitoring is running
    health.services.monitoring = {
      healthy: this.isRunning,
      lastCheck: this.lastCheck,
      interval: this.checkInterval
    };

    // Overall health
    const allHealthy = Object.values(health.services).every(service => service.healthy);
    health.status = allHealthy ? 'healthy' : 'degraded';

    return health;
  }

  /**
   * Get system insights and recommendations
   */
  async getSystemInsights() {
    const insights = {
      recommendations: [],
      alerts: [],
      trends: {},
      performance: {}
    };

    // Get recommendations from analytics engine
    insights.recommendations = await this.analyticsEngine.getRecommendations();

    // Get recent alerts
    insights.alerts = this.alertManager.getRecentAlerts(100);

    // Get performance trends
    const servers = Array.from(this.serverStatuses.keys());
    for (const serverId of servers) {
      const trends = await this.analyticsEngine.getServerTrends(serverId);
      if (trends) {
        insights.trends[serverId] = trends;
      }
    }

    return insights;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('🔄 Graceful shutdown started...');
    console.log('⏹️ Stopping enhanced monitoring system...');
    
    this.stop();
    
    // Save metrics
    this.metricsCollector.saveMetrics();
    
    // Close database connection
    await this.databaseManager.close();
    
    // Close cache connection
    await this.cacheManager.close();
    
    console.log('✅ Enhanced monitoring system stopped');
  }
}

export default EnhancedStatusMonitor;
