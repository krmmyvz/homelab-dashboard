import React, { useState, useEffect, useRef } from 'react';
import styles from './MetricsChart.module.css';

/**
 * Advanced Metrics Chart Component
 * Displays response time, uptime, and performance metrics
 */
const MetricsChart = ({ 
  serverId, 
  metricType = 'responseTime', 
  timeframe = '24h',
  height = 250,
  showControls = true,
  className = ''
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(metricType);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });
  const [tooltip, setTooltip] = useState(null);
  const [stats, setStats] = useState(null);

  // Metric configurations
  const metricConfigs = {
    responseTime: {
      label: 'Response Time',
      unit: 'ms',
      color: '#3B82F6',
      lineColor: '#60A5FA',
      fillColor: 'rgba(59, 130, 246, 0.1)',
      format: (value) => `${Math.round(value)}ms`
    },
    uptime: {
      label: 'Uptime',
      unit: '%',
      color: '#10B981',
      lineColor: '#34D399',
      fillColor: 'rgba(16, 185, 129, 0.1)',
      format: (value) => `${Math.round(value * 100) / 100}%`
    },
    availability: {
      label: 'Availability',
      unit: '%',
      color: '#8B5CF6',
      lineColor: '#A78BFA',
      fillColor: 'rgba(139, 92, 246, 0.1)',
      format: (value) => `${Math.round(value * 100) / 100}%`
    },
    errorRate: {
      label: 'Error Rate',
      unit: '%',
      color: '#EF4444',
      lineColor: '#F87171',
      fillColor: 'rgba(239, 68, 68, 0.1)',
      format: (value) => `${Math.round(value * 100) / 100}%`
    }
  };

  const currentConfig = metricConfigs[selectedMetric];

  // Resize observer
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width } = entries[0].contentRect;
        setDimensions({ width: width - 20, height });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [height]);

  // Fetch metrics data
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/metrics/${serverId}?type=${selectedMetric}&timeframe=${timeframe}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        
        const result = await response.json();
        setData(result.data || []);
        setStats(result.stats || null);
        setError(null);
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (serverId) {
      fetchMetrics();
      const interval = setInterval(fetchMetrics, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [serverId, selectedMetric, timeframe]);

  // Calculate statistics
  const calculateStats = (data) => {
    if (!data.length) return null;

    const values = data.map(d => d.value).filter(v => v != null);
    if (!values.length) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate median
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    // Calculate 95th percentile
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95 = sorted[p95Index] || max;

    return { avg, min, max, median, p95, count: values.length };
  };

  // Draw chart
  useEffect(() => {
    if (!canvasRef.current || !data.length || dimensions.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = dimensions;

    // Set canvas size for high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Chart margins
    const margin = { top: 20, right: 30, bottom: 50, left: 70 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Data processing
    const values = data.map(d => d.value).filter(v => v != null);
    if (!values.length) return;

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;
    const padding = valueRange * 0.1;

    // Scales
    const xScale = (index) => margin.left + (index / (data.length - 1)) * chartWidth;
    const yScale = (value) => margin.top + chartHeight - ((value - minValue + padding) / (valueRange + 2 * padding)) * chartHeight;

    // Draw background
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(margin.left, margin.top, chartWidth, chartHeight);

    // Draw grid
    drawGrid(ctx, margin, chartWidth, chartHeight, minValue, maxValue, data.length);

    // Draw area fill
    if (data.length > 1) {
      ctx.beginPath();
      ctx.moveTo(xScale(0), yScale(data[0].value));
      
      data.forEach((point, index) => {
        if (point.value != null) {
          ctx.lineTo(xScale(index), yScale(point.value));
        }
      });
      
      ctx.lineTo(xScale(data.length - 1), margin.top + chartHeight);
      ctx.lineTo(xScale(0), margin.top + chartHeight);
      ctx.closePath();
      
      ctx.fillStyle = currentConfig.fillColor;
      ctx.fill();
    }

    // Draw line
    ctx.strokeStyle = currentConfig.lineColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    let firstPoint = true;
    
    data.forEach((point, index) => {
      if (point.value != null) {
        const x = xScale(index);
        const y = yScale(point.value);
        
        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
    });
    
    ctx.stroke();

    // Draw data points
    data.forEach((point, index) => {
      if (point.value != null) {
        const x = xScale(index);
        const y = yScale(point.value);
        
        ctx.fillStyle = currentConfig.color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Highlight point for tooltip
        if (tooltip && tooltip.index === index) {
          ctx.strokeStyle = currentConfig.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    });

    // Draw axes
    drawAxes(ctx, margin, chartWidth, chartHeight, minValue, maxValue, data, currentConfig);

  }, [data, dimensions, selectedMetric, tooltip, currentConfig]);

  // Grid drawing helper
  const drawGrid = (ctx, margin, chartWidth, chartHeight, minValue, maxValue, dataLength) => {
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const y = margin.top + (i / steps) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines
    const timeSteps = Math.min(6, dataLength);
    for (let i = 0; i <= timeSteps; i++) {
      const x = margin.left + (i / timeSteps) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
    }
  };

  // Axes drawing helper
  const drawAxes = (ctx, margin, chartWidth, chartHeight, minValue, maxValue, data, config) => {
    ctx.fillStyle = '#374151';
    ctx.font = '12px Inter, system-ui, sans-serif';

    // Y-axis labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    const steps = 5;
    const valueRange = maxValue - minValue || 1;
    const padding = valueRange * 0.1;
    
    for (let i = 0; i <= steps; i++) {
      const value = minValue - padding + (i / steps) * (valueRange + 2 * padding);
      const y = margin.top + chartHeight - (i / steps) * chartHeight;
      ctx.fillText(config.format(value), margin.left - 10, y);
    }

    // X-axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const timeSteps = Math.min(6, data.length);
    for (let i = 0; i <= timeSteps; i++) {
      const index = Math.floor((i / timeSteps) * (data.length - 1));
      const point = data[index];
      if (point) {
        const x = margin.left + (i / timeSteps) * chartWidth;
        const time = new Date(point.timestamp);
        const timeStr = time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        ctx.fillText(timeStr, x, margin.top + chartHeight + 10);
      }
    }

    // Axis title
    ctx.textAlign = 'center';
    ctx.font = '14px Inter, system-ui, sans-serif';
    ctx.fillText(config.label, margin.left + chartWidth / 2, margin.top + chartHeight + 35);
  };

  // Mouse event handlers
  const handleMouseMove = (event) => {
    if (!canvasRef.current || !data.length) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    
    const margin = { top: 20, right: 30, bottom: 50, left: 70 };
    const chartWidth = dimensions.width - margin.left - margin.right;
    const pointWidth = chartWidth / (data.length - 1);
    
    const index = Math.round((x - margin.left) / pointWidth);
    const point = data[index];
    
    if (point && index >= 0 && index < data.length && point.value != null) {
      setTooltip({
        x: event.clientX,
        y: event.clientY,
        index,
        data: point
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const currentStats = stats || calculateStats(data);

  if (loading) {
    return (
      <div className={`${styles.container} ${className}`} ref={containerRef}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Loading metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.container} ${className}`} ref={containerRef}>
        <div className={styles.error}>
          <span>⚠️ Error loading metrics: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`} ref={containerRef}>
      {showControls && (
        <div className={styles.header}>
          <div className={styles.controls}>
            <select 
              value={selectedMetric} 
              onChange={(e) => setSelectedMetric(e.target.value)}
              className={styles.select}
            >
              {Object.entries(metricConfigs).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          
          {currentStats && (
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Avg:</span>
                <span className={styles.statValue}>{currentConfig.format(currentStats.avg)}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>P95:</span>
                <span className={styles.statValue}>{currentConfig.format(currentStats.p95)}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Max:</span>
                <span className={styles.statValue}>{currentConfig.format(currentStats.max)}</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className={styles.chartContainer}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </div>
      
      {tooltip && (
        <div 
          className={styles.tooltip}
          style={{
            left: tooltip.x - 10,
            top: tooltip.y - 70
          }}
        >
          <div className={styles.tooltipContent}>
            <div className={styles.tooltipMetric}>
              <span className={styles.tooltipLabel}>{currentConfig.label}:</span>
              <span className={styles.tooltipValue}>
                {currentConfig.format(tooltip.data.value)}
              </span>
            </div>
            <div className={styles.tooltipTime}>
              {new Date(tooltip.data.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsChart;
