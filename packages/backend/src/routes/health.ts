import express from 'express';
import mongoose from 'mongoose';
import redis from 'redis';
import logger from '../utils/logger';

const router = express.Router();

// Health check data interface
interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: {
      status: 'up' | 'down';
      latency?: number;
    };
    redis?: {
      status: 'up' | 'down';
      latency?: number;
    };
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

// Basic health check
router.get('/health', async (req, res) => {
  try {
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: { status: 'down' }
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
      }
    };

    // Check database connectivity
    const dbStart = Date.now();
    try {
      await mongoose.connection.db.admin().ping();
      health.services.database = {
        status: 'up',
        latency: Date.now() - dbStart
      };
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      health.services.database = { status: 'down' };
      health.status = 'unhealthy';
    }

    // Check Redis if configured
    if (process.env.REDIS_URL) {
      health.services.redis = { status: 'down' };
      const redisStart = Date.now();
      try {
        const redisClient = redis.createClient({ url: process.env.REDIS_URL });
        await redisClient.connect();
        await redisClient.ping();
        await redisClient.disconnect();
        health.services.redis = {
          status: 'up',
          latency: Date.now() - redisStart
        };
      } catch (error) {
        logger.error('Redis health check failed', { error: error.message });
      }
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);

  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Detailed health check with more metrics
router.get('/health/detailed', async (req, res) => {
  try {
    const health: HealthStatus & {
      system: any;
      database: {
        connections: number;
        collections: string[];
      };
      cache?: any;
    } = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: { status: 'down' }
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid
      },
      database: {
        connections: 0,
        collections: []
      }
    };

    // Detailed database check
    const dbStart = Date.now();
    try {
      const db = mongoose.connection.db;
      await db.admin().ping();

      // Get connection info
      const dbStats = await db.stats();
      health.database.connections = mongoose.connections.length;
      health.database.collections = Object.keys(dbStats);

      health.services.database = {
        status: 'up',
        latency: Date.now() - dbStart
      };
    } catch (error) {
      logger.error('Detailed database health check failed', { error: error.message });
      health.services.database = { status: 'down' };
      health.status = 'unhealthy';
    }

    // Detailed Redis check
    if (process.env.REDIS_URL) {
      health.services.redis = { status: 'down' };
      health.cache = {};

      const redisStart = Date.now();
      try {
        const redisClient = redis.createClient({ url: process.env.REDIS_URL });
        await redisClient.connect();

        const info = await redisClient.info();
        const ping = await redisClient.ping();

        health.services.redis = {
          status: 'up',
          latency: Date.now() - redisStart
        };

        health.cache = {
          ping,
          connected_clients: info.match(/connected_clients:(\d+)/)?.[1],
          used_memory: info.match(/used_memory:(\d+)/)?.[1],
          total_connections_received: info.match(/total_connections_received:(\d+)/)?.[1]
        };

        await redisClient.disconnect();
      } catch (error) {
        logger.error('Detailed Redis health check failed', { error: error.message });
      }
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);

  } catch (error) {
    logger.error('Detailed health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed'
    });
  }
});

// Metrics endpoint for monitoring systems
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss
      },
      cpu: process.cpuUsage(),
      database: {
        readyState: mongoose.connection.readyState,
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port
      },
      environment: {
        node_env: process.env.NODE_ENV,
        version: process.env.npm_package_version
      }
    };

    // Add custom application metrics here
    // e.g., active connections, request counts, etc.

    res.json(metrics);
  } catch (error) {
    logger.error('Metrics collection failed', { error: error.message });
    res.status(500).json({ error: 'Metrics collection failed' });
  }
});

export default router;
