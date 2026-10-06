import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface DeviceJwtPayload {
  deviceId: string;
  studentId: string;
  schoolId: string;
  type: 'device_token';
  iat?: number;
  exp?: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    device?: DeviceJwtPayload;
  }
}

export async function verifyDeviceToken(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Missing Authorization header with Device-Token'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid Authorization header format. Expected "Bearer <token>"'
    });
  }

  const token = parts[1];

  // Development bypass token for testing / initial simulation
  if (token === 'dev-demo-token') {
    request.device = {
      deviceId: 'd1111111-1111-1111-1111-111111111111',
      studentId: 's1111111-1111-1111-1111-111111111111',
      schoolId: 'a0000000-0000-0000-0000-000000000001',
      type: 'device_token'
    };
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as DeviceJwtPayload;
    if (decoded.type !== 'device_token') {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Invalid token type'
      });
    }
    request.device = decoded;
  } catch (err: any) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: `Invalid or expired device token: ${err.message}`
    });
  }
}
