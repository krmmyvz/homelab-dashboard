#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import DatabaseManager from '../services/databaseManager';

// Load env
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new DatabaseManager();

async function migrate() {
    console.log('🚀 Starting data migration from config.json to MySQL...');

    try {
        // Init DB
        const dbResult = await db.initialize();
        if (dbResult?.success === false && dbResult?.provider !== 'mysql') {
            console.error('❌ Could not connect to MySQL. Is the docker container running?');
            process.exit(1);
        }

        // Read config.json
        const configPath = path.join(__dirname, '../../src/data/config.json');
        if (!fs.existsSync(configPath)) {
            console.error(`❌ Config file not found at ${configPath}`);
            process.exit(1);
        }

        const rawData = fs.readFileSync(configPath, 'utf8');
        const data = JSON.parse(rawData);

        // 1. Migrate Categories
        if (data.categories && Array.isArray(data.categories)) {
            console.log(`📂 Migrating ${data.categories.length} categories...`);
            for (const cat of data.categories) {
                try {
                    // Check if exists
                    const existing = await db.getCategory(cat.id);
                    if (existing) {
                        await db.updateCategory(cat.id, {
                            name: cat.name,
                            title: cat.title || cat.name,
                            color: cat.color || '#3b82f6',
                            icon: cat.icon || 'Folder',
                            iconName: cat.iconName || 'Folder',
                            layout: cat.layout || []
                        });
                        console.log(`  🔄 Updated category: ${cat.name}`);
                    } else {
                        await db.addCategory({
                            id: cat.id,
                            name: cat.name,
                            title: cat.title || cat.name,
                            color: cat.color || '#3b82f6',
                            icon: cat.icon || 'Folder',
                            iconName: cat.iconName || 'Folder',
                            layout: cat.layout || []
                        });
                        console.log(`  ✅ Added category: ${cat.name}`);
                    }
                } catch (err: any) {
                    console.error(`  ❌ Failed to migrate category ${cat.name}:`, err.message);
                }
            }
        }

        // 2. Migrate Servers
        if (data.servers && Array.isArray(data.servers)) {
            console.log(`🖥️ Migrating ${data.servers.length} servers...`);
            for (const server of data.servers) {
                try {
                    const existing = await db.getServer(server.id);
                    const serverData = {
                        id: server.id,
                        name: server.name,
                        description: server.description || '',
                        url: server.url,
                        status: server.status || 'pending',
                        icon: server.icon || null,
                        is_favorite: server.is_favorite || server.isFavorite || false,
                        tags: server.tags || [],
                        category_id: server.category_id || null,
                        group_id: server.group_id || null
                    };

                    if (existing) {
                        await db.updateServer(server.id, serverData);
                        console.log(`  🔄 Updated server: ${server.name}`);
                    } else {
                        await db.addServer(serverData);
                        console.log(`  ✅ Added server: ${server.name}`);
                    }
                } catch (err: any) {
                    console.error(`  ❌ Failed to migrate server ${server.name}:`, err.message);
                }
            }
        }

        console.log('\n✨ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await db.close();
        process.exit(0);
    }
}

migrate();
