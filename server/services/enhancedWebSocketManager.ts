/**
 * Enhanced WebSocket Manager with Socket.IO
 * Provides real-time communication with advanced features
 */

import { Server } from 'socket.io';

class EnhancedWebSocketManager {
  constructor(server, config = {}) {
    this.server = server;
    this.config = {
      corsOrigin: config.corsOrigin || process.env.CORS_ORIGIN || 'http://localhost:5173',
      pingTimeout: config.pingTimeout || 60000,
      pingInterval: config.pingInterval || 25000,
      maxHttpBufferSize: config.maxHttpBufferSize || 1e6, // 1MB
      ...config
    };

    this.io = null;
    this.clients = new Map();
    this.rooms = new Map();
    this.metrics = {
      connections: 0,
      totalConnections: 0,
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0
    };

    this.subscriptions = new Map(); // Track client subscriptions
    this.rateLimiter = new Map(); // Simple rate limiting
  }

  /**
   * Initialize Socket.IO server
   */
  initialize() {
    this.io = new Server(this.server, {
      cors: {
        origin: this.config.corsOrigin,
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: this.config.pingTimeout,
      pingInterval: this.config.pingInterval,
      maxHttpBufferSize: this.config.maxHttpBufferSize,
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    this.startMetricsCollection();
    
    console.log('🚀 Enhanced Socket.IO WebSocket server initialized');
    return this.io;
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new socket connection
   */
  handleConnection(socket) {
    const clientInfo = {
      id: socket.id,
      address: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
      connectedAt: new Date(),
      subscriptions: new Set(),
      lastActivity: new Date()
    };

    this.clients.set(socket.id, clientInfo);
    this.metrics.connections++;
    this.metrics.totalConnections++;

    console.log(`🔌 New Socket.IO client connected: ${socket.id} from ${clientInfo.address}`);

    // Setup client event handlers
    this.setupClientEventHandlers(socket);

    // Send initial data
    this.sendInitialData(socket);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });
  }

  /**
   * Setup event handlers for individual client
   */
  setupClientEventHandlers(socket) {
    const clientInfo = this.clients.get(socket.id);

    // Subscribe to specific data streams
    socket.on('subscribe', (data) => {
      this.handleSubscription(socket, data);
    });

    // Unsubscribe from data streams
    socket.on('unsubscribe', (data) => {
      this.handleUnsubscription(socket, data);
    });

    // Real-time ping for connection testing
    socket.on('ping', (callback) => {
      this.metrics.messagesReceived++;
      clientInfo.lastActivity = new Date();
      
      if (typeof callback === 'function') {
        callback({ pong: Date.now() });
      } else {
        socket.emit('pong', { timestamp: Date.now() });
      }
    });

    // Request server metrics
    socket.on('request:metrics', (data, callback) => {
      this.handleMetricsRequest(socket, data, callback);
    });

    // Request server status
    socket.on('request:status', (data, callback) => {
      this.handleStatusRequest(socket, data, callback);
    });

    // Manual server check request
    socket.on('request:check', (data, callback) => {
      this.handleCheckRequest(socket, data, callback);
    });

    // Dashboard settings update
    socket.on('settings:update', (data) => {
      this.handleSettingsUpdate(socket, data);
    });

    // Alert acknowledgment
    socket.on('alert:acknowledge', (data, callback) => {
      this.handleAlertAcknowledgment(socket, data, callback);
    });

    // Custom events
    socket.on('custom:event', (data) => {
      this.handleCustomEvent(socket, data);
    });

    // Error handling
    socket.on('error', (error) => {
      this.metrics.errors++;
      console.error(`❌ Socket error from ${socket.id}:`, error);
    });
  }

  /**
   * Handle client subscription
   */
  handleSubscription(socket, data) {
    if (!this.rateLimitCheck(socket.id, 'subscribe')) {
      socket.emit('error', { message: 'Rate limit exceeded' });
      return;
    }

    const clientInfo = this.clients.get(socket.id);
    const { type, serverId, options = {} } = data;

    clientInfo.lastActivity = new Date();

    switch (type) {
      case 'server_status':
        if (serverId) {
          clientInfo.subscriptions.add(`server:${serverId}:status`);
          socket.join(`server:${serverId}:status`);
        } else {
          clientInfo.subscriptions.add('servers:status');
          socket.join('servers:status');
        }
        break;

      case 'server_metrics':
        if (serverId) {
          clientInfo.subscriptions.add(`server:${serverId}:metrics`);
          socket.join(`server:${serverId}:metrics`);
        }
        break;

      case 'dashboard_overview':
        clientInfo.subscriptions.add('dashboard:overview');
        socket.join('dashboard:overview');
        break;

      case 'alerts':
        clientInfo.subscriptions.add('alerts');
        socket.join('alerts');
        break;

      case 'system_health':
        clientInfo.subscriptions.add('system:health');
        socket.join('system:health');
        break;

      default:
        socket.emit('error', { message: `Unknown subscription type: ${type}` });
        return;
    }

    socket.emit('subscription:confirmed', { type, serverId, options });
    console.log(`📡 Client ${socket.id} subscribed to ${type}${serverId ? ` for server ${serverId}` : ''}`);
  }

  /**
   * Handle client unsubscription
   */
  handleUnsubscription(socket, data) {
    const clientInfo = this.clients.get(socket.id);
    const { type, serverId } = data;

    clientInfo.lastActivity = new Date();

    let roomName;
    switch (type) {
      case 'server_status':
        roomName = serverId ? `server:${serverId}:status` : 'servers:status';
        break;
      case 'server_metrics':
        roomName = `server:${serverId}:metrics`;
        break;
      case 'dashboard_overview':
        roomName = 'dashboard:overview';
        break;
      case 'alerts':
        roomName = 'alerts';
        break;
      case 'system_health':
        roomName = 'system:health';
        break;
    }

    if (roomName) {
      clientInfo.subscriptions.delete(roomName);
      socket.leave(roomName);
      socket.emit('unsubscription:confirmed', { type, serverId });
    }
  }

  /**
   * Handle metrics request
   */
  async handleMetricsRequest(socket, data, callback) {
    if (!this.rateLimitCheck(socket.id, 'metrics')) {
      if (callback) callback({ error: 'Rate limit exceeded' });
      return;
    }

    try {
      const { serverId, timeRange = '24h' } = data;
      
      // Get metrics from status monitor or database
      const metrics = global.statusMonitor ? 
        await global.statusMonitor.getServerMetrics(serverId, timeRange) : 
        { error: 'Metrics not available' };

      if (callback) {
        callback({ success: true, data: metrics });
      } else {
        socket.emit('metrics:response', { serverId, timeRange, data: metrics });
      }
    } catch (error) {
      console.error('Error handling metrics request:', error);
      const errorResponse = { error: 'Failed to get metrics', message: error.message };
      
      if (callback) {
        callback(errorResponse);
      } else {
        socket.emit('metrics:error', errorResponse);
      }
    }
  }

  /**
   * Handle status request
   */
  async handleStatusRequest(socket, data, callback) {
    try {
      const { serverId } = data;
      
      const status = global.statusMonitor ? 
        global.statusMonitor.getServerStatus(serverId) : 
        { error: 'Status not available' };

      if (callback) {
        callback({ success: true, data: status });
      } else {
        socket.emit('status:response', { serverId, data: status });
      }
    } catch (error) {
      console.error('Error handling status request:', error);
      const errorResponse = { error: 'Failed to get status', message: error.message };
      
      if (callback) {
        callback(errorResponse);
      } else {
        socket.emit('status:error', errorResponse);
      }
    }
  }

  /**
   * Handle manual check request
   */
  async handleCheckRequest(socket, data, callback) {
    if (!this.rateLimitCheck(socket.id, 'check', 5)) { // Stricter rate limit for checks
      if (callback) callback({ error: 'Rate limit exceeded' });
      return;
    }

    try {
      const { serverId } = data;
      
      if (global.statusMonitor) {
        // Trigger immediate check
        const result = await global.statusMonitor.checkSingleServer(serverId);
        
        if (callback) {
          callback({ success: true, data: result });
        } else {
          socket.emit('check:response', { serverId, data: result });
        }
      } else {
        throw new Error('Status monitor not available');
      }
    } catch (error) {
      console.error('Error handling check request:', error);
      const errorResponse = { error: 'Failed to check server', message: error.message };
      
      if (callback) {
        callback(errorResponse);
      } else {
        socket.emit('check:error', errorResponse);
      }
    }
  }

  /**
   * Handle settings update
   */
  handleSettingsUpdate(socket, data) {
    const clientInfo = this.clients.get(socket.id);
    clientInfo.lastActivity = new Date();

    // Broadcast settings update to other clients
    socket.broadcast.emit('settings:updated', data);
    
    console.log(`⚙️ Settings updated by client ${socket.id}`);
  }

  /**
   * Handle alert acknowledgment
   */
  async handleAlertAcknowledgment(socket, data, callback) {
    try {
      const { alertId, acknowledgedBy } = data;
      
      // Update alert in database/storage
      if (global.statusMonitor && global.statusMonitor.alertManager) {
        await global.statusMonitor.alertManager.acknowledgeAlert(alertId, acknowledgedBy);
      }

      // Broadcast acknowledgment to all clients
      this.io.emit('alert:acknowledged', { alertId, acknowledgedBy, timestamp: new Date() });

      if (callback) {
        callback({ success: true });
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      if (callback) {
        callback({ error: 'Failed to acknowledge alert', message: error.message });
      }
    }
  }

  /**
   * Handle custom events
   */
  handleCustomEvent(socket, data) {
    const clientInfo = this.clients.get(socket.id);
    clientInfo.lastActivity = new Date();

    // Process custom events (e.g., user interactions, custom triggers)
    console.log(`🎯 Custom event from ${socket.id}:`, data);
    
    // Optionally broadcast to other clients
    if (data.broadcast) {
      socket.broadcast.emit('custom:event', data);
    }
  }

  /**
   * Send initial data to newly connected client
   */
  async sendInitialData(socket) {
    try {
      // Send current server statuses
      if (global.statusMonitor) {
        const statuses = global.statusMonitor.getAllServerStatuses();
        socket.emit('initial:server_statuses', statuses);

        // Send recent alerts
        const alerts = global.statusMonitor.alertManager.getRecentAlerts(10);
        socket.emit('initial:alerts', alerts);

        // Send system health
        const health = global.statusMonitor.getSystemHealth();
        socket.emit('initial:system_health', health);
      }

      // Send dashboard configuration
      socket.emit('initial:dashboard_config', {
        timestamp: new Date(),
        version: '2.0.0'
      });

    } catch (error) {
      console.error('Error sending initial data:', error);
      socket.emit('error', { message: 'Failed to load initial data' });
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnection(socket, reason) {
    const clientInfo = this.clients.get(socket.id);
    
    if (clientInfo) {
      const duration = Date.now() - clientInfo.connectedAt.getTime();
      console.log(`🔌 Socket.IO client disconnected: ${socket.id} (${reason}) - Duration: ${Math.round(duration / 1000)}s`);
      
      this.clients.delete(socket.id);
      this.metrics.connections--;
    }

    // Clean up rate limiter
    this.rateLimiter.delete(socket.id);
  }

  /**
   * Simple rate limiting
   */
  rateLimitCheck(clientId, action, maxPerMinute = 30) {
    const now = Date.now();
    const key = `${clientId}:${action}`;
    
    if (!this.rateLimiter.has(key)) {
      this.rateLimiter.set(key, { count: 1, resetTime: now + 60000 });
      return true;
    }

    const limit = this.rateLimiter.get(key);
    
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + 60000;
      return true;
    }

    if (limit.count >= maxPerMinute) {
      return false;
    }

    limit.count++;
    return true;
  }

  /**
   * Broadcast server status update
   */
  broadcastServerStatus(serverId, status) {
    this.metrics.messagesSent++;
    
    // Broadcast to specific server subscribers
    this.io.to(`server:${serverId}:status`).emit('server:status_update', {
      serverId,
      status,
      timestamp: new Date()
    });

    // Broadcast to general server status subscribers
    this.io.to('servers:status').emit('servers:status_update', {
      serverId,
      status,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast server metrics update
   */
  broadcastServerMetrics(serverId, metrics) {
    this.metrics.messagesSent++;
    
    this.io.to(`server:${serverId}:metrics`).emit('server:metrics_update', {
      serverId,
      metrics,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast dashboard overview update
   */
  broadcastDashboardUpdate(data) {
    this.metrics.messagesSent++;
    
    this.io.to('dashboard:overview').emit('dashboard:overview_update', {
      data,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast new alert
   */
  broadcastAlert(alert) {
    this.metrics.messagesSent++;
    
    this.io.to('alerts').emit('alert:new', {
      alert,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast system health update
   */
  broadcastSystemHealth(health) {
    this.metrics.messagesSent++;
    
    this.io.to('system:health').emit('system:health_update', {
      health,
      timestamp: new Date()
    });
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    // Reset metrics periodically
    setInterval(() => {
      this.metrics.messagesReceived = 0;
      this.metrics.messagesSent = 0;
      this.metrics.errors = 0;
    }, 60000); // Reset every minute

    // Clean up old rate limit entries
    setInterval(() => {
      const now = Date.now();
      for (const [key, limit] of this.rateLimiter.entries()) {
        if (now > limit.resetTime + 60000) {
          this.rateLimiter.delete(key);
        }
      }
    }, 300000); // Clean every 5 minutes
  }

  /**
   * Get WebSocket metrics
   */
  getMetrics() {
    return {
      connections: this.metrics.connections,
      totalConnections: this.metrics.totalConnections,
      messagesReceived: this.metrics.messagesReceived,
      messagesSent: this.metrics.messagesSent,
      errors: this.metrics.errors,
      clients: Array.from(this.clients.values()).map(client => ({
        id: client.id,
        address: client.address,
        connectedAt: client.connectedAt,
        lastActivity: client.lastActivity,
        subscriptions: Array.from(client.subscriptions)
      }))
    };
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount() {
    return this.clients.size;
  }

  /**
   * Close WebSocket server
   */
  async close() {
    if (this.io) {
      this.io.close();
      console.log('🔌 Enhanced WebSocket server closed');
    }
  }
}

export default EnhancedWebSocketManager;
