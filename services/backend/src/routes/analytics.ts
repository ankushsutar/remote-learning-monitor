import { FastifyInstance } from 'fastify';
import { analyticsService } from '../services/analyticsService';

export async function analyticsRoutes(server: FastifyInstance) {
  // 1. Daily Focus Score
  server.get('/api/v1/analytics/focus-score', async (request, reply) => {
    const { studentId, date } = request.query as { studentId?: string; date?: string };
    const targetDate = date ? new Date(date) : new Date();

    const result = await analyticsService.getDailyFocusScore(studentId, targetDate);
    return reply.send(result);
  });

  // 2. Timeline Heatmap
  server.get('/api/v1/analytics/timeline', async (request, reply) => {
    const { studentId, date } = request.query as { studentId?: string; date?: string };
    const targetDate = date ? new Date(date) : new Date();

    const heatmap = await analyticsService.getTimelineHeatmap(studentId, targetDate);
    return reply.send(heatmap);
  });

  // 3. Bandwidth Consumption
  server.get('/api/v1/analytics/bandwidth', async (request, reply) => {
    const { studentId, date } = request.query as { studentId?: string; date?: string };
    const targetDate = date ? new Date(date) : new Date();

    const bandwidth = await analyticsService.getBandwidthConsumption(studentId, targetDate);
    return reply.send(bandwidth);
  });

  // 4. Tamper Alert Indicator
  server.get('/api/v1/analytics/tamper-alerts', async (request, reply) => {
    const alerts = await analyticsService.getTamperAlerts();
    return reply.send(alerts);
  });

  // 5. Package Breakdown
  server.get('/api/v1/analytics/packages', async (request, reply) => {
    const { studentId } = request.query as { studentId?: string };
    const packages = await analyticsService.getPackageBreakdown(studentId);
    return reply.send(packages);
  });

  // 6. Comprehensive Summary for Dashboard
  server.get('/api/v1/analytics/summary', async (request, reply) => {
    const { studentId, date } = request.query as { studentId?: string; date?: string };
    const targetDate = date ? new Date(date) : new Date();

    const [focusScore, timeline, bandwidth, tamperAlerts, packages] = await Promise.all([
      analyticsService.getDailyFocusScore(studentId, targetDate),
      analyticsService.getTimelineHeatmap(studentId, targetDate),
      analyticsService.getBandwidthConsumption(studentId, targetDate),
      analyticsService.getTamperAlerts(),
      analyticsService.getPackageBreakdown(studentId)
    ]);

    return reply.send({
      focusScore,
      timeline,
      bandwidth,
      tamperAlerts,
      packages,
      timestamp: Date.now()
    });
  });
}
