/**
 * Advanced Metrics Collection System
 * Collects, stores and analyzes service performance metrics
 */

class MetricsCollector {
  constructor() {
    this.metrics = new Map();
    this.aggregatedMetrics = new Map();
    this.retentionPeriods = {
      raw: 24 * 60 * 60 * 1000,      // 24 hours for raw metrics
      hourly: 7 * 24 * 60 * 60 * 1000, // 7 days for hourly aggregates
      daily: 30 * 24 * 60 * 60 * 1000  // 30 days for daily aggregates
    };
  }

  /**
   * Record a service check (primary method used by StatusMonitor)
   */
  recordCheck(serviceId, checkData) {
    const { status, responseTime, timestamp, details = {}, error } = checkData;
    
    // Record status check
    this.recordMetric(serviceId, {
      type: 'status',
      value: status === 'online' ? 1 : 0,
      metadata: { 
        status, 
        responseTime: responseTime || 0, 
        timestamp: timestamp || new Date(),
        details,
        error
      }
    });

    // Record response time if available
    if (responseTime > 0) {
      this.recordMetric(serviceId, {
        type: 'responseTime',
        value: responseTime,
        metadata: { 
          status, 
          timestamp: timestamp || new Date(),
          details 
        }
      });
    }

    // Record uptime metrics
    this.recordMetric(serviceId, {
      type: 'uptime',
      value: status === 'online' ? 100 : 0,
      metadata: { 
        status, 
        timestamp: timestamp || new Date(),
        responseTime: responseTime || 0
      }
    });
  }

  /**
   * Record system health metrics
   */
  recordSystemHealth(healthData) {
    const { timestamp, totalServices, onlineServices, healthScore, error } = healthData;
    
    this.recordMetric('_system', {
      type: 'health',
      value: healthScore || 0,
      metadata: {
        totalServices: totalServices || 0,
        onlineServices: onlineServices || 0,
        timestamp: timestamp || new Date(),
        error
      }
    });
  }

  /**
   * Record a metric point
   */
  recordMetric(serviceId, metric) {
    const timestamp = Date.now();
    const key = `${serviceId}:${metric.type}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metricPoint = {
      timestamp,
      value: metric.value,
      metadata: metric.metadata || {}
    };

    this.metrics.get(key).push(metricPoint);
    
    // Clean old metrics periodically
    if (Math.random() < 0.01) { // 1% chance to trigger cleanup
      this.cleanupMetrics();
    }
  }

  /**
   * Get service metrics
   */
  getServiceMetrics(serviceId, timeRange = '24h') {
    const timeMs = this.parseTimeRange(timeRange);
    const cutoff = Date.now() - timeMs;
    
    const statusKey = `${serviceId}:status`;
    const responseKey = `${serviceId}:responseTime`;
    
    const statusMetrics = this.metrics.get(statusKey) || [];
    const responseMetrics = this.metrics.get(responseKey) || [];
    
    const recentStatus = statusMetrics.filter(m => m.timestamp > cutoff);
    const recentResponse = responseMetrics.filter(m => m.timestamp > cutoff);
    
    return {
      serviceId,
      timeRange,
      uptime: this.calculateUptime(recentStatus),
      averageResponseTime: this.calculateAverageResponseTime(recentResponse),
      history: this.buildHistory(recentStatus, recentResponse)
    };
  }

  /**
   * Get services overview
   */
  getServicesOverview(timeRange = '24h') {
    const serviceIds = new Set();
    Array.from(this.metrics.keys()).forEach(key => {
      const [serviceId] = key.split(':');
      if (serviceId !== '_system') {
        serviceIds.add(serviceId);
      }
    });

    const overview = {
      totalServices: serviceIds.size,
      timeRange,
      services: {}
    };

    serviceIds.forEach(serviceId => {
      overview.services[serviceId] = this.getServiceMetrics(serviceId, timeRange);
    });

    return overview;
  }

  /**
   * Get system health
   */
  getSystemHealth() {
    const healthKey = '_system:health';
    const healthMetrics = this.metrics.get(healthKey) || [];
    
    if (healthMetrics.length === 0) {
      return {
        currentHealth: 100,
        status: 'healthy'
      };
    }

    const latest = healthMetrics[healthMetrics.length - 1];
    return {
      currentHealth: latest.value,
      status: latest.value >= 90 ? 'healthy' : latest.value >= 70 ? 'degraded' : 'unhealthy',
      lastUpdate: new Date(latest.timestamp),
      totalServices: latest.metadata.totalServices || 0,
      onlineServices: latest.metadata.onlineServices || 0
    };
  }

  /**
   * Get tracked services count
   */
  getTrackedServicesCount() {
    const serviceIds = new Set();
    Array.from(this.metrics.keys()).forEach(key => {
      const [serviceId] = key.split(':');
      if (serviceId !== '_system') {
        serviceIds.add(serviceId);
      }
    });
    return serviceIds.size;
  }

  /**
   * Calculate uptime percentage
   */
  calculateUptime(statusMetrics) {
    if (statusMetrics.length === 0) return 0;
    
    const onlineCount = statusMetrics.filter(m => m.value === 1).length;
    return Math.round((onlineCount / statusMetrics.length) * 100 * 100) / 100;
  }

  /**
   * Calculate average response time
   */
  calculateAverageResponseTime(responseMetrics) {
    if (responseMetrics.length === 0) return 0;
    
    const sum = responseMetrics.reduce((acc, m) => acc + m.value, 0);
    return Math.round(sum / responseMetrics.length);
  }

  /**
   * Build history timeline
   */
  buildHistory(statusMetrics, responseMetrics) {
    const history = [];
    const combined = new Map();

    statusMetrics.forEach(metric => {
      const key = Math.floor(metric.timestamp / (5 * 60 * 1000)) * (5 * 60 * 1000); // 5-minute buckets
      if (!combined.has(key)) {
        combined.set(key, { timestamp: new Date(key) });
      }
      combined.get(key).status = metric.value === 1 ? 'online' : 'offline';
    });

    responseMetrics.forEach(metric => {
      const key = Math.floor(metric.timestamp / (5 * 60 * 1000)) * (5 * 60 * 1000);
      if (!combined.has(key)) {
        combined.set(key, { timestamp: new Date(key) });
      }
      combined.get(key).responseTime = metric.value;
    });

    Array.from(combined.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([, value]) => {
        history.push(value);
      });

    return history.slice(-100); // Last 100 data points
  }

  /**
   * Parse time range string to milliseconds
   */
  parseTimeRange(timeRange) {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));
    
    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'm': return value * 60 * 1000;
      default: return 24 * 60 * 60 * 1000; // Default to 24 hours
    }
  }

  /**
   * Aggregate metrics (placeholder for future enhancement)
   */
  aggregateMetrics() {
    // This would aggregate raw metrics into hourly/daily summaries
    console.log('📊 Aggregating metrics...');
  }

  /**
   * Clean up old metrics
   */
  cleanupMetrics() {
    const cutoff = Date.now() - this.retentionPeriods.raw;
    
    for (const [key, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => m.timestamp > cutoff);
      if (filtered.length !== metrics.length) {
        this.metrics.set(key, filtered);
      }
    }
  }

  /**
   * Cleanup old metrics (daily cleanup)
   */
  cleanupOldMetrics() {
    this.cleanupMetrics();
    console.log('🧹 Old metrics cleaned up');
  }

  /**
   * Save metrics to persistent storage
   */
  saveMetrics() {
    try {
      // In a real application, you would save metrics to a database
      console.log('💾 Metrics saved to storage');
      return true;
    } catch (error) {
      console.error('❌ Failed to save metrics:', error);
      return false;
    }
  }

  /**
   * Export metrics to CSV
   */
  exportToCsv(data) {
    const rows = [];
    rows.push(['Timestamp', 'Service', 'Status', 'Response Time', 'Uptime %']);

    if (data.serverStatuses) {
      Object.entries(data.serverStatuses).forEach(([serverId, statusData]) => {
        rows.push([
          new Date().toISOString(),
          serverId,
          statusData.status || 'unknown',
          statusData.responseTime || 0,
          statusData.uptime || 0
        ]);
      });
    }

    return rows.map(row => row.join(',')).join('\n');
  }
}

export default MetricsCollector;
