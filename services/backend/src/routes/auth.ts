import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/connection';
import { config } from '../config';
import { verifyDeviceToken } from '../middleware/auth';

const PairDeviceSchema = z.object({
  studentCode: z.string().min(3),
  deviceFingerprint: z.string().min(5),
  osVersion: z.string().default('Android 14 (API 34)'),
  batteryOptimizationDisabled: z.boolean().default(false)
});

export async function authRoutes(server: FastifyInstance) {
  // Device Pairing & Initial Token Issuance
  server.post('/api/v1/auth/pair', async (request, reply) => {
    const parseResult = PairDeviceSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: parseResult.error.errors
      });
    }

    const { studentCode, deviceFingerprint, osVersion, batteryOptimizationDisabled } = parseResult.data;
    const db = await getDatabase();

    let student: any = null;
    let device: any = null;

    if (db.isPostgres()) {
      const studentRes = await db.query(
        `SELECT id, student_code, school_id, first_name, last_name, is_active FROM students WHERE student_code = $1`,
        [studentCode]
      );
      if (studentRes.rows.length === 0) {
        return reply.status(404).send({ error: 'Student not found with specified code.' });
      }
      student = studentRes.rows[0];
      if (!student.is_active) {
        return reply.status(403).send({ error: 'Student enrollment is currently inactive.' });
      }

      // Check or create device
      const devRes = await db.query(
        `SELECT id, student_id, device_fingerprint, os_version, battery_optimization_disabled, last_sync_at FROM devices WHERE device_fingerprint = $1`,
        [deviceFingerprint]
      );

      if (devRes.rows.length > 0) {
        device = devRes.rows[0];
        await db.query(
          `UPDATE devices SET os_version = $1, battery_optimization_disabled = $2, updated_at = NOW() WHERE id = $3`,
          [osVersion, batteryOptimizationDisabled, device.id]
        );
      } else {
        const newDevId = uuidv4();
        await db.query(
          `INSERT INTO devices (id, student_id, device_fingerprint, os_version, battery_optimization_disabled)
           VALUES ($1, $2, $3, $4, $5)`,
          [newDevId, student.id, deviceFingerprint, osVersion, batteryOptimizationDisabled]
        );
        device = { id: newDevId, student_id: student.id };
      }
    } else {
      const memDb = db as any;
      student = Array.from(memDb.students.values()).find(
        (s: any) => s.student_code === studentCode
      );

      if (!student) {
        // Auto-provision demo student if testing
        student = {
          id: uuidv4(),
          student_code: studentCode,
          school_id: 'a0000000-0000-0000-0000-000000000001',
          first_name: 'Demo',
          last_name: 'Student',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        };
        memDb.students.set(student.id, student);
      }

      device = Array.from(memDb.devices.values()).find(
        (d: any) => d.device_fingerprint === deviceFingerprint
      );

      if (!device) {
        device = {
          id: uuidv4(),
          student_id: student.id,
          device_fingerprint: deviceFingerprint,
          os_version: osVersion,
          battery_optimization_disabled: batteryOptimizationDisabled,
          last_sync_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        };
        memDb.devices.set(device.id, device);
      }
    }

    // Generate signed rotating JWT token valid for 7 days
    const token = jwt.sign(
      {
        deviceId: device.id,
        studentId: student.id,
        schoolId: student.school_id,
        type: 'device_token'
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return reply.status(200).send({
      token,
      deviceId: device.id,
      studentId: student.id,
      studentName: `${student.first_name} ${student.last_name}`,
      schoolId: student.school_id,
      expiresIn: 7 * 24 * 3600
    });
  });

  // Token rotation endpoint
  server.post(
    '/api/v1/auth/refresh',
    { preHandler: [verifyDeviceToken] },
    async (request, reply) => {
      const current = request.device!;

      const refreshedToken = jwt.sign(
        {
          deviceId: current.deviceId,
          studentId: current.studentId,
          schoolId: current.schoolId,
          type: 'device_token'
        },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      return reply.send({
        token: refreshedToken,
        expiresIn: 7 * 24 * 3600
      });
    }
  );
}
