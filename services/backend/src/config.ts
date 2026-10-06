import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Look for centralized .env in workspace root first, then fallback to local directory
const rootEnvPath = path.resolve(__dirname, '../../../.env');
const localEnvPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else {
  dotenv.config();
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  logLevel: process.env.LOG_LEVEL || 'info',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/telemetry_db',
  databasePoolMax: parseInt(process.env.DATABASE_POOL_MAX || '20', 10),
  databaseIdleTimeoutMs: parseInt(process.env.DATABASE_IDLE_TIMEOUT_MS || '30000', 10),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisDedupTtlSec: parseInt(process.env.REDIS_DEDUP_TTL_SEC || '86400', 10),
  jwtSecret: process.env.JWT_SECRET || 'antigravity-production-telemetry-key-2026',
  jwtExpiry: process.env.JWT_EXPIRY || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  telemetrySyncIntervalMin: parseInt(process.env.TELEMETRY_SYNC_INTERVAL_MIN || '15', 10),
  tamperSyncTimeoutHours: parseInt(process.env.TAMPER_SYNC_TIMEOUT_HOURS || '2', 10),
  classroomBandwidthSpikeMB: parseInt(process.env.CLASSROOM_BANDWIDTH_SPIKE_MB || '15', 10)
};
