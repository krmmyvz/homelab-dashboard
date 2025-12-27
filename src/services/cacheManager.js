/**
 * Redis Cache Manager for Homelab Dashboard
 * Provides high-performance caching layer with Redis integration
 */

import { createClient } from 'redis';

class CacheManager {
  constructor(config = {}) {
    this.config = {
      host: config.host || process.env.REDIS_HOST || 'localhost',
      port: config.port || process.env.REDIS_PORT || 6379,
      password: config.password || process.env.REDIS_PASSWORD || undefined,
      database: config.database || process.env.REDIS_DB || 0,
      keyPrefix: config.keyPrefix || 'homelab:',
      defaultTTL: config.defaultTTL || 3600, // 1 hour default
      ...config
    };

    this.client = null;
    this.isConnected = false;
    this.fallbackToMemory = config.fallbackToMemory !== false; // Default to true
    this.memoryCache = new Map();
    this.memoryCacheTTL = new Map();
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      await this.connectToRedis();
      
      if (this.isConnected) {
        console.log('🟥 Redis cache initialized successfully');
        return { success: true, provider: 'redis' };
      }
    } catch (error) {
      console.log(`⚠️ Redis connection failed: ${error.message}`);
      
      if (this.fallbackToMemory) {
        console.log('🧠 Falling back to in-memory cache');
        this.initializeMemoryCache();
        return { success: true, provider: 'memory' };
      } else {
        throw error;
      }
    }
  }

  /**
   * Connect to Redis
   */
  async connectToRedis() {
    try {
      this.client = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
          reconnectStrategy: (retries) => Math.min(retries * 50, 500)
        },
        password: this.config.password,
        database: this.config.database
      });

      this.client.on('error', (err) => {
        console.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('🔗 Redis connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('❌ Redis disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      
      // Test the connection
      await this.client.ping();
      this.isConnected = true;
      
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Redis connection failed: ${error.message}`);
    }
  }

  /**
   * Initialize memory cache fallback
   */
  initializeMemoryCache() {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanupMemoryCache();
    }, 5 * 60 * 1000);
    
    console.log('🧠 In-memory cache initialized');
  }

  /**
   * Clean up expired memory cache entries
   */
  cleanupMemoryCache() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, expiry] of this.memoryCacheTTL.entries()) {
      if (expiry && expiry < now) {
        this.memoryCache.delete(key);
        this.memoryCacheTTL.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  /**
   * Generate cache key with prefix
   */
  key(identifier) {
    return `${this.config.keyPrefix}${identifier}`;
  }

  /**
   * Set cache value
   */
  async set(key, value, ttl = null) {
    const cacheKey = this.key(key);
    const serializedValue = JSON.stringify(value);
    const cacheTTL = ttl || this.config.defaultTTL;

    if (this.isConnected && this.client) {
      try {
        await this.client.setEx(cacheKey, cacheTTL, serializedValue);
        return true;
      } catch (error) {
        console.error('Redis set error:', error);
        // Fall through to memory cache
      }
    }

    if (this.fallbackToMemory) {
      this.memoryCache.set(cacheKey, serializedValue);
      this.memoryCacheTTL.set(cacheKey, Date.now() + (cacheTTL * 1000));
      return true;
    }

    return false;
  }

  /**
   * Get cache value
   */
  async get(key) {
    const cacheKey = this.key(key);

    if (this.isConnected && this.client) {
      try {
        const value = await this.client.get(cacheKey);
        if (value) {
          return JSON.parse(value);
        }
      } catch (error) {
        console.error('Redis get error:', error);
        // Fall through to memory cache
      }
    }

    if (this.fallbackToMemory) {
      const expiry = this.memoryCacheTTL.get(cacheKey);
      
      if (expiry && expiry > Date.now()) {
        const value = this.memoryCache.get(cacheKey);
        if (value) {
          return JSON.parse(value);
        }
      } else if (expiry) {
        // Expired entry
        this.memoryCache.delete(cacheKey);
        this.memoryCacheTTL.delete(cacheKey);
      }
    }

    return null;
  }

  /**
   * Delete cache value
   */
  async del(key) {
    const cacheKey = this.key(key);

    if (this.isConnected && this.client) {
      try {
        await this.client.del(cacheKey);
      } catch (error) {
        console.error('Redis del error:', error);
      }
    }

    if (this.fallbackToMemory) {
      this.memoryCache.delete(cacheKey);
      this.memoryCacheTTL.delete(cacheKey);
    }

    return true;
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    const cacheKey = this.key(key);

    if (this.isConnected && this.client) {
      try {
        const result = await this.client.exists(cacheKey);
        return result === 1;
      } catch (error) {
        console.error('Redis exists error:', error);
      }
    }

    if (this.fallbackToMemory) {
      const expiry = this.memoryCacheTTL.get(cacheKey);
      return expiry && expiry > Date.now() && this.memoryCache.has(cacheKey);
    }

    return false;
  }

  /**
   * Set TTL for existing key
   */
  async expire(key, ttl) {
    const cacheKey = this.key(key);

    if (this.isConnected && this.client) {
      try {
        await this.client.expire(cacheKey, ttl);
        return true;
      } catch (error) {
        console.error('Redis expire error:', error);
      }
    }

    if (this.fallbackToMemory && this.memoryCache.has(cacheKey)) {
      this.memoryCacheTTL.set(cacheKey, Date.now() + (ttl * 1000));
      return true;
    }

    return false;
  }

  /**
   * Increment value
   */
  async incr(key, amount = 1) {
    const cacheKey = this.key(key);

    if (this.isConnected && this.client) {
      try {
        if (amount === 1) {
          return await this.client.incr(cacheKey);
        } else {
          return await this.client.incrBy(cacheKey, amount);
        }
      } catch (error) {
        console.error('Redis incr error:', error);
      }
    }

    if (this.fallbackToMemory) {
      const current = await this.get(key) || 0;
      const newValue = current + amount;
      await this.set(key, newValue);
      return newValue;
    }

    return 0;
  }

  /**
   * Cache server status with optimized key structure
   */
  async cacheServerStatus(serverId, status) {
    const key = `server:${serverId}:status`;
    return this.set(key, status, 60); // 1 minute TTL for status
  }

  /**
   * Get cached server status
   */
  async getCachedServerStatus(serverId) {
    const key = `server:${serverId}:status`;
    return this.get(key);
  }

  /**
   * Cache server metrics
   */
  async cacheServerMetrics(serverId, metrics) {
    const key = `server:${serverId}:metrics`;
    return this.set(key, metrics, 300); // 5 minute TTL for metrics
  }

  /**
   * Get cached server metrics
   */
  async getCachedServerMetrics(serverId) {
    const key = `server:${serverId}:metrics`;
    return this.get(key);
  }

  /**
   * Cache dashboard data
   */
  async cacheDashboardData(data) {
    const key = 'dashboard:overview';
    return this.set(key, data, 120); // 2 minute TTL for dashboard
  }

  /**
   * Get cached dashboard data
   */
  async getCachedDashboardData() {
    const key = 'dashboard:overview';
    return this.get(key);
  }

  /**
   * Cache API response
   */
  async cacheApiResponse(endpoint, params, response) {
    const key = `api:${endpoint}:${Buffer.from(JSON.stringify(params)).toString('base64')}`;
    return this.set(key, response, 180); // 3 minute TTL for API responses
  }

  /**
   * Get cached API response
   */
  async getCachedApiResponse(endpoint, params) {
    const key = `api:${endpoint}:${Buffer.from(JSON.stringify(params)).toString('base64')}`;
    return this.get(key);
  }

  /**
   * Invalidate all cache for a server
   */
  async invalidateServerCache(serverId) {
    const patterns = [
      `server:${serverId}:*`,
      'dashboard:*',
      'api:*'
    ];

    for (const pattern of patterns) {
      if (this.isConnected && this.client) {
        try {
          const keys = await this.client.keys(this.key(pattern));
          if (keys.length > 0) {
            await this.client.del(keys);
          }
        } catch (error) {
          console.error('Redis invalidate error:', error);
        }
      }
    }

    // Clear relevant memory cache entries
    if (this.fallbackToMemory) {
      for (const key of this.memoryCache.keys()) {
        if (key.includes(serverId) || key.includes('dashboard') || key.includes('api')) {
          this.memoryCache.delete(key);
          this.memoryCacheTTL.delete(key);
        }
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    const stats = {
      connected: this.isConnected,
      provider: this.isConnected ? 'redis' : 'memory'
    };

    if (this.isConnected && this.client) {
      try {
        const info = await this.client.info('memory');
        const keyspace = await this.client.info('keyspace');
        
        stats.redis = {
          memory: info,
          keyspace: keyspace
        };
      } catch (error) {
        console.error('Redis stats error:', error);
      }
    }

    if (this.fallbackToMemory) {
      stats.memory = {
        entries: this.memoryCache.size,
        ttlEntries: this.memoryCacheTTL.size
      };
    }

    return stats;
  }

  /**
   * Flush all cache
   */
  async flush() {
    if (this.isConnected && this.client) {
      try {
        await this.client.flushDb();
      } catch (error) {
        console.error('Redis flush error:', error);
      }
    }

    if (this.fallbackToMemory) {
      this.memoryCache.clear();
      this.memoryCacheTTL.clear();
    }

    console.log('🧹 Cache flushed');
  }

  /**
   * Close cache connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      console.log('🔌 Redis connection closed');
    }

    if (this.fallbackToMemory) {
      this.memoryCache.clear();
      this.memoryCacheTTL.clear();
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.isConnected || !this.client) {
      return { 
        healthy: true, 
        provider: 'memory',
        entries: this.memoryCache.size
      };
    }

    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;
      
      return { 
        healthy: true, 
        provider: 'redis',
        latency: latency,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        healthy: false, 
        provider: 'redis',
        error: error.message 
      };
    }
  }
}

export default CacheManager;
