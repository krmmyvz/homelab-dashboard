#!/usr/bin/env node

/**
 * Database Seeder Script
 * Homelab Dashboard için sahte veri oluşturur
 */

import { config } from 'dotenv';
import DatabaseManager from './src/services/databaseManager.js';

// Load environment variables
config();

const databaseManager = new DatabaseManager();

// Gerçek server verileri - Homelab'dan
const sampleServers = [
  // Proxmox Ana Sunucu
  {
    id: 'proxmox-main',
    name: 'Proxmox VE',
    description: 'Ana virtualization sunucusu',
    url: 'https://192.168.1.100:8006',
    status: 'online',
    icon: '🖥️',
    is_favorite: true,
    tags: JSON.stringify(['proxmox', 'virtualization', 'infrastructure']),
    protocol: 'https',
    category_id: 'network-infrastructure',
    group_id: 'production-services'
  },
  
  // Container Management Tools
  {
    id: 'dockge-1',
    name: 'Dockge (Main)',
    description: 'Docker Compose stack yönetimi - 7 aktif stack',
    url: 'http://192.168.1.7:5001',
    status: 'online',
    icon: '🐋',
    is_favorite: true,
    tags: JSON.stringify(['docker', 'compose', 'management']),
    protocol: 'http',
    category_id: 'development-tools',
    group_id: 'container-management'
  },
  {
    id: 'dockge-2',
    name: 'Dockge (Alt)',
    description: 'Docker Compose stack yönetimi - 2 aktif stack',
    url: 'http://192.168.1.123:5001',
    status: 'online',
    icon: '🐋',
    is_favorite: false,
    tags: JSON.stringify(['docker', 'compose', 'management']),
    protocol: 'http',
    category_id: 'development-tools',
    group_id: 'container-management'
  },
  {
    id: 'portainer',
    name: 'Portainer',
    description: 'Container management interface',
    url: 'http://192.168.1.12:9000',
    status: 'online',
    icon: '🐳',
    is_favorite: true,
    tags: JSON.stringify(['docker', 'containers', 'management']),
    protocol: 'http',
    category_id: 'development-tools',
    group_id: 'container-management'
  },
  
  // LXC Containers - Network & Security
  {
    id: 'pihole',
    name: 'Pi-hole',
    description: 'Network-wide ad blocker (LXC 101)',
    url: 'http://192.168.1.101/admin',
    status: 'online',
    icon: '🕳️',
    is_favorite: true,
    tags: JSON.stringify(['dns', 'security', 'privacy', 'lxc']),
    protocol: 'http',
    category_id: 'security-privacy',
    group_id: 'lxc-containers'
  },
  {
    id: 'vaultwarden',
    name: 'Vaultwarden',
    description: 'Self-hosted password manager (LXC 106)',
    url: 'http://192.168.1.106:80',
    status: 'online',
    icon: '🔐',
    is_favorite: true,
    tags: JSON.stringify(['security', 'passwords', 'vault', 'lxc']),
    protocol: 'http',
    category_id: 'security-privacy',
    group_id: 'lxc-containers'
  },
  {
    id: 'vaultwarden-alpine',
    name: 'Vaultwarden Alpine',
    description: 'Lightweight Vaultwarden instance (LXC 103)',
    url: 'http://192.168.1.103:80',
    status: 'online',
    icon: '🔐',
    is_favorite: false,
    tags: JSON.stringify(['security', 'passwords', 'alpine', 'lxc']),
    protocol: 'http',
    category_id: 'security-privacy',
    group_id: 'lxc-containers'
  },
  
  // LXC Containers - Media & Entertainment
  {
    id: 'jellyfin',
    name: 'Jellyfin',
    description: 'Media streaming server (LXC 107)',
    url: 'http://192.168.1.107:8096',
    status: 'online',
    icon: '📺',
    is_favorite: true,
    tags: JSON.stringify(['media', 'streaming', 'entertainment', 'lxc']),
    protocol: 'http',
    category_id: 'media-entertainment',
    group_id: 'lxc-containers'
  },
  
  // LXC Containers - Productivity & Collaboration
  {
    id: 'nextcloud',
    name: 'Nextcloud',
    description: 'Personal cloud storage (LXC 108)',
    url: 'http://192.168.1.108:80',
    status: 'online',
    icon: '☁️',
    is_favorite: true,
    tags: JSON.stringify(['cloud', 'storage', 'collaboration', 'lxc']),
    protocol: 'http',
    category_id: 'network-infrastructure',
    group_id: 'lxc-containers'
  },
  {
    id: 'organization',
    name: 'Organization',
    description: 'Organizasyon araçları (LXC 102)',
    url: 'http://192.168.1.102:80',
    status: 'online',
    icon: '📋',
    is_favorite: false,
    tags: JSON.stringify(['productivity', 'organization', 'lxc']),
    protocol: 'http',
    category_id: 'network-infrastructure',
    group_id: 'lxc-containers'
  },
  {
    id: 'syncthing',
    name: 'Syncthing',
    description: 'Continuous file synchronization (LXC 114)',
    url: 'http://192.168.1.114:8384',
    status: 'online',
    icon: '🔄',
    is_favorite: false,
    tags: JSON.stringify(['sync', 'files', 'backup', 'lxc']),
    protocol: 'http',
    category_id: 'network-infrastructure',
    group_id: 'lxc-containers'
  },
  {
    id: 'miniflux',
    name: 'Miniflux',
    description: 'Minimalist RSS reader (LXC 113)',
    url: 'http://192.168.1.113:80',
    status: 'online',
    icon: '�',
    is_favorite: false,
    tags: JSON.stringify(['rss', 'news', 'reader', 'lxc']),
    protocol: 'http',
    category_id: 'media-entertainment',
    group_id: 'lxc-containers'
  },
  
  // LXC Containers - Development & Git
  {
    id: 'gitserver',
    name: 'Git Server',
    description: 'Self-hosted Git repository (LXC 104)',
    url: 'http://192.168.1.104:3000',
    status: 'online',
    icon: '🦊',
    is_favorite: true,
    tags: JSON.stringify(['git', 'repository', 'development', 'lxc']),
    protocol: 'http',
    category_id: 'development-tools',
    group_id: 'lxc-containers'
  },
  
  // LXC Containers - Monitoring & Logging
  {
    id: 'graylog',
    name: 'Graylog',
    description: 'Log management platform (LXC 111)',
    url: 'http://192.168.1.111:9000',
    status: 'online',
    icon: '�',
    is_favorite: false,
    tags: JSON.stringify(['logging', 'monitoring', 'analytics', 'lxc']),
    protocol: 'http',
    category_id: 'monitoring-analytics',
    group_id: 'lxc-containers'
  },
  {
    id: 'myspeed',
    name: 'MySpeed',
    description: 'Internet speed monitoring (LXC 115)',
    url: 'http://192.168.1.115:5216',
    status: 'online',
    icon: '�',
    is_favorite: false,
    tags: JSON.stringify(['monitoring', 'speed', 'network', 'lxc']),
    protocol: 'http',
    category_id: 'monitoring-analytics',
    group_id: 'lxc-containers'
  },
  
  // LXC Containers - Home Automation
  {
    id: 'home-assistant',
    name: 'Home Assistant',
    description: 'Home automation platform (LXC 112)',
    url: 'http://192.168.1.112:8123',
    status: 'online',
    icon: '🏠',
    is_favorite: true,
    tags: JSON.stringify(['automation', 'iot', 'smart-home', 'lxc']),
    protocol: 'http',
    category_id: 'network-infrastructure',
    group_id: 'lxc-containers'
  },
  
  // LXC Containers - System Management
  {
    id: 'webmin',
    name: 'Webmin',
    description: 'Web-based system administration (LXC 105)',
    url: 'https://192.168.1.105:10000',
    status: 'online',
    icon: '⚙️',
    is_favorite: false,
    tags: JSON.stringify(['admin', 'system', 'management', 'lxc']),
    protocol: 'https',
    category_id: 'network-infrastructure',
    group_id: 'lxc-containers'
  },
  
  // LXC Containers - Docker Hosts
  {
    id: 'docker-on-lxc',
    name: 'Docker on LXC',
    description: 'Docker host container (LXC 109)',
    url: 'http://192.168.1.109:2375',
    status: 'online',
    icon: '🐳',
    is_favorite: false,
    tags: JSON.stringify(['docker', 'containers', 'host', 'lxc']),
    protocol: 'http',
    category_id: 'development-tools',
    group_id: 'lxc-containers'
  },
  {
    id: 'docker-main',
    name: 'Docker (Main)',
    description: 'Main Docker host (LXC 110)',
    url: 'http://192.168.1.110:2375',
    status: 'online',
    icon: '�',
    is_favorite: true,
    tags: JSON.stringify(['docker', 'containers', 'host', 'lxc']),
    protocol: 'http',
    category_id: 'development-tools',
    group_id: 'lxc-containers'
  },
  {
    id: 'docker-other',
    name: 'Docker Other',
    description: 'Additional Docker host (LXC 122)',
    url: 'http://192.168.1.122:2375',
    status: 'online',
    icon: '🐳',
    is_favorite: false,
    tags: JSON.stringify(['docker', 'containers', 'host', 'lxc']),
    protocol: 'http',
    category_id: 'development-tools',
    group_id: 'lxc-containers'
  },
  
  // Docker Containers (Portainer'dan)
  {
    id: 'authentik',
    name: 'Authentik',
    description: 'Identity provider and SSO platform',
    url: 'http://192.168.1.12:9000',
    status: 'online',
    icon: '🔑',
    is_favorite: true,
    tags: JSON.stringify(['auth', 'sso', 'identity', 'docker']),
    protocol: 'http',
    category_id: 'security-privacy',
    group_id: 'docker-services'
  },
  {
    id: 'homepage',
    name: 'Homepage',
    description: 'Custom dashboard homepage',
    url: 'http://192.168.1.12:3000',
    status: 'online',
    icon: '🏠',
    is_favorite: false,
    tags: JSON.stringify(['dashboard', 'homepage', 'docker']),
    protocol: 'http',
    category_id: 'network-infrastructure',
    group_id: 'docker-services'
  },
  {
    id: 'overleaf',
    name: 'Overleaf',
    description: 'Collaborative LaTeX editor',
    url: 'http://192.168.1.12:5000',
    status: 'online',
    icon: '�',
    is_favorite: false,
    tags: JSON.stringify(['latex', 'editor', 'collaboration', 'docker']),
    protocol: 'http',
    category_id: 'development-tools',
    group_id: 'docker-services'
  },
  {
    id: 'owncast',
    name: 'Owncast',
    description: 'Self-hosted live streaming',
    url: 'http://192.168.1.12:8080',
    status: 'online',
    icon: '�',
    is_favorite: false,
    tags: JSON.stringify(['streaming', 'video', 'live', 'docker']),
    protocol: 'http',
    category_id: 'media-entertainment',
    group_id: 'docker-services'
  },
  {
    id: 'picard',
    name: 'MusicBrainz Picard',
    description: 'Music tagger application',
    url: 'http://192.168.1.12:5800',
    status: 'online',
    icon: '🎵',
    is_favorite: false,
    tags: JSON.stringify(['music', 'tagging', 'metadata', 'docker']),
    protocol: 'http',
    category_id: 'media-entertainment',
    group_id: 'docker-services'
  },
  {
    id: 'courier-telegram',
    name: 'Courier Telegram Bot',
    description: 'Telegram notification bot',
    url: 'http://192.168.1.12:8081',
    status: 'online',
    icon: '✉️',
    is_favorite: false,
    tags: JSON.stringify(['telegram', 'bot', 'notifications', 'docker']),
    protocol: 'http',
    category_id: 'network-infrastructure',
    group_id: 'docker-services'
  }
];

// Sahte kategori verileri
const sampleCategories = [
  {
    id: 'media-entertainment',
    name: 'Media & Entertainment',
    description: 'Media streaming and entertainment services',
    color: '#FF6B6B',
    icon: '🎬',
    iconName: 'Monitor'
  },
  {
    id: 'security-privacy',
    name: 'Security & Privacy',
    description: 'Security tools and privacy-focused services',
    color: '#4ECDC4',
    icon: '🔒',
    iconName: 'Shield'
  },
  {
    id: 'development-tools',
    name: 'Development Tools',
    description: 'Development and CI/CD related services',
    color: '#45B7D1',
    icon: '⚙️',
    iconName: 'GitBranch'
  },
  {
    id: 'monitoring-analytics',
    name: 'Monitoring & Analytics',
    description: 'System monitoring and data analytics',
    color: '#F7DC6F',
    icon: '📊',
    iconName: 'BarChart3'
  },
  {
    id: 'network-infrastructure',
    name: 'Network & Infrastructure',
    description: 'Network management and infrastructure services',
    color: '#BB8FCE',
    icon: '🌐',
    iconName: 'Network'
  }
];

// Güncellenmiş grup verileri
const sampleGroups = [
  {
    id: 'production-services',
    name: 'Production Services',
    description: 'Critical production infrastructure',
    category_id: 'network-infrastructure',
    color: '#E74C3C',
    icon: '⚡'
  },
  {
    id: 'container-management',
    name: 'Container Management',
    description: 'Docker and container orchestration tools',
    category_id: 'development-tools',
    color: '#3498DB',
    icon: '🐋'
  },
  {
    id: 'lxc-containers',
    name: 'LXC Containers',
    description: 'Proxmox LXC containers',
    category_id: 'network-infrastructure',
    color: '#2ECC71',
    icon: '📦'
  },
  {
    id: 'docker-services',
    name: 'Docker Services',
    description: 'Dockerized applications and services',
    category_id: 'development-tools',
    color: '#9B59B6',
    icon: '�'
  }
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Initialize database connection
    const result = await databaseManager.initialize();
    if (!result.success) {
      throw new Error('Failed to initialize database');
    }
    
    console.log(`📊 Connected to ${result.provider} database`);
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await databaseManager.query('DELETE FROM server_metrics');
    await databaseManager.query('DELETE FROM alerts');
    await databaseManager.query('DELETE FROM servers');
    await databaseManager.query('DELETE FROM server_groups');
    await databaseManager.query('DELETE FROM categories');
    
    // Seed categories
    console.log('📂 Seeding categories...');
    const categoryIdMap = {};
    for (const category of sampleCategories) {
      const result = await databaseManager.query(
        'INSERT INTO categories (name, color, icon, icon_name) VALUES (?, ?, ?, ?)',
        [category.name, category.color, category.icon, category.iconName]
      );
      categoryIdMap[category.id] = result.insertId;
    }
    console.log(`✅ Added ${sampleCategories.length} categories`);
    
    // Seed groups
    console.log('👥 Seeding groups...');
    for (const group of sampleGroups) {
      // Map string category_id to actual database ID
      const categoryId = categoryIdMap[group.category_id] || null;
      const result = await databaseManager.query(
        'INSERT INTO server_groups (name, description, category_id) VALUES (?, ?, ?)',
        [group.name, group.description, categoryId]
      );
      // Store group ID mapping for server inserts
      if (!global.groupIdMap) global.groupIdMap = {};
      global.groupIdMap[group.id] = result.insertId;
    }
    console.log(`✅ Added ${sampleGroups.length} groups`);
    
    // Seed servers
    console.log('🖥️ Seeding servers...');
    for (const server of sampleServers) {
      // Map string IDs to actual database IDs
      const categoryId = categoryIdMap[server.category_id] || null;
      const groupId = global.groupIdMap[server.group_id] || null;
      
      await databaseManager.query(
        'INSERT INTO servers (id, name, description, url, status, icon, is_favorite, tags, protocol, category_id, group_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          server.id, 
          server.name, 
          server.description, 
          server.url, 
          server.status, 
          server.icon, 
          server.is_favorite, 
          server.tags, 
          server.protocol,
          categoryId,
          groupId
        ]
      );
    }
    console.log(`✅ Added ${sampleServers.length} servers`);
    
    // Add some sample metrics
    console.log('📈 Seeding sample metrics...');
    const onlineServers = sampleServers.filter(s => s.status === 'online');
    
    for (const server of onlineServers) {
      // Generate random metrics for the last 24 hours
      const now = new Date();
      for (let i = 0; i < 24; i++) {
        const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000)); // Every hour
        const responseTime = Math.floor(Math.random() * 500) + 50; // 50-550ms
        const cpuUsage = Math.random() * 100;
        const memoryUsage = Math.random() * 100;
        const diskUsage = Math.random() * 100;
        const networkIn = Math.random() * 1000;
        const networkOut = Math.random() * 800;
        const uptime = 99.9 - Math.random() * 5;
        
        await databaseManager.query(
          'INSERT INTO server_metrics (server_id, cpu_usage, memory_usage, disk_usage, network_in, network_out, response_time, uptime, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            server.id,
            cpuUsage,
            memoryUsage,
            diskUsage,
            networkIn,
            networkOut,
            responseTime,
            uptime,
            timestamp.toISOString().slice(0, 19).replace('T', ' ')
          ]
        );
      }
    }
    console.log(`✅ Added sample metrics for ${onlineServers.length} servers`);
    
    // Add some sample alerts
    console.log('🚨 Seeding sample alerts...');
    const sampleAlerts = [
      {
        server_id: 'nextcloud',
        alert_type: 'warning',
        severity: 'medium',
        title: 'High Disk Usage',
        message: 'Nextcloud LXC disk usage is at 51.2%'
      },
      {
        server_id: 'miniflux',
        alert_type: 'warning',
        severity: 'high',
        title: 'Very High Disk Usage',
        message: 'Miniflux LXC disk usage is at 72.4%'
      }
    ];
    
    for (const alert of sampleAlerts) {
      await databaseManager.query(
        'INSERT INTO alerts (server_id, type, severity, title, message) VALUES (?, ?, ?, ?, ?)',
        [alert.server_id, alert.alert_type, alert.severity, alert.title, alert.message]
      );
    }
    console.log(`✅ Added ${sampleAlerts.length} sample alerts`);
    
    // Display summary
    console.log('\n📊 Database seeding completed successfully!');
    console.log('=' .repeat(50));
    console.log(`📂 Categories: ${sampleCategories.length}`);
    console.log(`👥 Groups: ${sampleGroups.length}`);
    console.log(`🖥️ Servers: ${sampleServers.length}`);
    console.log(`📈 Sample metrics: ${onlineServers.length * 24}`);
    console.log(`🚨 Alerts: ${sampleAlerts.length}`);
    console.log('=' .repeat(50));
    
    console.log('\n🌐 You can now access your dashboard at:');
    console.log('   Frontend: http://localhost:3001');
    console.log('   API: http://localhost:3001/api/servers');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await databaseManager.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeder
seedDatabase();
