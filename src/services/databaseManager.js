/**
 * Simple Database Manager for Homelab Dashboard
 * MySQL/MariaDB integration with fallback to JSON
 */

import mysql from 'mysql2/promise';

export default class DatabaseManager {
  constructor(config = {}) {
    this.config = {
      host: config.host || process.env.DB_HOST || 'localhost',
      port: config.port || process.env.DB_PORT || 3306,
      user: config.user || process.env.DB_USER || 'homelab',
      password: config.password || process.env.DB_PASSWORD || '',
      database: config.database || process.env.DB_NAME || 'homelab_dashboard',
      connectionLimit: config.connectionLimit || 10,
      ...config
    };

    this.pool = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      await this.connectToMySQL();
      if (this.isConnected) {
        await this.setupTables();
        console.log('📊 MySQL database initialized successfully');
        return { success: true, provider: 'mysql' };
      }
    } catch (error) {
      console.log(`⚠️ MySQL connection failed: ${error.message}`);
      return { success: false, provider: 'json', error: error.message };
    }
  }

  async connectToMySQL() {
    try {
      this.pool = mysql.createPool({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        waitForConnections: true,
        connectionLimit: this.config.connectionLimit,
        queueLimit: 0
      });

      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      
      this.isConnected = true;
      console.log('🔗 MySQL connection established');
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  async setupTables() {
    const tables = [
      {
        name: 'categories',
        schema: `
          CREATE TABLE IF NOT EXISTS categories (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            title VARCHAR(255),
            color VARCHAR(10),
            icon VARCHAR(255),
            icon_name VARCHAR(255),
            layout JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'server_groups',
        schema: `
          CREATE TABLE IF NOT EXISTS server_groups (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            title VARCHAR(255),
            description TEXT,
            category_id VARCHAR(255),
            layout JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
          )
        `
      },
      {
        name: 'servers',
        schema: `
          CREATE TABLE IF NOT EXISTS servers (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            url TEXT NOT NULL,
            status ENUM('pending', 'online', 'offline') DEFAULT 'pending',
            icon VARCHAR(255),
            is_favorite BOOLEAN DEFAULT FALSE,
            tags JSON,
            protocol VARCHAR(50),
            category_id VARCHAR(255),
            group_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
            FOREIGN KEY (group_id) REFERENCES server_groups(id) ON DELETE SET NULL
          )
        `
      },
      {
        name: 'server_metrics',
        schema: `
          CREATE TABLE IF NOT EXISTS server_metrics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            server_id VARCHAR(255),
            cpu_usage DECIMAL(5,2),
            memory_usage DECIMAL(5,2),
            disk_usage DECIMAL(5,2),
            network_in DECIMAL(10,2),
            network_out DECIMAL(10,2),
            response_time DECIMAL(8,2),
            uptime DECIMAL(5,2),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
          )
        `
      },
      {
        name: 'alerts',
        schema: `
          CREATE TABLE IF NOT EXISTS alerts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            server_id VARCHAR(255),
            type ENUM('info', 'warning', 'error', 'critical') DEFAULT 'info',
            title VARCHAR(255) NOT NULL,
            message TEXT,
            severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
          )
        `
      }
    ];

    for (const table of tables) {
      try {
        await this.pool.execute(table.schema);
        console.log(`✅ Table '${table.name}' ready`);
      } catch (error) {
        console.error(`❌ Failed to create table '${table.name}':`, error);
        throw error;
      }
    }
  }

  async query(sql, params = []) {
    if (this.isConnected && this.pool) {
      try {
        const [rows] = await this.pool.execute(sql, params);
        return rows;
      } catch (error) {
        console.error('Database query error:', error);
        throw error;
      }
    } else {
      throw new Error('No database connection available');
    }
  }

  // --- SERVERS ---

  async getAllServers() {
    const sql = 'SELECT * FROM servers ORDER BY name ASC';
    const servers = await this.query(sql);
    
    // Parse JSON fields and fix data types
    return servers.map(server => ({
      ...server,
      tags: server.tags ? (typeof server.tags === 'string' ? JSON.parse(server.tags) : server.tags) : [],
      isFavorite: Boolean(server.is_favorite),
      is_favorite: Boolean(server.is_favorite) // Keep both for compatibility
    }));
  }

  async getServer(serverId) {
    const sql = 'SELECT * FROM servers WHERE id = ?';
    const results = await this.query(sql, [serverId]);
    return results[0] || null;
  }

  async addServer(serverData) {
    const sql = `
      INSERT INTO servers (id, name, description, url, status, icon, is_favorite, tags, category_id, group_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      serverData.id,
      serverData.name,
      serverData.description || null,
      serverData.url,
      serverData.status || 'pending',
      serverData.icon || null,
      serverData.isFavorite || false,
      JSON.stringify(serverData.tags || []),
      serverData.category_id || null,
      serverData.group_id || null
    ];

    await this.query(sql, params);
    return this.getServer(serverData.id);
  }

  async updateServer(serverId, updates) {
    const allowedFields = ['name', 'description', 'url', 'status', 'icon', 'is_favorite', 'tags', 'category_id', 'group_id'];
    const setClause = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
      let dbKey = key;
      if (key === 'isFavorite') dbKey = 'is_favorite';
      if (key === 'categoryId') dbKey = 'category_id';
      if (key === 'groupId') dbKey = 'group_id';
      
      if (allowedFields.includes(dbKey)) {
        setClause.push(`${dbKey} = ?`);
        if (key === 'tags') {
          params.push(JSON.stringify(value || []));
        } else {
          params.push(value);
        }
      }
    }

    if (setClause.length === 0) {
      return this.getServer(serverId);
    }

    setClause.push('updated_at = NOW()');
    params.push(serverId);

    const sql = `UPDATE servers SET ${setClause.join(', ')} WHERE id = ?`;
    await this.query(sql, params);
    
    return this.getServer(serverId);
  }

  async deleteServer(serverId) {
    const server = await this.getServer(serverId);
    if (!server) {
      return false;
    }

    const sql = 'DELETE FROM servers WHERE id = ?';
    await this.query(sql, [serverId]);
    return true;
  }

  // --- CATEGORIES ---

  async getAllCategories() {
    const sql = 'SELECT * FROM categories ORDER BY name ASC';
    const categories = await this.query(sql);
    return categories.map(cat => ({
      ...cat,
      layout: cat.layout ? (typeof cat.layout === 'string' ? JSON.parse(cat.layout) : cat.layout) : []
    }));
  }

  async getCategory(id) {
    const sql = 'SELECT * FROM categories WHERE id = ?';
    const results = await this.query(sql, [id]);
    if (results[0]) {
      results[0].layout = results[0].layout ? (typeof results[0].layout === 'string' ? JSON.parse(results[0].layout) : results[0].layout) : [];
    }
    return results[0] || null;
  }

  async addCategory(data) {
    const sql = `
      INSERT INTO categories (id, name, title, color, icon, icon_name, layout)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.id,
      data.name,
      data.title || data.name,
      data.color || null,
      data.icon || null,
      data.iconName || data.icon_name || null,
      JSON.stringify(data.layout || [])
    ];
    await this.query(sql, params);
    return this.getCategory(data.id);
  }

  async updateCategory(id, updates) {
    const allowedFields = ['name', 'title', 'color', 'icon', 'icon_name', 'layout'];
    const setClause = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
      let dbKey = key;
      if (key === 'iconName') dbKey = 'icon_name';
      
      if (allowedFields.includes(dbKey)) {
        setClause.push(`${dbKey} = ?`);
        if (dbKey === 'layout') {
          params.push(JSON.stringify(value || []));
        } else {
          params.push(value);
        }
      }
    }

    if (setClause.length === 0) return this.getCategory(id);

    setClause.push('updated_at = NOW()');
    params.push(id);

    const sql = `UPDATE categories SET ${setClause.join(', ')} WHERE id = ?`;
    await this.query(sql, params);
    return this.getCategory(id);
  }

  async deleteCategory(id) {
    const sql = 'DELETE FROM categories WHERE id = ?';
    await this.query(sql, [id]);
    return true;
  }

  // --- GROUPS ---

  async getAllGroups() {
    const sql = 'SELECT * FROM server_groups ORDER BY name ASC';
    const groups = await this.query(sql);
    return groups.map(grp => ({
      ...grp,
      layout: grp.layout ? (typeof grp.layout === 'string' ? JSON.parse(grp.layout) : grp.layout) : []
    }));
  }

  async getGroup(id) {
    const sql = 'SELECT * FROM server_groups WHERE id = ?';
    const results = await this.query(sql, [id]);
    if (results[0]) {
      results[0].layout = results[0].layout ? (typeof results[0].layout === 'string' ? JSON.parse(results[0].layout) : results[0].layout) : [];
    }
    return results[0] || null;
  }

  async addGroup(data) {
    const sql = `
      INSERT INTO server_groups (id, name, title, description, category_id, layout)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.id,
      data.name,
      data.title || data.name,
      data.description || null,
      data.category_id || data.categoryId || null,
      JSON.stringify(data.layout || [])
    ];
    await this.query(sql, params);
    return this.getGroup(data.id);
  }

  async updateGroup(id, updates) {
    const allowedFields = ['name', 'title', 'description', 'category_id', 'layout'];
    const setClause = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
      let dbKey = key;
      if (key === 'categoryId') dbKey = 'category_id';

      if (allowedFields.includes(dbKey)) {
        setClause.push(`${dbKey} = ?`);
        if (dbKey === 'layout') {
          params.push(JSON.stringify(value || []));
        } else {
          params.push(value);
        }
      }
    }

    if (setClause.length === 0) return this.getGroup(id);

    setClause.push('updated_at = NOW()');
    params.push(id);

    const sql = `UPDATE server_groups SET ${setClause.join(', ')} WHERE id = ?`;
    await this.query(sql, params);
    return this.getGroup(id);
  }

  async deleteGroup(id) {
    const sql = 'DELETE FROM server_groups WHERE id = ?';
    await this.query(sql, [id]);
    return true;
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('🔌 Database connection closed');
    }
  }

  async healthCheck() {
    if (!this.isConnected || !this.pool) {
      return { healthy: false, provider: 'json' };
    }

    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      
      return { 
        healthy: true, 
        provider: 'mysql',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        healthy: false, 
        provider: 'mysql',
        error: error.message 
      };
    }
  }
}
