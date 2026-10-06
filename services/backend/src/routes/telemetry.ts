import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { verifyDeviceToken } from '../middleware/auth';
import { telemetryService } from '../services/telemetryService';
import { getDatabase } from '../db/connection';

const TelemetryIntervalSchema = z.object({
  packageName: z.string().min(1).max(255),
  startTime: z.number().int().positive(),
  endTime: z.number().int().positive(),
  foregroundDurationSec: z.number().int().nonnegative(),
  bytesRx: z.number().int().nonnegative().default(0),
  bytesTx: z.number().int().nonnegative().default(0)
}).refine((data) => data.endTime >= data.startTime, {
  message: 'endTime must be greater than or equal to startTime'
});

const TelemetryBatchSchema = z.object({
  timestamp: z.number().optional(),
  intervals: z.array(TelemetryIntervalSchema).min(1).max(1000)
});

export async function telemetryRoutes(server: FastifyInstance) {
  /**
   * Main High-Throughput Telemetry Ingestion Endpoint
   * Authenticated via signed Device-Token JWT
   */
  server.post(
    '/api/v1/telemetry/batch',
    { preHandler: [verifyDeviceToken] },
    async (request, reply) => {
      const device = request.device!;

      // Validate incoming batch using Zod schema
      const parseResult = TelemetryBatchSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: 'Telemetry batch validation failed',
          issues: parseResult.error.errors
        });
      }

      const { intervals } = parseResult.data;

      try {
        const result = await telemetryService.ingestBatch(device.deviceId, intervals);
        return reply.status(200).send({
          success: true,
          ...result
        });
      } catch (err: any) {
        request.log.error(err, 'Failed to ingest telemetry batch');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: `Ingestion failed: ${err.message}`
        });
      }
    }
  );

  /**
   * Simulation / Testing Ingestion Endpoint
   * Useful for dashboard live demos and development verification
   */
  server.post('/api/v1/telemetry/simulate', async (request, reply) => {
    const body: any = request.body || {};
    const db = await getDatabase();

    let targetDeviceId = body.deviceId;
    if (!targetDeviceId) {
      if (db.isPostgres()) {
        const devRes = await db.query(`SELECT id FROM devices LIMIT 1`);
        if (devRes.rows.length > 0) targetDeviceId = devRes.rows[0].id;
      } else {
        const memDb = db as any;
        const firstDev = memDb.devices.values().next().value;
        if (firstDev) targetDeviceId = firstDev.id;
      }
    }

    if (!targetDeviceId) {
      return reply.status(400).send({ error: 'No enrolled device available to simulate.' });
    }

    const now = Date.now();
    const mockPackages = [
      { pkg: 'com.google.android.apps.classroom', sec: 420, rx: 12500000, tx: 1800000 },
      { pkg: 'org.khanacademy.android', sec: 360, rx: 8900000, tx: 920000 },
      { pkg: 'com.instagram.android', sec: 180, rx: 14200000, tx: 2100000 },
      { pkg: 'com.roblox.client', sec: 240, rx: 32000000, tx: 4500000 }
    ];

    const intervals = mockPackages.map((p, idx) => ({
      packageName: p.pkg,
      startTime: now - (idx + 1) * 300000,
      endTime: now - idx * 300000,
      foregroundDurationSec: p.sec,
      bytesRx: p.rx,
      bytesTx: p.tx
    }));

    const result = await telemetryService.ingestBatch(targetDeviceId, intervals);

    return reply.status(200).send({
      simulated: true,
      deviceId: targetDeviceId,
      ...result
    });
  });
}
