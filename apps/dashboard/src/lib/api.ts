import { DashboardSummary, Student, TamperAlert } from './types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function fetchStudents(): Promise<Student[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/students`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[DashboardAPI] Failed fetching students from backend, using fallback:', e);
  }

  // Fallback demo students
  return [
    {
      id: 's1111111-1111-1111-1111-111111111111',
      student_code: 'STU-94021',
      first_name: 'Alex',
      last_name: 'Rivera',
      is_active: true,
      device_id: 'd1111111-1111-1111-1111-111111111111',
      device_fingerprint: 'fingerprint-STU-94021',
      os_version: 'Android 14 (API 34)',
      battery_optimization_disabled: true,
      last_sync_at: new Date(Date.now() - 4 * 60000).toISOString()
    },
    {
      id: 's2222222-2222-2222-2222-222222222222',
      student_code: 'STU-88104',
      first_name: 'Maya',
      last_name: 'Patel',
      is_active: true,
      device_id: 'd2222222-2222-2222-2222-222222222222',
      device_fingerprint: 'fingerprint-STU-88104',
      os_version: 'Android 14 (API 34)',
      battery_optimization_disabled: false,
      last_sync_at: new Date(Date.now() - 12 * 60000).toISOString()
    },
    {
      id: 's3333333-3333-3333-3333-333333333333',
      student_code: 'STU-77519',
      first_name: 'Noah',
      last_name: 'Davis',
      is_active: true,
      device_id: 'd3333333-3333-3333-3333-333333333333',
      device_fingerprint: 'fingerprint-STU-77519',
      os_version: 'Android 13 (API 33)',
      battery_optimization_disabled: true,
      last_sync_at: new Date(Date.now() - 185 * 60000).toISOString()
    }
  ];
}

export async function fetchDashboardSummary(studentId?: string): Promise<DashboardSummary> {
  const query = studentId ? `?studentId=${studentId}` : '';
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/analytics/summary${query}`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[DashboardAPI] Failed fetching analytics summary, generating responsive baseline:', e);
  }

  // Responsive rich fallback data
  return {
    focusScore: {
      score: 72.4,
      productiveSeconds: 7100,
      educationalSeconds: 5900,
      socialMediaSeconds: 2700,
      gamingSeconds: 900,
      entertainmentSeconds: 1400,
      unclassifiedSeconds: 0,
      totalScreenTimeSeconds: 18000
    },
    timeline: [
      { hour: '08:00', productive: 0, educational: 50, socialMedia: 0, gaming: 0, entertainment: 0, unclassified: 0 },
      { hour: '09:00', productive: 55, educational: 0, socialMedia: 0, gaming: 0, entertainment: 0, unclassified: 0 },
      { hour: '10:00', productive: 0, educational: 35, socialMedia: 0, gaming: 0, entertainment: 0, unclassified: 0 },
      { hour: '11:00', productive: 0, educational: 0, socialMedia: 20, gaming: 15, entertainment: 0, unclassified: 0 },
      { hour: '12:00', productive: 0, educational: 0, socialMedia: 10, gaming: 0, entertainment: 40, unclassified: 0 },
      { hour: '13:00', productive: 20, educational: 30, socialMedia: 0, gaming: 0, entertainment: 0, unclassified: 0 },
      { hour: '14:00', productive: 45, educational: 0, socialMedia: 0, gaming: 0, entertainment: 0, unclassified: 0 },
      { hour: '15:00', productive: 0, educational: 0, socialMedia: 25, gaming: 0, entertainment: 0, unclassified: 0 }
    ],
    bandwidth: {
      points: [
        { time: '08:00', rxBytes: 36000000, txBytes: 4300000, totalBytes: 40300000, isClassHours: true, topPackage: 'org.khanacademy.android', topCategory: 'EDUCATIONAL' },
        { time: '09:00', rxBytes: 52500000, txBytes: 12950000, totalBytes: 65450000, isClassHours: true, topPackage: 'com.google.android.apps.meetings', topCategory: 'PRODUCTIVE' },
        { time: '10:00', rxBytes: 11200000, txBytes: 1900000, totalBytes: 1310000, isClassHours: true, topPackage: 'com.quizlet.quizletandroid', topCategory: 'EDUCATIONAL' },
        { time: '11:00', rxBytes: 90000000, txBytes: 11000000, totalBytes: 101000000, isClassHours: true, topPackage: 'com.roblox.client', topCategory: 'GAMING' },
        { time: '12:00', rxBytes: 117000000, txBytes: 4100000, totalBytes: 121100000, isClassHours: false, topPackage: 'com.google.android.youtube', topCategory: 'ENTERTAINMENT' },
        { time: '13:00', rxBytes: 23000000, txBytes: 4200000, totalBytes: 27200000, isClassHours: true, topPackage: 'com.google.android.apps.classroom', topCategory: 'EDUCATIONAL' },
        { time: '14:00', rxBytes: 15400000, txBytes: 3900000, totalBytes: 19300000, isClassHours: true, topPackage: 'com.Slack', topCategory: 'PRODUCTIVE' }
      ],
      classHoursTotalBytes: 247150000,
      afterHoursTotalBytes: 121100000,
      classHourSpikesDetected: 1
    },
    tamperAlerts: [
      {
        deviceId: 'd3333333-3333-3333-3333-333333333333',
        studentId: 's3333333-3333-3333-3333-333333333333',
        studentName: 'Noah Davis',
        studentCode: 'STU-77519',
        lastSyncAt: new Date(Date.now() - 185 * 60000).toISOString(),
        syncDelayMinutes: 185,
        batteryOptimizationDisabled: true,
        alertType: 'SYNC_TIMEOUT',
        severity: 'CRITICAL'
      },
      {
        deviceId: 'd2222222-2222-2222-2222-222222222222',
        studentId: 's2222222-2222-2222-2222-222222222222',
        studentName: 'Maya Patel',
        studentCode: 'STU-88104',
        lastSyncAt: new Date(Date.now() - 12 * 60000).toISOString(),
        syncDelayMinutes: 12,
        batteryOptimizationDisabled: false,
        alertType: 'BATTERY_OP_RE_ENABLED',
        severity: 'CRITICAL'
      }
    ],
    packages: [
      { package_name: 'com.google.android.apps.classroom', app_name: 'Google Classroom', appName: 'Google Classroom', category: 'EDUCATIONAL', total_duration_sec: 3400, total_bytes_rx: 26000000, total_bytes_tx: 5300000, interval_count: 2 },
      { package_name: 'com.google.android.apps.docs.editors.docs', app_name: 'Google Docs', appName: 'Google Docs', category: 'PRODUCTIVE', total_duration_sec: 2100, total_bytes_rx: 4500000, total_bytes_tx: 950000, interval_count: 1 },
      { package_name: 'org.khanacademy.android', app_name: 'Khan Academy', appName: 'Khan Academy', category: 'EDUCATIONAL', total_duration_sec: 1200, total_bytes_rx: 24000000, total_bytes_tx: 1800000, interval_count: 1 },
      { package_name: 'com.google.android.apps.meetings', app_name: 'Google Meet', appName: 'Google Meet', category: 'PRODUCTIVE', total_duration_sec: 1200, total_bytes_rx: 48000000, total_bytes_tx: 12000000, interval_count: 1 },
      { package_name: 'com.instagram.android', app_name: 'Instagram', appName: 'Instagram', category: 'SOCIAL_MEDIA', total_duration_sec: 1200, total_bytes_rx: 35000000, total_bytes_tx: 4200000, interval_count: 1 },
      { package_name: 'com.roblox.client', app_name: 'Roblox', appName: 'Roblox', category: 'GAMING', total_duration_sec: 900, total_bytes_rx: 55000000, total_bytes_tx: 6800000, interval_count: 1 },
      { package_name: 'com.google.android.youtube', app_name: 'YouTube', appName: 'YouTube', category: 'ENTERTAINMENT', total_duration_sec: 1800, total_bytes_rx: 95000000, total_bytes_tx: 3200000, interval_count: 1 }
    ],
    timestamp: Date.now()
  };
}

export async function simulateTelemetryBatch(deviceId?: string): Promise<any> {
  const res = await fetch(`${BACKEND_URL}/api/v1/telemetry/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId })
  });
  return res.json();
}
