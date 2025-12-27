/**
 * Homelab Dashboard - Unified Production Server
 * MariaDB + Redis + Express + WebSocket Integration
 * Bu dosya tüm özellikler için tek nokta server'dır
 */

import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
// removed unused imports
import multer from 'multer';
import sharp from 'sharp';
import { z } from 'zod';
import { config } from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketServer } from 'ws';

// Phase 2 Services Import
import DatabaseManager from './src/services/databaseManager.js';
import CacheManager from './src/services/cacheManager.js';
import AnalyticsEngine from './src/services/analyticsEngine.js';
import EnhancedStatusMonitor from './src/services/enhancedStatusMonitor.js';
import StatusMonitor from './src/services/statusMonitor.js';
import monitoringRouter from './src/routes/monitoring.js';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Environment variables with defaults
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
// Support multiple allowed origins via ALLOWED_ORIGINS (comma separated) while keeping backward compatibility
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || CORS_ORIGIN)
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || '10mb';

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Initialize a raw WebSocketServer at /ws to support native WebSocket clients
// (the frontend has a native WebSocket implementation that expects a /ws endpoint)
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  try {
    console.log(`🔌 Raw WebSocket client connected: ${req.socket.remoteAddress}`);

    // Send initial statuses to the client
    (async () => {
      try {
        let servers = [];
        if (databaseManager?.isConnected) {
          servers = await databaseManager.getAllServers();
        } else {
          servers = serverConfig.servers || [];
        }

        const statuses = {};
        servers.forEach(s => { statuses[s.id] = s.status || 'pending'; });

        ws.send(JSON.stringify({ type: 'status_update', payload: statuses }));
      } catch (err) {
        console.error('❌ Error sending initial WS statuses:', err);
      }
    })();

    ws.on('message', async (message) => {
      try {
        const { type, payload } = JSON.parse(message);

        // Heartbeat: respond to ping with pong to keep client connection alive
        if (type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        if (type === 'request_status') {
          let servers = [];
          if (databaseManager?.isConnected) {
            servers = await databaseManager.getAllServers();
          } else {
            servers = serverConfig.servers || [];
          }

          const statuses = {};
          servers.forEach(s => { statuses[s.id] = s.status || 'pending'; });
          ws.send(JSON.stringify({ type: 'status_update', payload: statuses }));
        }

        if (type === 'ping_server' && payload?.serverId) {
          // Simple echo response for ping requests
          ws.send(JSON.stringify({ type: 'status_update', payload: { [payload.serverId]: 'online' } }));
        }
      } catch (err) {
        console.error('❌ Raw WS message parse error:', err);
      }
    });

    ws.on('close', () => {
      console.log('🔌 Raw WebSocket client disconnected');
    });

    ws.on('error', (err) => {
      console.error('❌ Raw WebSocket client error:', err);
    });

  } catch (err) {
    console.error('❌ Error in raw WS connection handler:', err);
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`🔌 WebSocket client connected: ${socket.id}`);

  // Send initial status when client connects
  socket.on('request_status', async () => {
    try {
      let servers = [];
      if (databaseManager.isConnected) {
        servers = await databaseManager.getAllServers();
      } else {
        servers = serverConfig.servers || [];
      }

      const statuses = {};
      servers.forEach(server => {
        statuses[server.id] = server.status || 'pending';
      });

      socket.emit('status_update', statuses);
    } catch (error) {
      console.error('WebSocket status request error:', error);
    }
  });

  // Handle ping server request
  socket.on('ping_server', async (data) => {
    console.log(`📡 Ping request for server: ${data.serverId}`);
    // For now, just send back current status
    // In future, this could trigger actual ping
    socket.emit('status_update', { [data.serverId]: 'online' });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
  });
});

// Initialize Phase 2 Services
const databaseManager = new DatabaseManager();
const cacheManager = new CacheManager();
const analyticsEngine = new AnalyticsEngine();

let statusMonitor = null;
let serverConfig = { servers: [] };

// Zod validation schemas
// Stricter validation for server objects (security & consistency)
const serverSchema = z.object({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  url: z.string()
    .trim()
    .max(2048)
    .refine(v => /^https?:\/\//i.test(v), 'Only HTTP/HTTPS URLs allowed'),
  status: z.enum(['pending', 'online', 'offline']).optional().default('pending'),
  icon: z.string().max(100).optional(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string().min(1).max(50)).max(25).optional(),
});

// removed unused layoutItemSchema (not referenced)

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsPath = join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = file.originalname.split('.').pop();
    cb(null, `custom-${timestamp}.${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  }
});

// Middleware
// Dynamic CORS with explicit allow-list (first hardening pass)
const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser or same-origin requests (no origin header)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json({ limit: MAX_FILE_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_FILE_SIZE }));

// Monitoring API routes
app.use('/api/monitoring', monitoringRouter);

// Development convenience: Static file serving for production mode
// In development, serve static files but don't redirect automatically
if (NODE_ENV === 'development') {
  // Only redirect root path, not all HTML requests
  app.get('/', (req, res) => {
    // Check if this is a browser request (not API)
    if (req.accepts('html')) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Homelab Dashboard - Development</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; }
              .container { max-width: 600px; margin: 0 auto; text-align: center; }
              .btn { display: inline-block; padding: 12px 24px; margin: 8px; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
              .btn-primary { background: #3b82f6; }
              .btn-secondary { background: #6b7280; }
              .status { margin: 20px 0; padding: 16px; background: #f3f4f6; border-radius: 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🏠 Homelab Dashboard</h1>
              <div class="status">
                <h3>Development Server Running</h3>
                <p>Backend API: <strong>http://localhost:3001</strong></p>
                <p>Frontend Dev: <strong>http://localhost:5173</strong></p>
              </div>
              <div>
                <a href="http://localhost:5173" class="btn btn-primary" target="_blank">Open Frontend (Vite)</a>
                <a href="/api/health" class="btn btn-secondary">Health Check</a>
              </div>
            </div>
          </body>
        </html>
      `);
    }
    res.status(200).send('Homelab Dashboard API Server');
  });
}

// Serve static files
app.use(express.static(join(__dirname, 'dist')));
app.use('/assets', express.static(join(__dirname, 'src', 'assets')));
// Serve uploads (user uploaded images)
app.use('/uploads', express.static(join(__dirname, 'public', 'uploads')));

// Load server configuration from database or fallback
async function loadServerConfiguration() {
  try {
    if (databaseManager.isConnected) {
      const servers = await databaseManager.getAllServers();
      serverConfig = { servers: servers || [] };
      console.log(`📊 Loaded ${servers.length} servers from database`);
    } else {
      // Database not available - start with empty configuration
      console.log('⚠️ Database not initialized, starting with empty configuration');
      serverConfig = { servers: [] };
    }

    // Initialize status monitor with loaded config
    if (serverConfig.servers?.length > 0) {
      statusMonitor = new StatusMonitor({
        servers: serverConfig.servers,
        categories: serverConfig.categories || [],
        groups: serverConfig.groups || [],
      });
      global.statusMonitor = statusMonitor;
      // Start monitoring loop
      statusMonitor.startMonitoring();
    }
  } catch (err) { // renamed error -> err to avoid shadowing later lint unused var
    console.error('❌ Failed to load server configuration:', err);
    serverConfig = { servers: [] };
  }
}

// API Routes

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const health = {
      timestamp: new Date(),
      status: 'healthy',
      version: '2.0.0',
      services: {
        database: await databaseManager.healthCheck(),
        cache: await cacheManager.healthCheck(),
        monitoring: statusMonitor ? { healthy: true } : { healthy: false, message: 'No servers configured' }
      }
    };

    res.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Get all servers
app.get('/api/servers', async (req, res) => {
  try {
    let servers = [];

    if (databaseManager.isConnected) {
      servers = await databaseManager.getAllServers();
    } else {
      servers = serverConfig.servers || [];
    }

    // Add real-time status if monitor is available
    if (statusMonitor) {
      const statuses = statusMonitor.getAllServerStatuses();
      servers = servers.map(server => ({
        ...server,
        ...(statuses[server.id] || { status: 'pending' })
      }));
    }

    res.json(servers);
  } catch (error) {
    console.error('API Error - Get servers:', error);
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

// Get data for frontend (categories, groups, servers, settings)
app.get('/api/data', async (req, res) => {
  try {
    // Debug: log each incoming request so frontend fetches are visible in server logs
    console.info('[API] /api/data requested', { ip: req.ip, ua: req.get('user-agent'), referer: req.get('referer'), time: new Date().toISOString() });
    let servers = [];
    let categories = [];
    let groups = [];

    if (databaseManager.isConnected) {
      // Get data from database
      servers = await databaseManager.getAllServers();

      // Get categories
      try {
        categories = await databaseManager.getAllCategories();
      } catch (error) {
        console.warn('Categories fetch failed:', error);
        categories = [];
      }

      // Get groups  
      try {
        groups = await databaseManager.getAllGroups();
      } catch (error) {
        console.warn('Groups fetch failed:', error);
        groups = [];
      }
    } else {
      servers = serverConfig.servers || [];
      categories = [];
      groups = [];
    }

    // Transform data to frontend format
    const categoriesData = categories.map(cat => ({
      id: cat.id,
      // Provide UI-friendly fields
      title: cat.title || cat.name || null,
      name: cat.name,
      color: cat.color,
      iconName: cat.icon_name || cat.iconName || cat.icon || null,
      icon: cat.icon,
      // ensure servers and groups are arrays with minimal fields
      // Only include servers that belong to this category but NOT to any group
      servers: (servers.filter(s => s.category_id === cat.id && !s.group_id) || []).map(s => ({ id: s.id, name: s.name, url: s.url, status: s.status, ...s })),
      groups: (groups.filter(g => g.category_id === cat.id) || []).map(group => ({
        id: group.id,
        title: group.title || group.name || null,
        name: group.name,
        description: group.description,
        servers: (servers.filter(s => s.group_id === group.id) || []).map(s => ({ id: s.id, name: s.name, url: s.url, status: s.status, ...s }))
      })),
      layout: []
    }));

    // Add servers without category to "Uncategorized"
    const uncategorizedServers = servers.filter(s => !s.category_id);
    if (uncategorizedServers.length > 0) {
      categoriesData.push({
        id: 'uncategorized',
        title: 'Uncategorized',
        name: 'Uncategorized',
        color: '#757575',
        iconName: 'Package',
        icon: '📦',
        servers: (uncategorizedServers || []).map(s => ({ id: s.id, name: s.name, url: s.url, status: s.status, ...s })),
        groups: [],
        layout: []
      });
    }

    const data = {
      categories: categoriesData,
      settings: await (async () => {
        // Try to load settings from database
        if (databaseManager.isConnected) {
          try {
            const settingsRows = await databaseManager.query('SELECT settings_data FROM dashboard_settings LIMIT 1');
            if (settingsRows && settingsRows.length > 0) {
              return JSON.parse(settingsRows[0].settings_data);
            }
          } catch (error) {
            console.warn('Settings fetch from DB failed, using defaults:', error.message);
          }
        }

        // Fallback to local config if available
        try {
          const cfgPath = join(__dirname, 'src', 'data', 'config.json');
          if (fs.existsSync(cfgPath)) {
            const cfgRaw = fs.readFileSync(cfgPath, 'utf8');
            const localCfg = JSON.parse(cfgRaw);
            if (localCfg.settings) {
              return localCfg.settings;
            }
          }
        } catch (err) {
          console.warn('Local config settings load failed:', err);
        }

        // Ultimate fallback - default settings matching config.json structure
        return {
          theme: "system",
          accentColor: "blue",
          customAccent: "#3b82f6",
          customGradient: "linear-gradient(to right, #3b82f6, #06b6d4)",
          customShadow: "#06b6d480",
          animations: true,
          background: "default",
          font: "inter",
          linkBehavior: "newTab",
          customWallpaper: null,
          seedColor: "#3b82f6",
          wallpaperSettings: {
            blur: 0,
            brightness: 90
          },
          header: {
            showLogo: true,
            customLogo: null,
            showTitle: true,
            titleText: "Homelab Dashboard",
            showSubtitle: true,
            subtitleText: "Tüm servislerin tek yerden yönetimi",
            searchEngine: "google"
          },
          headerOpacity: 95,
          sidebarOpacity: 98,
          pingInterval: 30000,
          pingTimeout: 5000,
          gridDensity: "medium",
          gridColumns: null,
          cardSize: "medium",
          showCardDescriptions: true,
          showCardUrls: true,
          showCardStatus: true,
          showCardTags: true,
          showCardMetrics: true,
          sidebarAutoCollapse: false,
          customAccentColor: null,
          backgroundPattern: "none",
          cardOpacity: 100,
          cardBlur: 0,
          notifications: {
            enabled: true,
            position: "top-right",
            duration: 5000,
            soundEnabled: false,
            soundVolume: 50,
            soundType: "default",
            showProgress: true,
            minLevel: "all",
            categoryFilters: {
              status: true,
              performance: true,
              network: true,
              system: true
            }
          },
          sidebar: {
            position: "left",
            mode: "fixed",
            behavior: "always-visible",
            autoHideDelay: 3000,
            iconSize: "medium",
            density: "comfortable",
            showLabels: true,
            showBadges: true,
            showGroupCounts: true,
            collapsedWidth: 60,
            expandedWidth: 280,
            horizontalHeight: 80
          }
        };
      })()
    };

    res.json(data);
  } catch (error) {
    console.error('API Error - Get data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Save data (POST)
app.post('/api/data', async (req, res) => {
  try {
    const { settings } = req.body;

    console.log('📝 Data save request received');

    // Save settings if provided
    if (settings && databaseManager.isConnected) {
      // Create settings table if it doesn't exist
      await databaseManager.query(`
        CREATE TABLE IF NOT EXISTS dashboard_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          settings_data JSON NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Check if settings exist
      const existing = await databaseManager.query('SELECT id FROM dashboard_settings LIMIT 1');

      if (existing && existing.length > 0) {
        // Update existing settings
        await databaseManager.query(
          'UPDATE dashboard_settings SET settings_data = ? WHERE id = ?',
          [JSON.stringify(settings), existing[0].id]
        );
        console.log('✅ Settings updated in database');
      } else {
        // Insert new settings
        await databaseManager.query(
          'INSERT INTO dashboard_settings (settings_data) VALUES (?)',
          [JSON.stringify(settings)]
        );
        console.log('✅ Settings created in database');
      }
    }

    res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('API Error - Save data:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Get server statuses
app.get('/api/statuses', async (req, res) => {
  try {
    let servers = [];

    if (databaseManager.isConnected) {
      servers = await databaseManager.getAllServers();
    } else {
      servers = serverConfig.servers || [];
    }

    // Create status map
    const statuses = {};
    servers.forEach(server => {
      statuses[server.id] = server.status || 'pending';
    });

    res.json(statuses);
  } catch (error) {
    console.error('API Error - Get statuses:', error);
    res.status(500).json({ error: 'Failed to fetch statuses' });
  }
});

// Get specific server
app.get('/api/servers/:id', async (req, res) => {
  try {
    const serverId = req.params.id;

    let server = null;
    if (databaseManager.isConnected) {
      server = await databaseManager.getServer(serverId);
    } else {
      server = serverConfig.servers?.find(s => s.id === serverId);
    }

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Add real-time status and metrics
    if (statusMonitor) {
      const status = await statusMonitor.getServerStatus(serverId);
      const metrics = await statusMonitor.getServerMetrics(serverId);
      server = {
        ...server,
        ...status,
        metrics: {
          uptime: metrics.uptime || 0,
          avgResponseTime: metrics.averageResponseTime || 0,
          checksToday: metrics.checksToday || 0,
          lastHourChecks: metrics.lastHourChecks || 0
        }
      };
    }

    res.json(server);
  } catch (error) {
    console.error('API Error - Get server:', error);
    res.status(500).json({ error: 'Failed to fetch server' });
  }
});

// Add new server
app.post('/api/servers', async (req, res) => {
  try {
    const validatedServer = serverSchema.parse(req.body);

    if (databaseManager.isConnected) {
      const saved = await databaseManager.addServer(validatedServer);
      res.status(201).json(saved);
    } else {
      // Fallback to in-memory
      serverConfig.servers = serverConfig.servers || [];
      serverConfig.servers.push(validatedServer);
      res.status(201).json(validatedServer);
    }

    // Reload status monitor
    await loadServerConfiguration();

    console.log(`✅ Server added: ${validatedServer.name}`);
  } catch (error) {
    console.error('API Error - Add server:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to add server' });
  }
});

// Update server
app.put('/api/servers/:id', async (req, res) => {
  try {
    const serverId = req.params.id;
    const updates = serverSchema.partial().parse(req.body);

    if (databaseManager.isConnected) {
      const updated = await databaseManager.updateServer(serverId, updates);
      if (!updated) {
        return res.status(404).json({ error: 'Server not found' });
      }
      res.json(updated);
    } else {
      // Fallback to in-memory
      const serverIndex = serverConfig.servers?.findIndex(s => s.id === serverId);
      if (serverIndex === -1) {
        return res.status(404).json({ error: 'Server not found' });
      }

      serverConfig.servers[serverIndex] = { ...serverConfig.servers[serverIndex], ...updates };
      res.json(serverConfig.servers[serverIndex]);
    }

    // Reload status monitor
    await loadServerConfiguration();

    console.log(`✅ Server updated: ${serverId}`);
  } catch (error) {
    console.error('API Error - Update server:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update server' });
  }
});

// Delete server
app.delete('/api/servers/:id', async (req, res) => {
  try {
    const serverId = req.params.id;

    if (databaseManager.isConnected) {
      const deleted = await databaseManager.deleteServer(serverId);
      if (!deleted) {
        return res.status(404).json({ error: 'Server not found' });
      }
    } else {
      // Fallback to in-memory
      const serverIndex = serverConfig.servers?.findIndex(s => s.id === serverId);
      if (serverIndex === -1) {
        return res.status(404).json({ error: 'Server not found' });
      }

      serverConfig.servers.splice(serverIndex, 1);
    }

    // Reload status monitor
    await loadServerConfiguration();

    console.log(`✅ Server deleted: ${serverId}`);
    res.status(204).send();
  } catch (error) {
    console.error('API Error - Delete server:', error);
    res.status(500).json({ error: 'Failed to delete server' });
  }
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    let servers = [];
    if (databaseManager.isConnected) {
      servers = await databaseManager.getAllServers();
    } else {
      servers = serverConfig.servers || [];
    }

    const onlineCount = statusMonitor ?
      Array.from(Object.values(statusMonitor.getAllServerStatuses())).filter(s => s.status === 'online').length :
      0;

    const stats = {
      totalServers: servers.length,
      onlineServers: onlineCount,
      offlineServers: servers.length - onlineCount,
      database: {
        connected: databaseManager.isConnected,
        provider: databaseManager.isConnected ? 'mysql' : 'json'
      },
      cache: {
        connected: cacheManager.isConnected,
        provider: cacheManager.isConnected ? 'redis' : 'memory'
      },
      analytics: analyticsEngine.getStats()
    };

    res.json(stats);
  } catch (error) {
    console.error('API Error - Stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// --- CATEGORY ROUTES ---

app.post('/api/categories', async (req, res) => {
  try {
    if (databaseManager.isConnected) {
      const saved = await databaseManager.addCategory(req.body);
      res.status(201).json(saved);
    } else {
      // Fallback to in-memory (not fully implemented for categories, relying on POST /api/data for now)
      // But we should return the object to satisfy the frontend
      res.status(201).json(req.body);
    }
  } catch (error) {
    console.error('API Error - Add category:', error);
    res.status(500).json({ error: 'Failed to add category' });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    if (databaseManager.isConnected) {
      const updated = await databaseManager.updateCategory(req.params.id, req.body);
      res.json(updated);
    } else {
      res.json(req.body);
    }
  } catch (error) {
    console.error('API Error - Update category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    if (databaseManager.isConnected) {
      await databaseManager.deleteCategory(req.params.id);
      res.status(204).send();
    } else {
      res.status(204).send();
    }
  } catch (error) {
    console.error('API Error - Delete category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// --- GROUP ROUTES ---

app.post('/api/groups', async (req, res) => {
  try {
    if (databaseManager.isConnected) {
      const saved = await databaseManager.addGroup(req.body);
      res.status(201).json(saved);
    } else {
      res.status(201).json(req.body);
    }
  } catch (error) {
    console.error('API Error - Add group:', error);
    res.status(500).json({ error: 'Failed to add group' });
  }
});

app.put('/api/groups/:id', async (req, res) => {
  try {
    if (databaseManager.isConnected) {
      const updated = await databaseManager.updateGroup(req.params.id, req.body);
      res.json(updated);
    } else {
      res.json(req.body);
    }
  } catch (error) {
    console.error('API Error - Update group:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

app.delete('/api/groups/:id', async (req, res) => {
  try {
    if (databaseManager.isConnected) {
      await databaseManager.deleteGroup(req.params.id);
      res.status(204).send();
    } else {
      res.status(204).send();
    }
  } catch (error) {
    console.error('API Error - Delete group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { type } = req.body;

    let outputPath = req.file.path;
    let filename = '';
    let apiPath = '';

    if (type === 'wallpaper') {
      filename = 'custom-wallpaper.webp';
      outputPath = join(dirname(req.file.path), filename);
      apiPath = `/uploads/${filename}`;

      await sharp(req.file.path)
        .resize(1920, 1080, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(outputPath);

      if (outputPath !== req.file.path) {
        fs.unlinkSync(req.file.path);
      }
    } else if (type === 'logo') {
      filename = 'custom-logo.webp';
      outputPath = join(dirname(req.file.path), filename);
      apiPath = `/uploads/${filename}`;

      await sharp(req.file.path)
        .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 90 })
        .toFile(outputPath);

      if (outputPath !== req.file.path) {
        fs.unlinkSync(req.file.path);
      }
    } else {
      // Generic file upload
      filename = req.file.filename;
      apiPath = `/uploads/${filename}`;
    }

    res.json({
      success: true,
      filename: filename,
      path: apiPath,
      type: type
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// File delete endpoint
app.delete('/api/uploads/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    // Security check - only allow specific filenames
    const allowedFiles = ['custom-wallpaper.webp', 'custom-logo.webp'];
    if (!allowedFiles.includes(filename)) {
      return res.status(400).json({ error: 'File not allowed to be deleted' });
    }

    const filePath = join(__dirname, 'public', 'uploads', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Catch-all route for SPA vs Development
if (NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
} else {
  // Development catch-all for non-API routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found', path: req.path });
    }
    // For other routes, redirect to frontend development server
    res.redirect(`http://localhost:5173${req.path}`);
  });
}

// (Removed duplicate Socket.IO connection handler to prevent double listeners and noisy logs)

// Start server
async function startServer() {
  console.log('🚀 Homelab Dashboard Server Starting...');
  console.log(`🌐 Environment: ${NODE_ENV}`);
  console.log(`🌐 Port: ${PORT}`);

  try {
    // Initialize Phase 2 services
    console.log('\n📊 Initializing Services...');

    const dbResult = await databaseManager.initialize();
    console.log(`📊 Database: ${dbResult.provider} (${dbResult.success ? 'connected' : 'failed'})`);

    const cacheResult = await cacheManager.initialize();
    console.log(`🟥 Cache: ${cacheResult.provider} (${cacheResult.success ? 'connected' : 'failed'})`);

    await analyticsEngine.initialize();
    console.log('📈 Analytics: initialized');

    // Load server configuration
    await loadServerConfiguration();

    // Start server
    server.listen(PORT, () => {
      console.log('\n✅ Homelab Dashboard Server Running!');
      console.log('='.repeat(60));
      console.log(`🌐 Frontend: http://localhost:${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`🔧 Health: http://localhost:${PORT}/api/health`);
      console.log('='.repeat(60));
      console.log('🎉 Active Features:');
      console.log(`  ✅ Database: ${databaseManager.isConnected ? 'MariaDB/MySQL' : 'JSON Fallback'}`);
      console.log(`  ✅ Cache: ${cacheManager.isConnected ? 'Redis/Valkey' : 'Memory Fallback'}`);
      console.log(`  ✅ Monitoring: ${statusMonitor ? 'Enabled' : 'No servers configured'}`);
      console.log(`  ✅ WebSockets: Enabled`);
      console.log(`  ✅ File Upload: Enabled`);
      console.log('='.repeat(60));
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n📴 Graceful shutdown initiated...');

  if (statusMonitor) {
    statusMonitor.stop();
  }

  await Promise.allSettled([
    databaseManager.close(),
    cacheManager.close()
  ]);

  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n📴 SIGTERM received, shutting down...');

  if (statusMonitor) {
    statusMonitor.stop();
  }

  await Promise.allSettled([
    databaseManager.close(),
    cacheManager.close()
  ]);

  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();
