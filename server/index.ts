import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketServer } from 'ws';
import { config as dotenvConfig } from 'dotenv';

// Services
import DatabaseManager from './services/databaseManager';
import CacheManager from './services/cacheManager';
import AnalyticsEngine from './services/analyticsEngine';
import StatusMonitor from './services/statusMonitor';

// Routers
import { createServerRouter } from './routes/servers';
import { DataController } from './controllers/dataController';

dotenvConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || CORS_ORIGIN).split(',').map(o => o.trim()).filter(Boolean);

const app = express();
const httpServer = createServer(app);

// Services initialization
const db = new DatabaseManager();
const cache = new CacheManager();
const analytics = new AnalyticsEngine(db);

let statusMonitor: any = null;

// CORS - More permissive in development to allow IP-based access
app.use(cors({
    origin: (origin, callback) => {
        // Allow if no origin (local requests), if in development, or if in allow-list
        if (!origin || NODE_ENV === 'development' || ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Controllers
const dataController = new DataController(db);

// API Routes
app.use('/api/servers', createServerRouter(db));
app.get('/api/data', dataController.getData);
app.post('/api/data', dataController.saveData);
app.get('/api/statuses', dataController.getStatuses);

app.get('/api/health', async (req, res) => {
    res.json({
        status: 'healthy',
        database: await db.healthCheck(),
        cache: await cache.healthCheck()
    });
});

// Static files - Served only by Vite in development
// app.use(express.static(join(__dirname, '../dist')));
app.use('/uploads', express.static(join(__dirname, '../public/uploads')));

// Middlewares & Globals for controllers
// @ts-ignore
global.reloadConfig = async () => {
    const servers = await db.getAllServers();
    if (statusMonitor) {
        statusMonitor.updateConfig({ servers });
    } else {
        statusMonitor = new StatusMonitor({ servers, categories: [], groups: [] });
        // @ts-ignore
        global.statusMonitor = statusMonitor;
        statusMonitor.startMonitoring();
    }
};


app.get('/api/health', async (req, res) => {
    res.json({
        status: 'healthy',
        database: await db.healthCheck(),
        cache: await cache.healthCheck()
    });
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
    console.error('🔥 Server Error:', err.message);
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Socket.IO
const io = new SocketIOServer(httpServer, {
    cors: { origin: ALLOWED_ORIGINS, credentials: true }
});

io.on('connection', (socket) => {
    console.log(`🔌 Socket.IO client connected: ${socket.id}`);
    socket.on('disconnect', () => console.log(`🔌 Socket.IO client disconnected: ${socket.id}`));
});

// Raw WebSocket (Temporary for compatibility)
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
wss.on('connection', (ws) => {
    console.log('🔌 Raw WS connected');
    ws.on('message', (msg) => {
        const { type } = JSON.parse(msg.toString());
        if (type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
    });
});

async function start() {
    await db.initialize();
    await cache.initialize();
    await analytics.initialize();

    // Initialize StatusMonitor
    const servers = await db.getAllServers();
    statusMonitor = new StatusMonitor({ servers });
    // @ts-ignore
    global.statusMonitor = statusMonitor;
    statusMonitor.startMonitoring();

    httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

start().catch(console.error);
