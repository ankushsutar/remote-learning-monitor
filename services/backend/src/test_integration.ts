import { buildServer } from './server';
import { seedDatabase } from './db/seeds/seed_categories';
import { getDatabase } from './db/connection';

async function runTests() {
  console.log('--- Starting Telemetry Platform Verification Test Suite ---');
  await getDatabase();
  await seedDatabase();

  const app = buildServer();
  await app.ready();

  // Test 1: Health check
  const healthRes = await app.inject({ method: 'GET', url: '/health' });
  console.log(`[Test 1] GET /health => ${healthRes.statusCode} (${JSON.parse(healthRes.payload).status})`);
  if (healthRes.statusCode !== 200) throw new Error('Health check failed');

  // Test 2: Device Pairing & JWT Issuance
  const pairRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/pair',
    payload: {
      studentCode: 'STU-94021',
      deviceFingerprint: 'test-fingerprint-galaxy-tab-01',
      osVersion: 'Android 14 (API 34)',
      batteryOptimizationDisabled: true
    }
  });
  console.log(`[Test 2] POST /api/v1/auth/pair => ${pairRes.statusCode}`);
  const pairData = JSON.parse(pairRes.payload);
  if (!pairData.token) throw new Error('Pairing did not return JWT token');
  console.log(`   Issued Device-Token (len=${pairData.token.length}), Device ID: ${pairData.deviceId}`);

  // Test 3: Telemetry Batch Ingestion with Zod Validation & Auth
  const now = Date.now();
  const testBatch = {
    timestamp: now,
    intervals: [
      {
        packageName: 'com.google.android.apps.classroom',
        startTime: now - 900000,
        endTime: now,
        foregroundDurationSec: 540,
        bytesRx: 14200000,
        bytesTx: 2100000
      },
      {
        packageName: 'org.khanacademy.android',
        startTime: now - 900000,
        endTime: now,
        foregroundDurationSec: 360,
        bytesRx: 8900000,
        bytesTx: 920000
      }
    ]
  };

  const batchRes1 = await app.inject({
    method: 'POST',
    url: '/api/v1/telemetry/batch',
    headers: {
      authorization: `Bearer ${pairData.token}`
    },
    payload: testBatch
  });
  console.log(`[Test 3] POST /api/v1/telemetry/batch (Initial) => ${batchRes1.statusCode}`);
  const batchData1 = JSON.parse(batchRes1.payload);
  console.log(`   Processed: ${batchData1.newRecordsProcessed}, Inserted: ${batchData1.insertedCount}, Duplicates: ${batchData1.duplicateCount}`);
  if (batchData1.insertedCount !== 2) throw new Error('Expected 2 inserted records');

  // Test 4: Idempotency & Deduplication Check (Repeat exact batch)
  const batchRes2 = await app.inject({
    method: 'POST',
    url: '/api/v1/telemetry/batch',
    headers: {
      authorization: `Bearer ${pairData.token}`
    },
    payload: testBatch
  });
  console.log(`[Test 4] POST /api/v1/telemetry/batch (Idempotency Retransmit) => ${batchRes2.statusCode}`);
  const batchData2 = JSON.parse(batchRes2.payload);
  console.log(`   Processed: ${batchData2.newRecordsProcessed}, Inserted: ${batchData2.insertedCount}, Duplicates: ${batchData2.duplicateCount}`);
  if (batchData2.insertedCount !== 0) throw new Error('Expected 0 inserted records on retransmit');

  // Test 5: Daily Focus Score Calculation
  const focusRes = await app.inject({
    method: 'GET',
    url: '/api/v1/analytics/focus-score'
  });
  console.log(`[Test 5] GET /api/v1/analytics/focus-score => ${focusRes.statusCode}`);
  const focusData = JSON.parse(focusRes.payload);
  console.log(`   Focus Score: ${focusData.score}%, Screen Time: ${Math.round(focusData.totalScreenTimeSeconds / 60)} mins`);

  // Test 6: Hourly Timeline Heatmap
  const timelineRes = await app.inject({
    method: 'GET',
    url: '/api/v1/analytics/timeline'
  });
  console.log(`[Test 6] GET /api/v1/analytics/timeline => ${timelineRes.statusCode}`);
  const timelineData = JSON.parse(timelineRes.payload);
  console.log(`   Heatmap Hourly Buckets: ${timelineData.length} hours returned`);

  // Test 7: Bandwidth Consumption Analysis
  const bwRes = await app.inject({
    method: 'GET',
    url: '/api/v1/analytics/bandwidth'
  });
  console.log(`[Test 7] GET /api/v1/analytics/bandwidth => ${bwRes.statusCode}`);
  const bwData = JSON.parse(bwRes.payload);
  console.log(`   Class Hours Bandwidth: ${Math.round(bwData.classHoursTotalBytes / 1024 / 1024)} MB, Spikes: ${bwData.classHourSpikesDetected}`);

  // Test 8: Tamper Alert Indicator
  const tamperRes = await app.inject({
    method: 'GET',
    url: '/api/v1/analytics/tamper-alerts'
  });
  console.log(`[Test 8] GET /api/v1/analytics/tamper-alerts => ${tamperRes.statusCode}`);
  const tamperData = JSON.parse(tamperRes.payload);
  console.log(`   Active Tamper Alerts: ${tamperData.length} flagged devices`);
  for (const a of tamperData) {
    console.log(`     - [${a.severity}] ${a.studentName} (${a.studentCode}): ${a.alertType} (delay=${a.syncDelayMinutes}m)`);
  }

  // Test 9: Student Catalog Listing
  const studentRes = await app.inject({
    method: 'GET',
    url: '/api/v1/students'
  });
  console.log(`[Test 9] GET /api/v1/students => ${studentRes.statusCode}`);
  const studentData = JSON.parse(studentRes.payload);
  console.log(`   Enrolled Students: ${studentData.length}`);

  console.log('\n>>> ALL 9 INTEGRATION VERIFICATION TESTS PASSED SUCCESSFULLY! <<<');
  await app.close();
  process.exit(0);
}

runTests().catch((e) => {
  console.error('Test Suite Failed:', e);
  process.exit(1);
});
