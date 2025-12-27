import React, { useState, useEffect, useRef, useMemo } from 'react';
import styles from './StatusChart.module.css';

/**
 * Real-time Status Chart Component
 * Displays server status over time with interactive features
 */
const StatusChart = ({ 
  serverId, 
  timeframe = '24h', 
  height = 200, 
  showLegend = true,
  className = '' 
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });
  const [tooltip, setTooltip] = useState(null);

  // Status colors (memoized to prevent recreation each render for effect deps)
  const statusColors = useMemo(() => ({
    online: '#10B981',    // green
    offline: '#EF4444',   // red
    error: '#F59E0B',     // amber
    unknown: '#6B7280'    // gray
  }), []);

  // Resize observer for responsive charts
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
        const response = await fetch(`/api/metrics/${serverId}?timeframe=${timeframe}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        
        const metrics = await response.json();
        setData(metrics.history || []);
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
      const interval = setInterval(fetchMetrics, 30000); // Update every 30s
      return () => clearInterval(interval);
    }
  }, [serverId, timeframe]);

  // Draw chart
  useEffect(() => {
    if (!canvasRef.current || !data.length || dimensions.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = dimensions;

    // Set canvas size
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Chart margins
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Draw background
    ctx.fillStyle = '#F9FAFB';
    ctx.fillRect(margin.left, margin.top, chartWidth, chartHeight);

    // Draw grid lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;

    // Vertical grid lines (time)
    const timeSteps = Math.min(10, data.length);
    for (let i = 0; i <= timeSteps; i++) {
      const x = margin.left + (i / timeSteps) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
    }

    // Horizontal grid lines (status levels)
    const statusLevels = ['offline', 'error', 'online'];
    statusLevels.forEach((status, i) => {
      const yPos = margin.top + chartHeight - ((i + 1) / 4) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(margin.left, yPos);
      ctx.lineTo(margin.left + chartWidth, yPos);
      ctx.stroke();
    });

    // Draw status timeline
    if (data.length > 1) {
      const pointWidth = chartWidth / (data.length - 1);
      
      data.forEach((point, index) => {
        if (index === 0) return;
        
        const prevPoint = data[index - 1];
        const x1 = margin.left + (index - 1) * pointWidth;
        const x2 = margin.left + index * pointWidth;
        
        // Calculate y position based on status
        const getStatusY = (status) => {
          const statusMap = { offline: 0.8, error: 0.5, online: 0.2 };
          return margin.top + chartHeight * (statusMap[status] || 0.9);
        };
        
        const y1 = getStatusY(prevPoint.status);
        const y2 = getStatusY(point.status);
        
        // Draw line segment
        ctx.strokeStyle = statusColors[point.status] || statusColors.unknown;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // Draw data point
        ctx.fillStyle = statusColors[point.status] || statusColors.unknown;
        ctx.beginPath();
        ctx.arc(x2, y2, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw axes labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';

    // Time labels
    const timeLabels = getTimeLabels(data, timeframe);
    timeLabels.forEach((label, i) => {
      const x = margin.left + (i / (timeLabels.length - 1)) * chartWidth;
      ctx.fillText(label, x, height - 10);
    });

    // Status labels
    ctx.textAlign = 'right';
    statusLevels.forEach((status, i) => {
      const yPos = margin.top + chartHeight - ((i + 1) / 4) * chartHeight + 4;
      ctx.fillText(status.toUpperCase(), margin.left - 10, yPos);
    });

  }, [data, dimensions, statusColors, timeframe]);

  // Generate time labels based on timeframe
  const getTimeLabels = (data, timeframe) => {
    if (!data.length) return [];
    
    const count = Math.min(6, data.length);
    const labels = [];
    
    for (let i = 0; i < count; i++) {
      const index = Math.floor((i / (count - 1)) * (data.length - 1));
      const point = data[index];
      if (point) {
        const date = new Date(point.timestamp);
        if (timeframe === '1h') {
          labels.push(date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }));
        } else {
          labels.push(date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }));
        }
      }
    }
    
    return labels;
  };

  // Handle mouse events for tooltip
  const handleMouseMove = (event) => {
    if (!canvasRef.current || !data.length) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
  // const y = event.clientY - rect.top; // removed unused variable
    
    // Calculate which data point is closest
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = dimensions.width - margin.left - margin.right;
    const pointWidth = chartWidth / (data.length - 1);
    
    const index = Math.round((x - margin.left) / pointWidth);
    const point = data[index];
    
    if (point && index >= 0 && index < data.length) {
      setTooltip({
        x: event.clientX,
        y: event.clientY,
        data: point
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  if (loading) {
    return (
      <div className={`${styles.container} ${className}`} ref={containerRef}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Loading chart data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.container} ${className}`} ref={containerRef}>
        <div className={styles.error}>
          <span>⚠️ Error loading chart: {error}</span>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={`${styles.container} ${className}`} ref={containerRef}>
        <div className={styles.noData}>
          <span>📊 No data available for the selected timeframe</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`} ref={containerRef}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      
      {showLegend && (
        <div className={styles.legend}>
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className={styles.legendItem}>
              <div 
                className={styles.legendColor}
                style={{ backgroundColor: color }}
              />
              <span className={styles.legendLabel}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {tooltip && (
        <div 
          className={styles.tooltip}
          style={{
            left: tooltip.x - 10,
            top: tooltip.y - 60
          }}
        >
          <div className={styles.tooltipContent}>
            <div className={styles.tooltipStatus}>
              <div 
                className={styles.tooltipStatusIndicator}
                style={{ backgroundColor: statusColors[tooltip.data.status] }}
              />
              <span>{tooltip.data.status.toUpperCase()}</span>
            </div>
            <div className={styles.tooltipTime}>
              {new Date(tooltip.data.timestamp).toLocaleString()}
            </div>
            {tooltip.data.responseTime && (
              <div className={styles.tooltipResponse}>
                Response: {tooltip.data.responseTime}ms
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusChart;
