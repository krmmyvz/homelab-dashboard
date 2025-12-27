import { Request, Response } from 'express';
import { z } from 'zod';
import DatabaseManager from '../services/databaseManager';

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
    category_id: z.string().optional(),
    group_id: z.string().optional(),
});

export class ServerController {
    private db: DatabaseManager;

    constructor(db: DatabaseManager) {
        this.db = db;
    }

    getAllServers = async (req: Request, res: Response) => {
        try {
            const servers = await this.db.getAllServers();
            // Add real-time status if monitor is available (to be added via global or dependency)
            // @ts-ignore
            const statusMonitor = global.statusMonitor;
            if (statusMonitor) {
                const statuses = statusMonitor.getAllServerStatuses();
                const enrichedServers = servers.map((server: any) => ({
                    ...server,
                    ...(statuses[server.id] || { status: 'pending' })
                }));
                return res.json(enrichedServers);
            }
            res.json(servers);
        } catch (error) {
            console.error('API Error - Get servers:', error);
            res.status(500).json({ error: 'Failed to fetch servers' });
        }
    };

    getServerById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const server = await this.db.getServer(id);
            if (!server) {
                return res.status(404).json({ error: 'Server not found' });
            }

            // @ts-ignore
            const statusMonitor = global.statusMonitor;
            if (statusMonitor) {
                const status = await statusMonitor.getServerStatus(id);
                const metrics = await statusMonitor.getServerMetrics(id);
                return res.json({
                    ...server,
                    ...status,
                    metrics: {
                        uptime: metrics.uptime || 0,
                        avgResponseTime: metrics.averageResponseTime || 0,
                        checksToday: metrics.checksToday || 0,
                        lastHourChecks: metrics.lastHourChecks || 0
                    }
                });
            }
            res.json(server);
        } catch (error) {
            console.error('API Error - Get server:', error);
            res.status(500).json({ error: 'Failed to fetch server' });
        }
    };

    addServer = async (req: Request, res: Response) => {
        try {
            const validatedServer = serverSchema.parse(req.body);
            const saved = await this.db.addServer(validatedServer);

            // Reload status monitor notification (to be handled in index.ts via event or reload)
            // @ts-ignore
            if (global.reloadConfig) await global.reloadConfig();

            res.status(201).json(saved);
        } catch (error) {
            console.error('API Error - Add server:', error);
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: 'Validation failed', details: error.errors });
            }
            res.status(500).json({ error: 'Failed to add server' });
        }
    };

    updateServer = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const updates = serverSchema.partial().parse(req.body);
            const updated = await this.db.updateServer(id, updates);
            if (!updated) {
                return res.status(404).json({ error: 'Server not found' });
            }

            // @ts-ignore
            if (global.reloadConfig) await global.reloadConfig();

            res.json(updated);
        } catch (error) {
            console.error('API Error - Update server:', error);
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: 'Validation failed', details: error.errors });
            }
            res.status(500).json({ error: 'Failed to update server' });
        }
    };

    deleteServer = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const deleted = await this.db.deleteServer(id);
            if (!deleted) {
                return res.status(404).json({ error: 'Server not found' });
            }

            // @ts-ignore
            if (global.reloadConfig) await global.reloadConfig();

            res.status(204).send();
        } catch (error) {
            console.error('API Error - Delete server:', error);
            res.status(500).json({ error: 'Failed to delete server' });
        }
    };
}
