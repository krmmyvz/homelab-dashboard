
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import DatabaseManager from './src/services/databaseManager.js';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importBookmarks() {
    console.log('🚀 Starting bookmark import...');

    const dbManager = new DatabaseManager();
    const initResult = await dbManager.initialize();

    if (!initResult.success) {
        console.error('❌ Failed to initialize database:', initResult.error);
        // If MySQL fails, we can't really import to it. 
        // The user might be using JSON fallback, but DatabaseManager usually handles that internally?
        // Actually, DatabaseManager.initialize returns success: false if MySQL fails.
        // But let's see if we can still use it if it falls back to something else?
        // The current implementation of DatabaseManager seems to rely on MySQL connection for "success".
        // However, the methods might throw if not connected.
        // Let's assume for this task that the user wants to import into the active DB.
        // If it's JSON fallback, the methods might need to be adapted or we might need to write to config.json directly.
        // But wait, the user asked to "add these bookmarks", implies persistence.
        // Let's try to proceed. If provider is 'json', we might need a different approach?
        // The current DatabaseManager implementation throws "No database connection available" if not connected.
        // So we MUST have a database connection.
        // If the user hasn't set up MySQL, this script will fail.
        // But the user said "projeyi ayağa kaldır" (start the project) AFTER adding bookmarks.
        // Maybe I should check if I can use the JSON fallback logic if DB is not available?
        // The current DatabaseManager DOES NOT implement write operations for JSON fallback (it just returns empty arrays or errors).
        // So we really need MySQL for this script to work with the current codebase state.
        // OR, I can update the script to write to `src/data/config.json` if DB is unavailable.

        if (initResult.provider === 'json') {
            console.log('⚠️ MySQL not available. Importing to local config.json...');
            await importToLocalConfig();
            return;
        }
    }

    try {
        const bookmarksHtml = fs.readFileSync(path.join(__dirname, 'homelab_bookmarks (1).html'), 'utf8');
        const dom = new JSDOM(bookmarksHtml);
        const document = dom.window.document;

        // The structure is DL > DT > H3 (Category) + DL (Items)
        // The first DL contains the root folder "Homelab Services"

        // Find all H3 elements which represent folders
        const folders = document.querySelectorAll('h3');

        for (const folder of folders) {
            const categoryName = folder.textContent.trim();

            // Skip the root folder if it's just a container
            if (categoryName === 'Homelab Bookmarks' || categoryName === 'Homelab Services') continue;

            console.log(`📂 Processing Category: ${categoryName}`);

            // Create Category
            const categoryId = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            let category = null;

            if (dbManager.isConnected) {
                category = await dbManager.addCategory({
                    id: categoryId,
                    name: categoryName,
                    title: categoryName,
                    icon: 'Folder', // Default icon
                    layout: []
                });
            }

            // The DL immediately following the H3 contains the items
            const dl = folder.nextElementSibling;
            if (dl && dl.tagName === 'DL') {
                const links = dl.querySelectorAll('a');

                for (const link of links) {
                    const title = link.textContent.trim();
                    const url = link.href;

                    console.log(`   🔗 Adding Server: ${title} (${url})`);

                    const serverId = `srv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                    if (dbManager.isConnected) {
                        await dbManager.addServer({
                            id: serverId,
                            name: title,
                            url: url,
                            category_id: categoryId,
                            status: 'pending'
                        });
                    }
                }
            }
        }

        console.log('✅ Import completed successfully!');

    } catch (error) {
        console.error('❌ Import failed:', error);
    } finally {
        await dbManager.close();
    }
}

async function importToLocalConfig() {
    // Fallback: Read/Write to src/data/config.json
    const configPath = path.join(__dirname, 'src', 'data', 'config.json');
    let config = { servers: [], categories: [] };

    if (fs.existsSync(configPath)) {
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (e) {
            console.warn('Failed to read existing config.json, starting fresh.');
        }
    }

    const bookmarksHtml = fs.readFileSync(path.join(__dirname, 'homelab_bookmarks (1).html'), 'utf8');
    const dom = new JSDOM(bookmarksHtml);
    const document = dom.window.document;
    const folders = document.querySelectorAll('h3');

    for (const folder of folders) {
        const categoryName = folder.textContent.trim();
        if (categoryName === 'Homelab Bookmarks' || categoryName === 'Homelab Services') continue;

        const categoryId = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Add Category
        config.categories.push({
            id: categoryId,
            name: categoryName,
            title: categoryName,
            icon: 'Folder',
            layout: []
        });

        const dl = folder.nextElementSibling;
        if (dl && dl.tagName === 'DL') {
            const links = dl.querySelectorAll('a');
            for (const link of links) {
                const title = link.textContent.trim();
                const url = link.href;
                const serverId = `srv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                // Add Server (Note: config.json structure might expect servers to be flat or inside categories? 
                // Based on main-server.js fallback, it expects a flat 'servers' array with category_id)
                config.servers.push({
                    id: serverId,
                    name: title,
                    url: url,
                    category_id: categoryId,
                    status: 'pending'
                });
            }
        }
    }

    // Write back
    // Ensure directory exists
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ Imported to ${configPath}`);
}

importBookmarks();
