import { FastifyInstance } from 'fastify';
import { getDatabase } from '../db/connection';

export async function studentRoutes(server: FastifyInstance) {
  // List students with devices and status
  server.get('/api/v1/students', async (_request, reply) => {
    const db = await getDatabase();

    if (db.isPostgres()) {
      const res = await db.query(`
        SELECT 
          s.id,
          s.student_code,
          s.first_name,
          s.last_name,
          s.is_active,
          d.id as device_id,
          d.device_fingerprint,
          d.os_version,
          d.battery_optimization_disabled,
          d.last_sync_at
        FROM students s
        LEFT JOIN devices d ON s.id = d.student_id
        ORDER BY s.last_name ASC
      `);
      return reply.send(res.rows);
    } else {
      const memDb = db as any;
      const list = Array.from(memDb.students.values()).map((s: any) => {
        const dev = Array.from(memDb.devices.values()).find((d: any) => d.student_id === s.id) as any;
        return {
          id: s.id,
          student_code: s.student_code,
          first_name: s.first_name,
          last_name: s.last_name,
          is_active: s.is_active,
          device_id: dev?.id || null,
          device_fingerprint: dev?.device_fingerprint || null,
          os_version: dev?.os_version || null,
          battery_optimization_disabled: dev?.battery_optimization_disabled ?? null,
          last_sync_at: dev?.last_sync_at || null
        };
      });
      return reply.send(list);
    }
  });

  // Get specific student
  server.get('/api/v1/students/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = await getDatabase();

    if (db.isPostgres()) {
      const res = await db.query(
        `SELECT s.*, d.id as device_id, d.os_version, d.battery_optimization_disabled, d.last_sync_at
         FROM students s
         LEFT JOIN devices d ON s.id = d.student_id
         WHERE s.id = $1`,
        [id]
      );
      if (res.rows.length === 0) return reply.status(404).send({ error: 'Student not found' });
      return reply.send(res.rows[0]);
    } else {
      const memDb = db as any;
      const student = memDb.students.get(id);
      if (!student) return reply.status(404).send({ error: 'Student not found' });
      const dev = Array.from(memDb.devices.values()).find((d: any) => d.student_id === id) as any;
      return reply.send({
        ...student,
        device_id: dev?.id || null,
        os_version: dev?.os_version || null,
        battery_optimization_disabled: dev?.battery_optimization_disabled ?? null,
        last_sync_at: dev?.last_sync_at || null
      });
    }
  });

  // Device heartbeat
  server.post('/api/v1/devices/:id/heartbeat', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { batteryOptimizationDisabled } = request.body as { batteryOptimizationDisabled?: boolean };
    const db = await getDatabase();
    const now = new Date();

    if (db.isPostgres()) {
      await db.query(
        `UPDATE devices 
         SET last_sync_at = $1, 
             battery_optimization_disabled = COALESCE($2, battery_optimization_disabled),
             updated_at = $1
         WHERE id = $3`,
        [now, batteryOptimizationDisabled, id]
      );
    } else {
      const memDb = db as any;
      const dev = memDb.devices.get(id);
      if (dev) {
        dev.last_sync_at = now;
        if (batteryOptimizationDisabled !== undefined) {
          dev.battery_optimization_disabled = batteryOptimizationDisabled;
        }
      }
    }

    return reply.send({ status: 'ok', lastSyncAt: now });
  });
}
