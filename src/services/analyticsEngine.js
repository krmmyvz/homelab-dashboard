/**
 * Advanced Analytics Engine for Homelab Dashboard
 * Provides comprehensive data analysis and reporting capabilities
 */

class AnalyticsEngine {
  constructor(config = {}) {
    this.config = {
      retentionPeriod: config.retentionPeriod || 90, // days
      aggregationInterval: config.aggregationInterval || 3600000, // 1 hour in ms
      enablePredictions: config.enablePredictions !== false,
      enableAnomalyDetection: config.enableAnomalyDetection !== false,
      ...config
    };

    this.dataCache = new Map();
    this.aggregatedData = new Map();
    this.anomalies = [];
    this.predictions = new Map();
    this.reports = new Map();
    
    this.startAggregationTimer();
  }

  /**
   * Initialize analytics engine
   */
  async initialize() {
    try {
      await this.loadHistoricalData();
      await this.computeBaselines();
      
      console.log('📊 Analytics engine initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to initialize analytics engine:', error);
      throw error;
    }
  }

  /**
   * Process server metrics for analytics
   */
  processServerMetrics(serverId, metrics) {
    const timestamp = Date.now();
    const key = `${serverId}:${timestamp}`;
    
    // Store raw metrics
    this.dataCache.set(key, {
      serverId,
      timestamp,
      ...metrics,
      processed: false
    });

    // Trigger real-time analysis
    this.analyzeRealtimeData(serverId, metrics);

    // Clean old cache entries
    this.cleanOldCacheEntries();
  }

  /**
   * Analyze real-time data for immediate insights
   */
  analyzeRealtimeData(serverId, metrics) {
    // Anomaly detection
    if (this.config.enableAnomalyDetection) {
      this.detectAnomalies(serverId, metrics);
    }

    // Performance trend analysis
    this.analyzeTrends(serverId, metrics);

    // Threshold monitoring
    this.checkThresholds(serverId, metrics);
  }

  /**
   * Detect anomalies in server metrics
   */
  detectAnomalies(serverId, metrics) {
    const baseline = this.getBaseline(serverId);
    if (!baseline) return;

    const anomalies = [];

    // Response time anomaly detection
    if (metrics.responseTime && baseline.responseTime) {
      const threshold = baseline.responseTime.mean + (3 * baseline.responseTime.stdDev);
      if (metrics.responseTime > threshold) {
        anomalies.push({
          type: 'response_time_spike',
          severity: 'warning',
          value: metrics.responseTime,
          expected: baseline.responseTime.mean,
          threshold: threshold,
          deviation: ((metrics.responseTime - baseline.responseTime.mean) / baseline.responseTime.mean) * 100
        });
      }
    }

    // CPU usage anomaly detection
    if (metrics.cpuUsage && baseline.cpuUsage) {
      const threshold = baseline.cpuUsage.mean + (2 * baseline.cpuUsage.stdDev);
      if (metrics.cpuUsage > threshold) {
        anomalies.push({
          type: 'cpu_usage_spike',
          severity: metrics.cpuUsage > 90 ? 'critical' : 'warning',
          value: metrics.cpuUsage,
          expected: baseline.cpuUsage.mean,
          threshold: threshold
        });
      }
    }

    // Memory usage anomaly detection
    if (metrics.memoryUsage && baseline.memoryUsage) {
      const threshold = baseline.memoryUsage.mean + (2 * baseline.memoryUsage.stdDev);
      if (metrics.memoryUsage > threshold) {
        anomalies.push({
          type: 'memory_usage_spike',
          severity: metrics.memoryUsage > 95 ? 'critical' : 'warning',
          value: metrics.memoryUsage,
          expected: baseline.memoryUsage.mean,
          threshold: threshold
        });
      }
    }

    // Status pattern anomaly (frequent status changes)
    const recentStatusChanges = this.getRecentStatusChanges(serverId);
    if (recentStatusChanges.length > 5) { // More than 5 status changes in recent period
      anomalies.push({
        type: 'unstable_service',
        severity: 'warning',
        value: recentStatusChanges.length,
        description: 'Service showing instability with frequent status changes'
      });
    }

    // Store detected anomalies
    if (anomalies.length > 0) {
      const anomalyRecord = {
        serverId,
        timestamp: Date.now(),
        anomalies,
        metrics
      };
      
      this.anomalies.push(anomalyRecord);
      
      // Keep only recent anomalies
      this.anomalies = this.anomalies.slice(-1000);
      
      console.log(`🚨 Anomalies detected for ${serverId}:`, anomalies.length);
    }
  }

  /**
   * Analyze performance trends
   */
  analyzeTrends(serverId, metrics) {
    const key = `trends:${serverId}`;
    let trends = this.aggregatedData.get(key) || {
      responseTime: [],
      cpuUsage: [],
      memoryUsage: [],
      diskUsage: [],
      uptime: []
    };

    const timestamp = Date.now();
    
    // Add current metrics to trend data
    if (metrics.responseTime) {
      trends.responseTime.push({ timestamp, value: metrics.responseTime });
    }
    if (metrics.cpuUsage) {
      trends.cpuUsage.push({ timestamp, value: metrics.cpuUsage });
    }
    if (metrics.memoryUsage) {
      trends.memoryUsage.push({ timestamp, value: metrics.memoryUsage });
    }
    if (metrics.diskUsage) {
      trends.diskUsage.push({ timestamp, value: metrics.diskUsage });
    }
    if (metrics.status === 'online') {
      trends.uptime.push({ timestamp, value: 100 });
    } else {
      trends.uptime.push({ timestamp, value: 0 });
    }

    // Keep only recent data points (last 24 hours)
    const cutoff = timestamp - (24 * 60 * 60 * 1000);
    Object.keys(trends).forEach(metric => {
      trends[metric] = trends[metric].filter(point => point.timestamp > cutoff);
    });

    this.aggregatedData.set(key, trends);

    // Calculate trend direction
    this.calculateTrendDirection(serverId, trends);
  }

  /**
   * Calculate trend direction (improving, degrading, stable)
   */
  calculateTrendDirection(serverId, trends) {
    const trendAnalysis = {};

    Object.entries(trends).forEach(([metric, data]) => {
      if (data.length < 2) {
        trendAnalysis[metric] = 'insufficient_data';
        return;
      }

      // Calculate linear regression for trend
      const slope = this.calculateLinearRegression(data);
      
      if (Math.abs(slope) < 0.1) {
        trendAnalysis[metric] = 'stable';
      } else if (slope > 0) {
        // For uptime, positive slope is good; for others, it's bad
        trendAnalysis[metric] = metric === 'uptime' ? 'improving' : 'degrading';
      } else {
        trendAnalysis[metric] = metric === 'uptime' ? 'degrading' : 'improving';
      }
    });

    // Store trend analysis
    this.aggregatedData.set(`trend_analysis:${serverId}`, {
      timestamp: Date.now(),
      analysis: trendAnalysis
    });
  }

  /**
   * Calculate linear regression slope
   */
  calculateLinearRegression(data) {
    const n = data.length;
    if (n < 2) return 0;

    const sumX = data.reduce((sum, point, index) => sum + index, 0);
    const sumY = data.reduce((sum, point) => sum + point.value, 0);
    const sumXY = data.reduce((sum, point, index) => sum + (index * point.value), 0);
    const sumXX = data.reduce((sum, point, index) => sum + (index * index), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  /**
   * Check performance thresholds
   */
  checkThresholds(serverId, metrics) {
    const thresholds = this.getThresholds(serverId);
    const violations = [];

    // Response time threshold
    if (metrics.responseTime && thresholds.responseTime) {
      if (metrics.responseTime > thresholds.responseTime.critical) {
        violations.push({
          metric: 'responseTime',
          severity: 'critical',
          value: metrics.responseTime,
          threshold: thresholds.responseTime.critical
        });
      } else if (metrics.responseTime > thresholds.responseTime.warning) {
        violations.push({
          metric: 'responseTime',
          severity: 'warning',
          value: metrics.responseTime,
          threshold: thresholds.responseTime.warning
        });
      }
    }

    // CPU usage threshold
    if (metrics.cpuUsage && thresholds.cpuUsage) {
      if (metrics.cpuUsage > thresholds.cpuUsage.critical) {
        violations.push({
          metric: 'cpuUsage',
          severity: 'critical',
          value: metrics.cpuUsage,
          threshold: thresholds.cpuUsage.critical
        });
      } else if (metrics.cpuUsage > thresholds.cpuUsage.warning) {
        violations.push({
          metric: 'cpuUsage',
          severity: 'warning',
          value: metrics.cpuUsage,
          threshold: thresholds.cpuUsage.warning
        });
      }
    }

    // Memory usage threshold
    if (metrics.memoryUsage && thresholds.memoryUsage) {
      if (metrics.memoryUsage > thresholds.memoryUsage.critical) {
        violations.push({
          metric: 'memoryUsage',
          severity: 'critical',
          value: metrics.memoryUsage,
          threshold: thresholds.memoryUsage.critical
        });
      } else if (metrics.memoryUsage > thresholds.memoryUsage.warning) {
        violations.push({
          metric: 'memoryUsage',
          severity: 'warning',
          value: metrics.memoryUsage,
          threshold: thresholds.memoryUsage.warning
        });
      }
    }

    if (violations.length > 0) {
      console.log(`⚠️ Threshold violations for ${serverId}:`, violations);
      
      // Store violations for reporting
      this.aggregatedData.set(`violations:${serverId}:${Date.now()}`, {
        serverId,
        timestamp: Date.now(),
        violations
      });
    }
  }

  /**
   * Generate performance predictions
   */
  generatePredictions(serverId) {
    if (!this.config.enablePredictions) return null;

    const trends = this.aggregatedData.get(`trends:${serverId}`);
    if (!trends) return null;

    const predictions = {};

    Object.entries(trends).forEach(([metric, data]) => {
      if (data.length < 10) return; // Need sufficient data

      const prediction = this.predictNextValue(data);
      if (prediction) {
        predictions[metric] = prediction;
      }
    });

    this.predictions.set(serverId, {
      timestamp: Date.now(),
      predictions
    });

    return predictions;
  }

  /**
   * Predict next value using simple moving average
   */
  predictNextValue(data) {
    if (data.length < 5) return null;

    // Use last 5 data points for prediction
    const recent = data.slice(-5);
    const average = recent.reduce((sum, point) => sum + point.value, 0) / recent.length;
    
    // Calculate trend
    const slope = this.calculateLinearRegression(recent);
    
    // Predict next value (assuming 5-minute interval)
    const nextValue = average + slope;
    
    return {
      predicted: nextValue,
      confidence: this.calculateConfidence(recent),
      trend: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable'
    };
  }

  /**
   * Calculate prediction confidence
   */
  calculateConfidence(data) {
    if (data.length < 3) return 0;

    const values = data.map(point => point.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher confidence
    const confidence = Math.max(0, Math.min(100, 100 - (stdDev / mean) * 100));
    return Math.round(confidence);
  }

  /**
   * Generate comprehensive analytics report
   */
  generateReport(serverId, timeRange = '24h') {
    const report = {
      serverId,
      timeRange,
      generatedAt: new Date(),
      summary: {},
      trends: {},
      anomalies: [],
      predictions: {},
      recommendations: []
    };

    // Get trends
    const trends = this.aggregatedData.get(`trends:${serverId}`);
    if (trends) {
      report.trends = this.summarizeTrends(trends);
    }

    // Get anomalies
    const serverAnomalies = this.anomalies.filter(a => a.serverId === serverId);
    report.anomalies = serverAnomalies.slice(-20); // Last 20 anomalies

    // Get predictions
    const predictions = this.predictions.get(serverId);
    if (predictions) {
      report.predictions = predictions.predictions;
    }

    // Generate summary
    report.summary = this.generateSummary(serverId, timeRange);

    // Generate recommendations
    report.recommendations = this.generateRecommendations(serverId);

    // Store report
    this.reports.set(`${serverId}:${Date.now()}`, report);

    return report;
  }

  /**
   * Summarize trends
   */
  summarizeTrends(trends) {
    const summary = {};

    Object.entries(trends).forEach(([metric, data]) => {
      if (data.length === 0) return;

      const values = data.map(point => point.value);
      summary[metric] = {
        current: values[values.length - 1],
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        dataPoints: values.length
      };
    });

    return summary;
  }

  /**
   * Generate performance summary
   */
  generateSummary(serverId, _timeRange) { // _timeRange unused currently
    const trends = this.aggregatedData.get(`trends:${serverId}`);
    if (!trends) return {};

    const uptimeData = trends.uptime || [];
    const responseTimeData = trends.responseTime || [];

    const uptime = uptimeData.length > 0 ? 
      (uptimeData.filter(point => point.value === 100).length / uptimeData.length) * 100 : 0;

    const avgResponseTime = responseTimeData.length > 0 ?
      responseTimeData.reduce((sum, point) => sum + point.value, 0) / responseTimeData.length : 0;

    return {
      uptime: Math.round(uptime * 100) / 100,
      averageResponseTime: Math.round(avgResponseTime),
      totalChecks: uptimeData.length,
      anomalyCount: this.anomalies.filter(a => a.serverId === serverId).length
    };
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(serverId) {
    const recommendations = [];
    const trends = this.aggregatedData.get(`trends:${serverId}`);
    const trendAnalysis = this.aggregatedData.get(`trend_analysis:${serverId}`);
    
    if (!trends || !trendAnalysis) return recommendations;

    // Response time recommendations
    if (trendAnalysis.analysis.responseTime === 'degrading') {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Response Time Degradation',
        description: 'Response times are increasing. Consider optimizing server performance or checking network connectivity.',
        action: 'Investigate server load and network latency'
      });
    }

    // CPU usage recommendations
    if (trendAnalysis.analysis.cpuUsage === 'degrading') {
      const cpuData = trends.cpuUsage || [];
      const avgCpu = cpuData.reduce((sum, point) => sum + point.value, 0) / cpuData.length;
      
      if (avgCpu > 80) {
        recommendations.push({
          type: 'resource',
          priority: 'high',
          title: 'High CPU Usage',
          description: `Average CPU usage is ${Math.round(avgCpu)}%. Consider upgrading hardware or optimizing applications.`,
          action: 'Scale up CPU resources or optimize processes'
        });
      }
    }

    // Memory usage recommendations
    if (trendAnalysis.analysis.memoryUsage === 'degrading') {
      const memoryData = trends.memoryUsage || [];
      const avgMemory = memoryData.reduce((sum, point) => sum + point.value, 0) / memoryData.length;
      
      if (avgMemory > 85) {
        recommendations.push({
          type: 'resource',
          priority: 'high',
          title: 'High Memory Usage',
          description: `Average memory usage is ${Math.round(avgMemory)}%. Consider increasing RAM or optimizing memory usage.`,
          action: 'Scale up memory or optimize application memory usage'
        });
      }
    }

    // Uptime recommendations
    if (trendAnalysis.analysis.uptime === 'degrading') {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'Service Reliability Issues',
        description: 'Service uptime is decreasing. Investigate potential stability issues.',
        action: 'Check logs, monitor dependencies, and implement health checks'
      });
    }

    return recommendations;
  }

  /**
   * Get baseline metrics for a server
   */
  getBaseline(serverId) {
    return this.aggregatedData.get(`baseline:${serverId}`);
  }

  /**
   * Get performance thresholds for a server
   */
  getThresholds(_serverId) {
    // Default thresholds - can be customized per server
    return {
      responseTime: { warning: 2000, critical: 5000 },
      cpuUsage: { warning: 80, critical: 95 },
      memoryUsage: { warning: 85, critical: 95 },
      diskUsage: { warning: 85, critical: 95 }
    };
  }

  /**
   * Get recent status changes for a server
   */
  getRecentStatusChanges(_serverId) {
    // This would typically query the database for recent status changes
    // For now, return mock data
    return [];
  }

  /**
   * Load historical data
   */
  async loadHistoricalData() {
    // Load historical data from database
    console.log('📈 Loading historical data for analytics...');
  }

  /**
   * Compute baseline metrics
   */
  async computeBaselines() {
    // Compute baseline metrics for each server
    console.log('📊 Computing baseline metrics...');
  }

  /**
   * Start aggregation timer
   */
  startAggregationTimer() {
    setInterval(() => {
      this.aggregateData();
    }, this.config.aggregationInterval);
  }

  /**
   * Aggregate data periodically
   */
  aggregateData() {
    // Process cached data and create aggregations
    const processedCount = this.processCachedData();
    if (processedCount > 0) {
      console.log(`📊 Processed ${processedCount} metrics for analytics`);
    }
  }

  /**
   * Process cached data
   */
  processCachedData() {
    let processed = 0;
    
  for (const [, data] of this.dataCache.entries()) {
      if (!data.processed) {
        // Mark as processed
        data.processed = true;
        processed++;
      }
    }

    return processed;
  }

  /**
   * Clean old cache entries
   */
  cleanOldCacheEntries() {
    const cutoff = Date.now() - (this.config.retentionPeriod * 24 * 60 * 60 * 1000);
    
    for (const [key, data] of this.dataCache.entries()) {
      if (data.timestamp < cutoff) {
        this.dataCache.delete(key);
      }
    }
  }

  /**
   * Get analytics statistics
   */
  getStats() {
    return {
      cachedDataPoints: this.dataCache.size,
      aggregatedMetrics: this.aggregatedData.size,
      totalAnomalies: this.anomalies.length,
      activePredictions: this.predictions.size,
      generatedReports: this.reports.size
    };
  }

  /**
   * Export analytics data
   */
  exportData(format = 'json') {
    const data = {
      aggregatedData: Object.fromEntries(this.aggregatedData),
      anomalies: this.anomalies,
      predictions: Object.fromEntries(this.predictions),
      reports: Object.fromEntries(this.reports)
    };

    if (format === 'csv') {
      return this.convertToCSV(data);
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    // Simple CSV conversion for anomalies
    const csvLines = ['Server ID,Timestamp,Anomaly Type,Severity,Value'];
    
    data.anomalies.forEach(anomaly => {
      anomaly.anomalies.forEach(item => {
        csvLines.push([
          anomaly.serverId,
          new Date(anomaly.timestamp).toISOString(),
          item.type,
          item.severity,
          item.value
        ].join(','));
      });
    });

    return csvLines.join('\n');
  }
}

export default AnalyticsEngine;
