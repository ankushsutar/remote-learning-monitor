import { EventEmitter } from 'events';
import { FastifyReply } from 'fastify';

export interface TelemetryBroadcastEvent {
  deviceId: string;
  studentName?: string;
  intervalCount: number;
  totalDurationSec: number;
  totalBytesRx: number;
  totalBytesTx: number;
  timestamp: string;
  intervals: Array<{
    packageName: string;
    durationSec: number;
    category?: string;
  }>;
}

class TelemetryBroadcaster extends EventEmitter {
  private clients: Set<FastifyReply> = new Set();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  // Prometheus Metrics counters
  private batchesIngestedTotal = 0;
  private intervalsIngestedTotal = 0;
  private totalBatchDurationMs = 0;
  private uniqueDevices: Set<string> = new Set();
  private startTime = Date.now();

  constructor() {
    super();
    this.startHeartbeat();
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      for (const client of this.clients) {
        try {
          client.raw.write(': heartbeat ping\n\n');
        } catch {
          this.removeClient(client);
        }
      }
    }, 15000);
  }

  public addClient(reply: FastifyReply) {
    this.clients.add(reply);

    // Initial SSE connection handshake
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no' // Nginx disable buffering
    });

    reply.raw.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', activeClients: this.clients.size })}\n\n`);

    reply.raw.on('close', () => {
      this.removeClient(reply);
    });
  }

  public removeClient(reply: FastifyReply) {
    this.clients.delete(reply);
  }

  public broadcast(event: TelemetryBroadcastEvent) {
    const payload = `event: telemetry-batch\ndata: ${JSON.stringify(event)}\n\n`;
    for (const client of this.clients) {
      try {
        client.raw.write(payload);
      } catch {
        this.removeClient(client);
      }
    }
  }

  public recordBatchMetrics(intervalCount: number, durationMs: number, deviceId: string) {
    this.batchesIngestedTotal++;
    this.intervalsIngestedTotal += intervalCount;
    this.totalBatchDurationMs += durationMs;
    this.uniqueDevices.add(deviceId);
  }

  public getPrometheusMetrics(): string {
    const uptimeSec = Math.floor((Date.now() - this.startTime) / 1000);
    const avgLatencySec = this.batchesIngestedTotal > 0
      ? (this.totalBatchDurationMs / this.batchesIngestedTotal / 1000).toFixed(4)
      : '0.0000';

    return [
      '# HELP telemetry_uptime_seconds Process uptime in seconds',
      '# TYPE telemetry_uptime_seconds gauge',
      `telemetry_uptime_seconds ${uptimeSec}`,
      '',
      '# HELP telemetry_batches_ingested_total Total number of telemetry batches ingested',
      '# TYPE telemetry_batches_ingested_total counter',
      `telemetry_batches_ingested_total ${this.batchesIngestedTotal}`,
      '',
      '# HELP telemetry_intervals_ingested_total Total individual app intervals stored',
      '# TYPE telemetry_intervals_ingested_total counter',
      `telemetry_intervals_ingested_total ${this.intervalsIngestedTotal}`,
      '',
      '# HELP telemetry_batch_avg_latency_seconds Average batch processing time',
      '# TYPE telemetry_batch_avg_latency_seconds gauge',
      `telemetry_batch_avg_latency_seconds ${avgLatencySec}`,
      '',
      '# HELP telemetry_active_devices Active paired devices',
      '# TYPE telemetry_active_devices gauge',
      `telemetry_active_devices ${this.uniqueDevices.size}`,
      '',
      '# HELP telemetry_sse_connected_clients Active Web Dashboard SSE stream subscribers',
      '# TYPE telemetry_sse_connected_clients gauge',
      `telemetry_sse_connected_clients ${this.clients.size}`,
      ''
    ].join('\n');
  }

  public getDiagnostics() {
    return {
      batchesIngested: this.batchesIngestedTotal,
      intervalsIngested: this.intervalsIngestedTotal,
      activeDevices: this.uniqueDevices.size,
      connectedSseClients: this.clients.size
    };
  }
}

export const telemetryBroadcaster = new TelemetryBroadcaster();
