/**
 * Enhanced Monitoring API Routes
 * Provides comprehensive endpoints for monitoring data, alerts, and metrics
 */

import express from 'express';

const router = express.Router();

// Get statusMonitor from global scope
const getStatusMonitor = () => {
  if (global.statusMonitor) {
    return global.statusMonitor;
  }
  throw new Error('StatusMonitor not initialized');
};

/**
 * Get comprehensive monitoring overview
 * GET /api/monitoring/overview
 */
router.get('/overview', async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const statusMonitor = getStatusMonitor();
    
    const stats = statusMonitor.getMonitoringStats();
    const metricsOverview = statusMonitor.metricsCollector.getServicesOverview(timeframe);
    const recentAlerts = statusMonitor.alertManager.getRecentAlerts(24);
    const systemHealth = statusMonitor.metricsCollector.getSystemHealth();

    res.json({
      success: true,
      data: {
        stats,
        metrics: metricsOverview,
        alerts: recentAlerts,
        systemHealth,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting monitoring overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get monitoring overview',
      message: error.message
    });
  }
});

/**
 * Get server status with detailed information
 * GET /api/monitoring/servers/:serverId/status
 */
router.get('/servers/:serverId/status', async (req, res) => {
  try {
    const { serverId } = req.params;
    const statusMonitor = getStatusMonitor();
    const statusData = statusMonitor.getServerStatus(serverId);
    
    if (!statusData) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }

    res.json({
      success: true,
      data: statusData
    });
  } catch (error) {
    console.error('Error getting server status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get server status',
      message: error.message
    });
  }
});

/**
 * Force check specific server
 * POST /api/monitoring/servers/:serverId/check
 */
router.post('/servers/:serverId/check', async (req, res) => {
  try {
    const { serverId } = req.params;
    const statusMonitor = getStatusMonitor();
    const result = await statusMonitor.forceCheckServer(serverId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error force checking server:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check server',
      message: error.message
    });
  }
});

/**
 * Force check all servers
 * POST /api/monitoring/servers/check-all
 */
router.post('/servers/check-all', async (req, res) => {
  try {
    console.log('🔄 Force checking all servers via API...');
    const statusMonitor = getStatusMonitor();
    const results = await statusMonitor.updateAllServerStatuses(true);
    
    res.json({
      success: true,
      data: {
        message: 'All servers checked successfully',
        results,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error force checking all servers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check all servers',
      message: error.message
    });
  }
});

/**
 * Get server metrics
 * GET /api/metrics/:serverId
 */
router.get('/metrics/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { timeframe = '24h', type = 'responseTime' } = req.query;
    const statusMonitor = getStatusMonitor();
    
    const metrics = statusMonitor.metricsCollector.getServiceMetrics(serverId, timeframe);
    
    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'Metrics not found for server'
      });
    }

    // Filter by specific metric type if requested
    let data = metrics.history || [];
    let stats = null;

    if (type && type !== 'all') {
      data = data.map(point => ({
        timestamp: point.timestamp,
        value: point[type] || point.responseTime || 0
      })).filter(point => point.value != null);

      // Calculate stats for the specific metric
      if (data.length > 0) {
        const values = data.map(d => d.value);
        stats = {
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        };
      }
    }

    res.json({
      success: true,
      data,
      stats,
      serverId,
      timeframe,
      type
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      message: error.message
    });
  }
});

/**
 * Get aggregated metrics for all services
 * GET /api/metrics/overview
 */
router.get('/metrics/overview', async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const statusMonitor = getStatusMonitor();
    const overview = statusMonitor.metricsCollector.getServicesOverview(timeframe);
    
    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Error getting metrics overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics overview',
      message: error.message
    });
  }
});

/**
 * Export metrics data
 * GET /api/metrics/export
 */
router.get('/metrics/export', async (req, res) => {
  try {
    const { format = 'json', timeframe = '24h' } = req.query;
    const statusMonitor = getStatusMonitor();
    const exportData = await statusMonitor.exportMonitoringData(format, timeframe);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=monitoring-data-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(exportData);
    } else {
      res.json({
        success: true,
        data: exportData
      });
    }
  } catch (error) {
    console.error('Error exporting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export metrics',
      message: error.message
    });
  }
});

/**
 * Get alerts for specific server or all
 * GET /api/alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const { serverId, limit = 50, severity, status } = req.query;
    const statusMonitor = getStatusMonitor();
    const alerts = statusMonitor.alertManager.getRecentAlerts(serverId, parseInt(limit));
    
    // Filter by severity and status if provided
    let filteredAlerts = alerts;
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    if (status) {
      filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
    }

    res.json({
      success: true,
      data: filteredAlerts,
      total: filteredAlerts.length
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts',
      message: error.message
    });
  }
});

/**
 * Silence alerts for specific server
 * POST /api/alerts/silence
 */
router.post('/alerts/silence', async (req, res) => {
  try {
    const { serverId, duration, reason } = req.body;
    
    if (!serverId || !duration) {
      return res.status(400).json({
        success: false,
        error: 'Server ID and duration are required'
      });
    }

    const statusMonitor = getStatusMonitor();
    statusMonitor.alertManager.silenceAlerts(serverId, duration, reason);
    
    res.json({
      success: true,
      data: {
        serverId,
        silencedUntil: new Date(Date.now() + duration * 60000).toISOString(),
        reason: reason || 'Manual silence via API'
      }
    });
  } catch (error) {
    console.error('Error silencing alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to silence alerts',
      message: error.message
    });
  }
});

/**
 * Configure alert settings
 * POST /api/alerts/configure
 */
router.post('/alerts/configure', async (req, res) => {
  try {
    const { 
      emailEnabled, 
      emailConfig, 
      webhookEnabled, 
      webhookUrl,
      discordEnabled,
      discordWebhook,
      slackEnabled,
      slackWebhook,
      pushoverEnabled,
      pushoverConfig,
      alertThresholds
    } = req.body;

    const statusMonitor = getStatusMonitor();

    // Update alert manager configuration
    if (emailEnabled !== undefined) {
      statusMonitor.alertManager.emailEnabled = emailEnabled;
      if (emailConfig) {
        statusMonitor.alertManager.emailConfig = { ...statusMonitor.alertManager.emailConfig, ...emailConfig };
      }
    }

    if (webhookEnabled !== undefined) {
      statusMonitor.alertManager.webhookEnabled = webhookEnabled;
      if (webhookUrl) {
        statusMonitor.alertManager.webhookUrl = webhookUrl;
      }
    }

    if (discordEnabled !== undefined) {
      statusMonitor.alertManager.discordEnabled = discordEnabled;
      if (discordWebhook) {
        statusMonitor.alertManager.discordWebhook = discordWebhook;
      }
    }

    if (slackEnabled !== undefined) {
      statusMonitor.alertManager.slackEnabled = slackEnabled;
      if (slackWebhook) {
        statusMonitor.alertManager.slackWebhook = slackWebhook;
      }
    }

    if (pushoverEnabled !== undefined) {
      statusMonitor.alertManager.pushoverEnabled = pushoverEnabled;
      if (pushoverConfig) {
        statusMonitor.alertManager.pushoverConfig = { ...statusMonitor.alertManager.pushoverConfig, ...pushoverConfig };
      }
    }

    if (alertThresholds) {
      statusMonitor.alertManager.alertThresholds = { ...statusMonitor.alertManager.alertThresholds, ...alertThresholds };
    }

    // Save configuration
    await statusMonitor.alertManager.saveConfiguration();

    res.json({
      success: true,
      data: {
        message: 'Alert configuration updated successfully',
        activeChannels: statusMonitor.alertManager.getActiveChannels()
      }
    });
  } catch (error) {
    console.error('Error configuring alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to configure alerts',
      message: error.message
    });
  }
});

/**
 * Test alert configuration
 * POST /api/alerts/test
 */
router.post('/alerts/test', async (req, res) => {
  try {
    const { channel } = req.body;
    const statusMonitor = getStatusMonitor();
    
    const testAlert = {
      serverId: 'test-server',
      serverName: 'Test Server',
      severity: 'info',
      status: 'offline',
      previousStatus: 'online',
      message: 'This is a test alert from the monitoring system',
      timestamp: new Date(),
      details: {
        responseTime: 0,
        testAlert: true
      }
    };

    if (channel === 'email') {
      await statusMonitor.alertManager.sendEmailAlert(testAlert);
    } else if (channel === 'webhook') {
      await statusMonitor.alertManager.sendWebhookAlert(testAlert);
    } else if (channel === 'discord') {
      await statusMonitor.alertManager.sendDiscordAlert(testAlert);
    } else if (channel === 'slack') {
      await statusMonitor.alertManager.sendSlackAlert(testAlert);
    } else if (channel === 'pushover') {
      await statusMonitor.alertManager.sendPushoverAlert(testAlert);
    } else {
      // Test all configured channels
      await statusMonitor.alertManager.sendAlert(testAlert);
    }

    res.json({
      success: true,
      data: {
        message: `Test alert sent successfully${channel ? ` via ${channel}` : ' to all configured channels'}`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error sending test alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test alert',
      message: error.message
    });
  }
});

/**
 * Get system health metrics
 * GET /api/monitoring/health
 */
router.get('/health', async (req, res) => {
  try {
    const statusMonitor = getStatusMonitor();
    const systemHealth = statusMonitor.metricsCollector.getSystemHealth();
    const monitoringStats = statusMonitor.getMonitoringStats();
    
    const healthData = {
      ...systemHealth,
      monitoring: {
        ...monitoringStats,
        isRunning: statusMonitor.monitoringInterval !== null,
        connectedClients: statusMonitor.clients.size
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: healthData
    });
  } catch (error) {
    console.error('Error getting system health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system health',
      message: error.message
    });
  }
});

export default router;
