import DatabaseManager from './databaseManager';

/**
 * Advanced Analytics Engine for Homelab Dashboard
 * Provides comprehensive data analysis and reporting capabilities using ML-inspired statistical models.
 */

export interface MetricPoint {
  timestamp: number;
  value: number;
}

export interface MetricBaseline {
  mean: number;
  stdDev: number;
  median: number;
  mad: number; // Median Absolute Deviation
}

export interface Anomaly {
  type: string;
  severity: 'warning' | 'critical';
  value: number;
  expected: number;
  threshold: number;
  deviation?: number;
  description?: string;
}

export interface Prediction {
  predicted: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  horizon: string;
}

export interface AnalyticsReport {
  serverId: string;
  timeRange: string;
  generatedAt: Date;
  summary: any;
  trends: any;
  anomalies: Anomaly[];
  predictions: Record<string, Prediction>;
  recommendations: any[];
}

export interface AnalyticsConfig {
  retentionPeriod: number;
  aggregationInterval: number;
  enablePredictions: boolean;
  enableAnomalyDetection: boolean;
  zScoreThreshold: number;
  madThreshold: number;
}

class AnalyticsEngine {
  private config: AnalyticsConfig;
  private db: DatabaseManager | null;
  private dataCache: Map<string, any>;
  private aggregatedData: Map<string, any>;
  private anomalies: { serverId: string; timestamp: number; anomalies: Anomaly[]; metrics: any }[];
  private predictions: Map<string, { timestamp: number; predictions: Record<string, Prediction> }>;
  private reports: Map<string, AnalyticsReport>;

  constructor(db: DatabaseManager | null = null, config: Partial<AnalyticsConfig> = {}) {
    this.db = db;
    this.config = {
      retentionPeriod: config.retentionPeriod || 90, // days
      aggregationInterval: config.aggregationInterval || 3600000, // 1 hour in ms
      enablePredictions: config.enablePredictions !== false,
      enableAnomalyDetection: config.enableAnomalyDetection !== false,
      zScoreThreshold: config.zScoreThreshold || 3.0, // Standard Z-score outlier
      madThreshold: config.madThreshold || 3.5, // Conservative MAD threshold
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
  async initialize(): Promise<{ success: boolean }> {
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
  processServerMetrics(serverId: string, metrics: any) {
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
  analyzeRealtimeData(serverId: string, metrics: any) {
    if (this.config.enableAnomalyDetection) {
      this.detectAnomalies(serverId, metrics);
    }

    this.analyzeTrends(serverId, metrics);
    this.checkThresholds(serverId, metrics);
  }

  /**
   * Detect anomalies using Z-Score and MAD (Median Absolute Deviation)
   */
  detectAnomalies(serverId: string, metrics: any) {
    const baseline = this.getBaseline(serverId);
    if (!baseline) return;

    const detectedAnomalies: Anomaly[] = [];

    const checkMetric = (metricName: string, value: number, baselineData: MetricBaseline) => {
      if (value === undefined || !baselineData) return;

      // Z-Score calculation
      const zScore = baselineData.stdDev > 0 ? Math.abs((value - baselineData.mean) / baselineData.stdDev) : 0;

      // MAD calculation (Robust Outlier Detection)
      const madScore = baselineData.mad > 0 ? Math.abs(value - baselineData.median) / (baselineData.mad * 1.4826) : 0;

      // Rule: If both are above threshold, it's a critical anomaly. If Z-Score is very high, it's a spike.
      if (madScore > this.config.madThreshold || zScore > this.config.zScoreThreshold) {
        detectedAnomalies.push({
          type: `${metricName}_anomaly`,
          severity: madScore > 5 || zScore > 5 ? 'critical' : 'warning',
          value: value,
          expected: baselineData.median,
          threshold: baselineData.median + (baselineData.mad * this.config.madThreshold * 1.4826),
          deviation: zScore,
          description: `Detected ${metricName} anomaly via ${madScore > zScore ? 'Robust MAD' : 'Z-Score'} analysis.`
        });
      }
    };

    if (metrics.responseTime) checkMetric('responseTime', metrics.responseTime, baseline.responseTime);
    if (metrics.cpuUsage) checkMetric('cpuUsage', metrics.cpuUsage, baseline.cpuUsage);
    if (metrics.memoryUsage) checkMetric('memoryUsage', metrics.memoryUsage, baseline.memoryUsage);

    // Unstable service detection
    const recentStatusChanges = this.getRecentStatusChanges(serverId);
    if (recentStatusChanges.length > 5) {
      detectedAnomalies.push({
        type: 'unstable_service',
        severity: 'warning',
        value: recentStatusChanges.length,
        expected: 0,
        threshold: 5,
        description: 'Service showing instability with frequent status changes'
      });
    }

    if (detectedAnomalies.length > 0) {
      const anomalyRecord = {
        serverId,
        timestamp: Date.now(),
        anomalies: detectedAnomalies,
        metrics
      };

      this.anomalies.push(anomalyRecord);

      // Keep only recent anomalies
      this.anomalies = this.anomalies.slice(-1000);

      console.log(`🚨 Anomalies detected for ${serverId}:`, detectedAnomalies.length);
    }
  }

  /**
   * Analyze performance trends
   */
  analyzeTrends(serverId: string, metrics: any) {
    const key = `trends:${serverId}`;
    let trends: Record<string, MetricPoint[]> = this.aggregatedData.get(key) || {
      responseTime: [],
      cpuUsage: [],
      memoryUsage: [],
      diskUsage: [],
      uptime: []
    };

    const timestamp = Date.now();

    const updateMetric = (name: string, val: number) => {
      if (val !== undefined) trends[name].push({ timestamp, value: val });
    };

    updateMetric('responseTime', metrics.responseTime);
    updateMetric('cpuUsage', metrics.cpuUsage);
    updateMetric('memoryUsage', metrics.memoryUsage);
    updateMetric('diskUsage', metrics.diskUsage);
    updateMetric('uptime', metrics.status === 'online' ? 100 : 0);

    // Keep only recent data points (last 24 hours)
    const cutoff = timestamp - (24 * 60 * 60 * 1000);
    Object.keys(trends).forEach(metric => {
      trends[metric] = trends[metric].filter((point: MetricPoint) => point.timestamp > cutoff);
    });

    this.aggregatedData.set(key, trends);

    // Calculate trend direction
    this.calculateTrendDirection(serverId, trends);
  }

  /**
   * Calculate trend direction using Linear Regression slope
   */
  calculateTrendDirection(serverId: string, trends: Record<string, MetricPoint[]>) {
    const trendAnalysis: Record<string, string> = {};

    (Object.entries(trends) as [string, MetricPoint[]][]).forEach(([metric, data]) => {
      if (data.length < 5) {
        trendAnalysis[metric] = 'insufficient_data';
        return;
      }

      const slope = this.calculateLinearRegression(data);

      if (Math.abs(slope) < 0.05) { // A smaller threshold for 'stable'
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
  calculateLinearRegression(data: MetricPoint[]): number {
    const n = data.length;
    if (n < 2) return 0;

    const sumX = data.reduce((sum, _, index) => sum + index, 0);
    const sumY = data.reduce((sum, point) => sum + point.value, 0);
    const sumXY = data.reduce((sum, point, index) => sum + (index * point.value), 0);
    const sumXX = data.reduce((sum, _, index) => sum + (index * index), 0);

    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0) return 0; // Avoid division by zero for constant x values

    const slope = (n * sumXY - sumX * sumY) / denominator;
    return slope;
  }

  /**
   * Check performance thresholds
   */
  checkThresholds(serverId: string, metrics: any) {
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
   * Generate predictions using Holt-Linear (Double Exponential Smoothing)
   */
  generatePredictions(serverId: string): Record<string, Prediction> | null {
    if (!this.config.enablePredictions) return null;

    const trends = this.aggregatedData.get(`trends:${serverId}`);
    if (!trends) return null;

    const serverPredictions: Record<string, Prediction> = {};

    (Object.entries(trends) as [string, MetricPoint[]][]).forEach(([metric, data]) => {
      if (data.length < 10) return; // Need sufficient data

      const prediction = this.predictNextValue(data);
      if (prediction) {
        serverPredictions[metric] = prediction;
      }
    });

    this.predictions.set(serverId, {
      timestamp: Date.now(),
      predictions: serverPredictions
    });

    return serverPredictions;
  }

  /**
   * Holt-Linear Prediction Model
   */
  predictNextValue(data: MetricPoint[]): Prediction | null {
    if (data.length < 10) return null;

    const alpha = 0.3; // Level smoothing
    const beta = 0.1;  // Trend smoothing

    let level = data[0].value;
    let trend = data[1].value - data[0].value;

    for (let i = 1; i < data.length; i++) {
      const value = data[i].value;
      const lastLevel = level;
      level = alpha * value + (1 - alpha) * (level + trend);
      trend = beta * (level - lastLevel) + (1 - beta) * trend;
    }

    // Predict next step (k=1)
    const predictedValue = level + trend;
    const confidence = this.calculateConfidence(data.slice(-5));

    return {
      predicted: Math.max(0, predictedValue), // Ensure non-negative predictions
      confidence,
      trend: trend > 0.1 ? 'increasing' : trend < -0.1 ? 'decreasing' : 'stable',
      horizon: '5m' // Assuming prediction for the next 5-minute interval
    };
  }

  /**
   * Calculate prediction confidence
   */
  calculateConfidence(data: MetricPoint[]): number {
    if (data.length < 3) return 0;

    const values = data.map(p => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 100; // If all values are 0, stdDev will be 0, leading to 100% confidence

    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation relative to mean = higher confidence
    return Math.round(Math.max(0, Math.min(100, 100 - (stdDev / mean) * 100)));
  }

  /**
   * Generate comprehensive analytics report
   */
  generateReport(serverId: string, timeRange = '24h'): AnalyticsReport {
    const report: AnalyticsReport = {
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
    const serverAnomalies = this.anomalies.filter(a => a.serverId === serverId).flatMap(a => a.anomalies);
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
  summarizeTrends(trends: Record<string, MetricPoint[]>) {
    const summary: Record<string, any> = {};

    (Object.entries(trends) as [string, MetricPoint[]][]).forEach(([metric, data]) => {
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
  generateSummary(serverId: string, _timeRange: string) { // _timeRange unused currently
    const trends = this.aggregatedData.get(`trends:${serverId}`);
    if (!trends) return {};

    const uptimeData: MetricPoint[] = trends.uptime || [];
    const responseTimeData: MetricPoint[] = trends.responseTime || [];

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
   * Enhanced Recommendation Engine
   */
  generateRecommendations(serverId: string): any[] {
    const recommendations: any[] = [];
    const trends = this.aggregatedData.get(`trends:${serverId}`);
    const trendAnalysis = this.aggregatedData.get(`trend_analysis:${serverId}`);
    const predictions = this.predictions.get(serverId);

    if (!trends || !trendAnalysis) return recommendations;

    const { analysis } = trendAnalysis;

    // Response time recommendations
    if (analysis.responseTime === 'degrading') {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Response Time Degradation',
        description: 'Response times are increasing. Consider optimizing server performance or checking network connectivity.',
        action: 'Investigate server load and network latency'
      });
    }

    // CPU usage recommendations
    if (analysis.cpuUsage === 'degrading') {
      const cpuData: MetricPoint[] = trends.cpuUsage || [];
      const avgCpu = cpuData.length > 0 ? cpuData.reduce((sum, point) => sum + point.value, 0) / cpuData.length : 0;

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
    if (analysis.memoryUsage === 'degrading') {
      const memoryData: MetricPoint[] = trends.memoryUsage || [];
      const avgMemory = memoryData.length > 0 ? memoryData.reduce((sum, point) => sum + point.value, 0) / memoryData.length : 0;

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
    if (analysis.uptime === 'degrading') {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'Service Reliability Issues',
        description: 'Service uptime is decreasing. Investigate potential stability issues.',
        action: 'Check logs, monitor dependencies, and implement health checks'
      });
    }

    // Correlation Analysis logic
    if (analysis.cpuUsage === 'degrading' && analysis.responseTime === 'degrading') {
      recommendations.push({
        type: 'performance',
        priority: 'critical',
        title: 'Critical Resource Bottleneck',
        description: 'CPU usage increase is directly correlating with response time degradation.',
        action: 'Immediate resource scaling or process optimization required.'
      });
    }

    // Forward-looking recommendation
    if (predictions) {
      (Object.entries(predictions.predictions) as [string, Prediction][]).forEach(([metric, pred]) => {
        if (pred.predicted > 90 && pred.trend === 'increasing') {
          recommendations.push({
            type: 'proactive',
            priority: 'high',
            title: `Upcoming ${metric} Threshold Violation`,
            description: `Based on current trends, ${metric} is predicted to reach ${Math.round(pred.predicted)}% in the next 5 minutes.`,
            action: 'Proactive intervention recommended.'
          });
        }
      });
    }

    return recommendations;
  }

  /**
   * Get baseline metrics for a server
   */
  getBaseline(serverId: string): Record<string, MetricBaseline> | undefined {
    return this.aggregatedData.get(`baseline:${serverId}`);
  }

  /**
   * Get performance thresholds for a server
   */
  getThresholds(_serverId: string) {
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
  getRecentStatusChanges(_serverId: string): any[] {
    // This would typically query the database for recent status changes
    // For now, return mock data
    return [];
  }

  /**
   * Load historical data from database
   */
  async loadHistoricalData() {
    if (!this.db || !this.db.isConnected) {
      console.log('📈 Skipping historical data load: No DB connection');
      return;
    }

    try {
      console.log('📈 Loading historical data for analytics...');
      const samples = await this.db.query('SELECT * FROM server_metrics ORDER BY timestamp DESC LIMIT 1000') as any[];

      samples.forEach(sample => {
        const timestamp = new Date(sample.timestamp).getTime();
        const serverId = sample.server_id;

        const metrics = {
          responseTime: sample.response_time,
          cpuUsage: sample.cpu_usage,
          memoryUsage: sample.memory_usage,
          diskUsage: sample.disk_usage,
          uptime: sample.uptime === 100 ? 100 : 0
        };

        const key = `trends:${serverId}`;
        let trends = this.aggregatedData.get(key) || {
          responseTime: [], cpuUsage: [], memoryUsage: [], diskUsage: [], uptime: []
        };

        Object.entries(metrics).forEach(([name, val]) => {
          if (val !== null && val !== undefined) {
            trends[name].push({ timestamp, value: Number(val) });
          }
        });

        this.aggregatedData.set(key, trends);
      });
    } catch (error) {
      console.error('❌ Failed to load historical metrics:', error);
    }
  }

  /**
   * Compute baseline metrics from historical data
   */
  async computeBaselines() {
    console.log('📊 Computing advanced baseline metrics (Mean, StdDev, MAD)...');

    for (const [key, trends] of this.aggregatedData.entries()) {
      if (!key.startsWith('trends:')) continue;

      const serverId = key.replace('trends:', '');
      const baseline: Record<string, MetricBaseline> = {};

      (Object.entries(trends) as [string, MetricPoint[]][]).forEach(([metric, data]) => {
        if (data.length < 5) return;

        const values = data.map(p => p.value).sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;

        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        const median = values[Math.floor(values.length / 2)];

        // Calculate MAD (Median Absolute Deviation)
        const absoluteDeviations = values.map(v => Math.abs(v - median)).sort((a, b) => a - b);
        const mad = absoluteDeviations[Math.floor(absoluteDeviations.length / 2)];

        baseline[metric] = { mean, stdDev, median, mad };
      });

      if (Object.keys(baseline).length > 0) {
        this.aggregatedData.set(`baseline:${serverId}`, baseline);
      }
    }
  }

  /**
   * Start aggregation timer
   */
  startAggregationTimer() {
    setInterval(() => this.aggregateData(), this.config.aggregationInterval);
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
   * Process cached data for persistent storage and long-term analysis
   */
  processCachedData(): number {
    let processed = 0;
    const toPersist: any[] = [];

    for (const [key, data] of this.dataCache.entries()) {
      if (!data.processed) {
        toPersist.push(data);
        data.processed = true;
        processed++;
      }
    }

    if (this.db && toPersist.length > 0) {
      // Background persistence (async)
      this.persistMetrics(toPersist).catch(err => console.error('❌ Persistence error:', err));
    }

    return processed;
  }

  /**
   * Persist metrics to database
   */
  private async persistMetrics(metrics: any[]) {
    if (!this.db || !this.db.isConnected) return;

    for (const m of metrics) {
      await this.db.query(
        'INSERT INTO server_metrics (server_id, cpu_usage, memory_usage, disk_usage, response_time, uptime) VALUES (?, ?, ?, ?, ?, ?)',
        [m.serverId, m.cpuUsage, m.memoryUsage, m.diskUsage, m.responseTime, m.status === 'online' ? 100 : 0]
      );
    }
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
  exportData(format = 'json'): string {
    const data = {
      aggregatedData: Object.fromEntries(this.aggregatedData),
      anomalies: this.anomalies,
      predictions: Object.fromEntries(this.predictions),
      reports: Object.fromEntries(this.reports)
    };

    if (format === 'csv') {
      return 'CSV not implemented for advanced data';
    }

    return JSON.stringify(data, null, 2);
  }
}

export default AnalyticsEngine;

