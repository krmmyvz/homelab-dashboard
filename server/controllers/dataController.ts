import { Request, Response } from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import DatabaseManager from '../services/databaseManager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class DataController {
    private db: DatabaseManager;

    constructor(db: DatabaseManager) {
        this.db = db;
    }

    getData = async (req: Request, res: Response) => {
        try {
            console.info('[API] /api/data requested', { ip: req.ip, time: new Date().toISOString() });

            let servers = [];
            let categories = [];
            let groups = [];

            if (this.db.isConnected) {
                servers = await this.db.getAllServers();
                try {
                    categories = await this.db.getAllCategories() as any[];
                } catch (error) {
                    console.warn('Categories fetch failed:', error);
                }
                try {
                    groups = await this.db.getAllGroups() as any[];
                } catch (error) {
                    console.warn('Groups fetch failed:', error);
                }
            } else {
                return res.status(503).json({ error: 'Database not connected' });
            }

            // Transform data to frontend format
            const categoriesData: any[] = categories.map((cat: any) => ({
                id: cat.id,
                title: cat.title || cat.name || null,
                name: cat.name,
                color: cat.color,
                iconName: cat.icon_name || cat.iconName || cat.icon || null,
                icon: cat.icon,
                servers: (servers.filter((s: any) => s.category_id === cat.id && !s.group_id) || []).map((s: any) => ({ id: s.id, name: s.name, url: s.url, status: s.status, ...s })),
                groups: (groups.filter((g: any) => g.category_id === cat.id) || []).map((group: any) => ({
                    id: group.id,
                    title: group.title || group.name || null,
                    name: group.name,
                    description: group.description,
                    servers: (servers.filter((s: any) => s.group_id === group.id) || []).map((s: any) => ({ id: s.id, name: s.name, url: s.url, status: s.status, ...s }))
                })),
                layout: []
            }));

            // Uncategorized
            const uncategorizedServers = servers.filter((s: any) => !s.category_id);
            if (uncategorizedServers.length > 0) {
                categoriesData.push({
                    id: 'uncategorized',
                    title: 'Uncategorized',
                    name: 'Uncategorized',
                    color: '#757575',
                    iconName: 'Package',
                    icon: '📦',
                    servers: uncategorizedServers.map((s: any) => ({ id: s.id, name: s.name, url: s.url, status: s.status, ...s })),
                    groups: [],
                    layout: []
                });
            }

            const settings = await this.getSettings();

            res.json({
                categories: categoriesData,
                settings
            });
        } catch (error) {
            console.error('API Error - Get data:', error);
            res.status(500).json({ error: 'Failed to fetch data' });
        }
    };

    private async getSettings() {
        if (this.db.isConnected) {
            try {
                const settingsRows = await this.db.query('SELECT settings_data FROM dashboard_settings LIMIT 1') as any[];
                if (settingsRows && settingsRows.length > 0) {
                    return JSON.parse(settingsRows[0].settings_data);
                }
            } catch (error: any) {
                console.warn('Settings fetch from DB failed:', error.message);
            }
        }

        // No fallback to local config as requested
        return this.getDefaultSettings();

        return this.getDefaultSettings();
    }

    private getDefaultSettings() {
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
            wallpaperSettings: { blur: 0, brightness: 90 },
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
            cardSize: "medium",
            showCardDescriptions: true,
            showCardUrls: true,
            showCardStatus: true,
            showCardTags: true,
            showCardMetrics: true,
            sidebar: {
                position: "left",
                mode: "fixed",
                behavior: "always-visible",
                iconSize: "medium",
                density: "comfortable",
                showLabels: true,
                showBadges: true,
                showGroupCounts: true,
                collapsedWidth: 60,
                expandedWidth: 280,
            },
            notifications: {
                enabled: true,
                position: "top-right",
                duration: 5000,
                soundEnabled: false,
                minLevel: "all"
            }
        };
    }

    saveData = async (req: Request, res: Response) => {
        try {
            const { settings } = req.body;

            if (!this.db.isConnected) {
                return res.status(503).json({ error: 'Database not connected. Changes cannot be saved.' });
            }

            if (settings) {
                await this.db.query(`
          CREATE TABLE IF NOT EXISTS dashboard_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            settings_data JSON NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
                const existing = await this.db.query('SELECT id FROM dashboard_settings LIMIT 1') as any[];
                if (existing && existing.length > 0) {
                    await this.db.query('UPDATE dashboard_settings SET settings_data = ? WHERE id = ?', [JSON.stringify(settings), existing[0].id]);
                } else {
                    await this.db.query('INSERT INTO dashboard_settings (settings_data) VALUES (?)', [JSON.stringify(settings)]);
                }
            }
            res.json({ success: true, message: 'Data saved successfully' });
        } catch (error) {
            console.error('API Error - Save data:', error);
            res.status(500).json({ error: 'Failed to save data' });
        }
    };

    getStatuses = (req: Request, res: Response) => {
        try {
            // @ts-ignore
            const monitor = global.statusMonitor;
            if (!monitor) {
                return res.json({});
            }

            const rawStatuses = monitor.getAllServerStatuses();
            const formattedStatuses: Record<string, string> = {};

            for (const [id, data] of Object.entries(rawStatuses)) {
                // @ts-ignore
                formattedStatuses[id] = data.status;
            }

            res.json(formattedStatuses);
        } catch (error) {
            console.error('API Error - Get statuses:', error);
            res.status(500).json({ error: 'Failed to fetch statuses' });
        }
    };
}
