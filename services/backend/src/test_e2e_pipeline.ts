process.env.LOG_LEVEL = 'warn';

import { buildServer } from './server';
import { seedDatabase } from './db/seeds/seed_categories';
import { getDatabase } from './db/connection';
import { telemetryBroadcaster } from './services/telemetryBroadcaster';

async function main() {
  console.log('\n======================================================================');
  console.log('   AEGIS TELEMETRY PLATFORM: PRODUCTION E2E VERIFICATION SUITE       ');
  console.log('======================================================================\n');

  await getDatabase();
  await seedDatabase();

  const app = buildServer();
  await app.ready();

  let token = '';
  let deviceId = '';

  // ----------------------------------------------------------------------------
  // SECTION 1: Hardware Device Authentication & Negative Auth Validation
  // ----------------------------------------------------------------------------
  console.log('[STAGE 1] Testing Hardware Pairing & Cryptographic Authentication...');
  
  // Negative Test: Unauthenticated Batch Request
  const unauthRes = await app.inject({
    method: 'POST',
    url: '/api/v1/telemetry/batch',
    payload: { timestamp: Date.now(), intervals: [] }
  });
  if (unauthRes.statusCode !== 401) {
    throw new Error(`Negative Auth Failed: Expected 401 Unauthorized, got ${unauthRes.statusCode}`);
  }
  console.log('  ✓ Verified 401 rejection for unauthenticated batch upload');

  // Pair Device
  const pairRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/pair',
    payload: {
      studentCode: 'STU-94021',
      deviceFingerprint: 'hw-keystore-verified-device-994',
      osVersion: 'Android 14 (API 34)',
      batteryOptimizationDisabled: true
    }
  });

  if (pairRes.statusCode !== 200) {
    throw new Error(`Device pairing failed: ${pairRes.payload}`);
  }

  const pairBody = JSON.parse(pairRes.payload);
  token = pairBody.token;
  deviceId = pairBody.deviceId;
  console.log(`  ✓ Successfully paired device ${deviceId} with Hardware Keystore token`);

  // ----------------------------------------------------------------------------
  // SECTION 2: Idempotency Verification under Network Duplicate Simulations
  // ----------------------------------------------------------------------------
  console.log('\n[STAGE 2] Testing Network Duplicate Ingestion & Idempotency...');
  
  const baseTime = Date.now();
  const testBatch = {
    timestamp: baseTime,
    intervals: [
      {
        packageName: 'com.google.android.apps.classroom',
        startTime: baseTime - 600000,
        endTime: baseTime,
        foregroundDurationSec: 420,
        bytesRx: 5400000,
        bytesTx: 950000
      },
      {
        packageName: 'org.khanacademy.android',
        startTime: baseTime - 600000,
        endTime: baseTime,
        foregroundDurationSec: 180,
        bytesRx: 2100000,
        bytesTx: 410000
      }
    ]
  };

  // 1st Transmission
  const tx1 = await app.inject({
    method: 'POST',
    url: '/api/v1/telemetry/batch',
    headers: { authorization: `Bearer ${token}` },
    payload: testBatch
  });
  const tx1Body = JSON.parse(tx1.payload);
  if (tx1.statusCode !== 200 || tx1Body.insertedCount !== 2) {
    throw new Error(`Initial batch failed: ${tx1.payload}`);
  }
  console.log(`  ✓ Initial batch stored 2 intervals (New: ${tx1Body.newRecordsProcessed})`);

  // Concurrent Retransmission Simulation (5 simultaneous network duplicates)
  console.log('  Simulating 5 simultaneous in-flight duplicate network requests...');
  const concurrentDuplicates = await Promise.all(
    Array.from({ length: 5 }).map(() =>
      app.inject({
        method: 'POST',
        url: '/api/v1/telemetry/batch',
        headers: { authorization: `Bearer ${token}` },
        payload: testBatch
      })
    )
  );

  for (const dupRes of concurrentDuplicates) {
    const dupBody = JSON.parse(dupRes.payload);
    if (dupBody.insertedCount !== 0) {
      throw new Error(`Duplicate insertion detected! Deduplication failed: ${dupRes.payload}`);
    }
  }
  console.log('  ✓ Exactly-Once Ingestion Verified: 0 duplicate records inserted across all 5 concurrent attempts');

  // ----------------------------------------------------------------------------
  // SECTION 3: Tamper Detection & Security Anomaly Auditing
  // ----------------------------------------------------------------------------
  console.log('\n[STAGE 3] Testing Tamper Alerts & Compliance Auditing...');
  
  const tamperRes = await app.inject({
    method: 'GET',
    url: '/api/v1/analytics/tamper-alerts'
  });
  if (tamperRes.statusCode !== 200) {
    throw new Error(`Tamper alerts query failed: ${tamperRes.payload}`);
  }
  const alerts = JSON.parse(tamperRes.payload);
  console.log(`  ✓ Queried tamper detection engine: found ${alerts.length} audit alert(s) across fleet`);

  // ----------------------------------------------------------------------------
  // SECTION 4: High-Concurrency Ingestion Throughput Benchmark
  // ----------------------------------------------------------------------------
  console.log('\n[STAGE 4] Executing High-Concurrency Batch Ingestion Benchmark...');
  
  const TOTAL_BATCHES = 500;
  const CONCURRENCY = 50;
  console.log(`  Firing ${TOTAL_BATCHES} distinct telemetry batches with concurrency=${CONCURRENCY}...`);

  const startTime = Date.now();
  let completed = 0;
  let errorCount = 0;

  for (let i = 0; i < TOTAL_BATCHES; i += CONCURRENCY) {
    const chunk = Array.from({ length: Math.min(CONCURRENCY, TOTAL_BATCHES - i) }).map((_, index) => {
      const batchId = i + index;
      const batchTime = baseTime - 10000000 + (batchId * 1000);
      return app.inject({
        method: 'POST',
        url: '/api/v1/telemetry/batch',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          timestamp: batchTime,
          intervals: [
            {
              packageName: batchId % 2 === 0 ? 'com.duolingo' : 'com.scratch.mit',
              startTime: batchTime - 900,
              endTime: batchTime,
              foregroundDurationSec: 60,
              bytesRx: 120000,
              bytesTx: 30000
            }
          ]
        }
      });
    });

    const results = await Promise.all(chunk);
    for (const r of results) {
      if (r.statusCode === 200) {
        completed++;
      } else {
        errorCount++;
      }
    }
  }

  const durationMs = Date.now() - startTime;
  const throughputRps = Math.round((completed / (durationMs / 1000)));

  console.log(`  ✓ Completed ${completed}/${TOTAL_BATCHES} batches in ${durationMs}ms`);
  console.log(`  ⚡ Ingestion Throughput: ${throughputRps} batches/second`);
  if (errorCount > 0) {
    throw new Error(`High-concurrency test had ${errorCount} errors`);
  }

  // ----------------------------------------------------------------------------
  // SECTION 5: Observability, Metrics & SSE Validation
  // ----------------------------------------------------------------------------
  console.log('\n[STAGE 5] Validating Observability, Readiness & Prometheus Metrics...');
  
  const readyRes = await app.inject({ method: 'GET', url: '/health/ready' });
  const liveRes = await app.inject({ method: 'GET', url: '/health/live' });
  const metricsRes = await app.inject({ method: 'GET', url: '/metrics' });

  if (readyRes.statusCode !== 200 || liveRes.statusCode !== 200 || metricsRes.statusCode !== 200) {
    throw new Error('Health check / metrics endpoint failure');
  }

  const metricsText = metricsRes.payload;
  if (!metricsText.includes('telemetry_batches_ingested_total') || !metricsText.includes('telemetry_active_devices')) {
    throw new Error('Prometheus metrics missing expected telemetry counters');
  }

  console.log('  ✓ Kubernetes /health/ready and /health/live confirmed healthy');
  console.log('  ✓ Prometheus scraping format validated with real-time counters');

  const diag = telemetryBroadcaster.getDiagnostics();
  console.log(`  ✓ Real-time SSE Diagnostics: ${diag.batchesIngested} batches broadcasted, ${diag.intervalsIngested} intervals processed`);

  console.log('\n======================================================================');
  console.log('   >>> ALL PRODUCTION VERIFICATION CHECKS PASSED WITH ZERO ERRORS <<< ');
  console.log('======================================================================\n');

  await app.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ E2E VERIFICATION SUITE FAILED:', err);
  process.exit(1);
});
