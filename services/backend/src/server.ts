import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config';
import { authRoutes } from './routes/auth';
import { telemetryRoutes } from './routes/telemetry';
import { analyticsRoutes } from './routes/analytics';
import { studentRoutes } from './routes/students';
import { seedDatabase } from './db/seeds/seed_categories';
import { getDatabase, getCurrentDatabase } from './db/connection';
import { telemetryBroadcaster } from './services/telemetryBroadcaster';
import { isRedisConnected } from './services/redisService';

export function buildServer(): FastifyInstance {
  const app = fastify({
    genReqId: () => uuidv4(),
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname'
              }
            }
          : undefined
    }
  });

  // CORS support
  app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  // Rate Limiting Protection (Anti-DDoS & batch flooding prevention)
  app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1', '::1'],
    errorResponseBuilder: (req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Please retry in ${context.after}`
    })
  });

  // Basic Health check endpoint
  app.get('/health', async () => {
    return {
      status: 'healthy',
      service: 'telemetry-ingestion-engine',
      timestamp: new Date().toISOString()
    };
  });

  // Kubernetes / Cloud Liveness Probe
  app.get('/health/live', async () => {
    return { status: 'alive' };
  });

  // Kubernetes / Cloud Readiness Probe (Verifies PostgreSQL & Redis connections)
  app.get('/health/ready', async (request, reply) => {
    const db = getCurrentDatabase();
    const isDbConnected = db !== null;
    let isRedisOk = false;

    try {
      isRedisOk = await isRedisConnected();
    } catch {
      isRedisOk = false;
    }

    const isReady = isDbConnected;
    const statusCode = isReady ? 200 : 503;

    return reply.status(statusCode).send({
      status: isReady ? 'ready' : 'degraded',
      database: isDbConnected ? (db?.isPostgres() ? 'postgresql' : 'in-memory') : 'unavailable',
      redis: isRedisOk ? 'connected' : 'in-memory-fallback',
      uptimeSec: Math.floor(process.uptime()),
      diagnostics: telemetryBroadcaster.getDiagnostics(),
      timestamp: new Date().toISOString()
    });
  });

  // Prometheus Metrics Endpoint
  app.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    return reply.send(telemetryBroadcaster.getPrometheusMetrics());
  });

  // Register routes
  app.register(authRoutes);
  app.register(telemetryRoutes);
  app.register(analyticsRoutes);
  app.register(studentRoutes);

  return app;
}

export async function start() {
  const app = buildServer();

  try {
    // Initialize DB and run seed
    await getDatabase();
    await seedDatabase();

    await app.listen({ port: config.port, host: config.host });
    app.log.info(`Telemetry backend ingestion server running on http://${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}
