import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { authRoutes } from './routes/auth';
import { telemetryRoutes } from './routes/telemetry';
import { analyticsRoutes } from './routes/analytics';
import { studentRoutes } from './routes/students';
import { seedDatabase } from './db/seeds/seed_categories';
import { getDatabase } from './db/connection';

export function buildServer(): FastifyInstance {
  const app = fastify({
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

  // Health check endpoint
  app.get('/health', async () => {
    return {
      status: 'healthy',
      service: 'telemetry-ingestion-engine',
      timestamp: new Date().toISOString()
    };
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
