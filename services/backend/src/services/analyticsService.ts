import { getDatabase } from '../db/connection';
import { AppCategory, BandwidthPoint, FocusScoreResult, TamperAlert, TimelinePoint } from '../db/types';

export class AnalyticsService {
  /**
   * Computes Daily Focus Score: Ratio of (PRODUCTIVE + EDUCATIONAL) duration to total screen time.
   */
  async getDailyFocusScore(studentId?: string, targetDate = new Date()): Promise<FocusScoreResult> {
    const db = await getDatabase();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    let intervals: any[] = [];

    if (db.isPostgres()) {
      let query = `
        SELECT t.package_name, t.foreground_duration_sec, COALESCE(c.category, 'UNCLASSIFIED') as category
        FROM telemetry_intervals t
        JOIN devices d ON t.device_id = d.id
        LEFT JOIN app_categories c ON t.package_name = c.package_name
        WHERE t.start_time >= $1 AND t.start_time <= $2
      `;
      const params: any[] = [startOfDay, endOfDay];
      if (studentId) {
        query += ` AND d.student_id = $3`;
        params.push(studentId);
      }
      const res = await db.query(query, params);
      intervals = res.rows;
    } else {
      const memDb = db as any;
      let targetDeviceIds: Set<string> | null = null;
      if (studentId) {
        targetDeviceIds = new Set(
          Array.from(memDb.devices.values())
            .filter((d: any) => d.student_id === studentId)
            .map((d: any) => d.id)
        );
      }

      intervals = memDb.telemetryIntervals
        .filter((t: any) => {
          const inRange = t.start_time >= startOfDay && t.start_time <= endOfDay;
          if (!inRange) return false;
          if (targetDeviceIds && !targetDeviceIds.has(t.device_id)) return false;
          return true;
        })
        .map((t: any) => {
          const cat = memDb.appCategories.get(t.package_name)?.category || 'UNCLASSIFIED';
          return {
            package_name: t.package_name,
            foreground_duration_sec: t.foreground_duration_sec,
            category: cat
          };
        });
    }

    let productiveSeconds = 0;
    let educationalSeconds = 0;
    let socialMediaSeconds = 0;
    let gamingSeconds = 0;
    let entertainmentSeconds = 0;
    let unclassifiedSeconds = 0;

    for (const item of intervals) {
      const dur = Number(item.foreground_duration_sec) || 0;
      switch (item.category as AppCategory) {
        case 'PRODUCTIVE':
          productiveSeconds += dur;
          break;
        case 'EDUCATIONAL':
          educationalSeconds += dur;
          break;
        case 'SOCIAL_MEDIA':
          socialMediaSeconds += dur;
          break;
        case 'GAMING':
          gamingSeconds += dur;
          break;
        case 'ENTERTAINMENT':
          entertainmentSeconds += dur;
          break;
        default:
          unclassifiedSeconds += dur;
      }
    }

    const totalScreenTimeSeconds =
      productiveSeconds +
      educationalSeconds +
      socialMediaSeconds +
      gamingSeconds +
      entertainmentSeconds +
      unclassifiedSeconds;

    const focusedSeconds = productiveSeconds + educationalSeconds;
    const score =
      totalScreenTimeSeconds > 0
        ? Math.round((focusedSeconds / totalScreenTimeSeconds) * 1000) / 10
        : 100;

    return {
      score,
      productiveSeconds,
      educationalSeconds,
      socialMediaSeconds,
      gamingSeconds,
      entertainmentSeconds,
      unclassifiedSeconds,
      totalScreenTimeSeconds
    };
  }

  /**
   * Returns hour-by-hour telemetry distribution across app categories.
   */
  async getTimelineHeatmap(studentId?: string, targetDate = new Date()): Promise<TimelinePoint[]> {
    const db = await getDatabase();
    const hours: TimelinePoint[] = [];

    // Initialize 24-hour buckets
    for (let h = 0; h < 24; h++) {
      hours.push({
        hour: `${h.toString().padStart(2, '0')}:00`,
        productive: 0,
        educational: 0,
        socialMedia: 0,
        gaming: 0,
        entertainment: 0,
        unclassified: 0
      });
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    let rawRows: any[] = [];
    if (db.isPostgres()) {
      let query = `
        SELECT 
          EXTRACT(HOUR FROM t.start_time) as h,
          COALESCE(c.category, 'UNCLASSIFIED') as category,
          SUM(t.foreground_duration_sec) as total_sec
        FROM telemetry_intervals t
        JOIN devices d ON t.device_id = d.id
        LEFT JOIN app_categories c ON t.package_name = c.package_name
        WHERE t.start_time >= $1 AND t.start_time <= $2
      `;
      const params: any[] = [startOfDay, endOfDay];
      if (studentId) {
        query += ` AND d.student_id = $3`;
        params.push(studentId);
      }
      query += ` GROUP BY EXTRACT(HOUR FROM t.start_time), COALESCE(c.category, 'UNCLASSIFIED')`;
      const res = await db.query(query, params);
      rawRows = res.rows;
    } else {
      const memDb = db as any;
      let targetDeviceIds: Set<string> | null = null;
      if (studentId) {
        targetDeviceIds = new Set(
          Array.from(memDb.devices.values())
            .filter((d: any) => d.student_id === studentId)
            .map((d: any) => d.id)
        );
      }

      for (const t of memDb.telemetryIntervals) {
        if (t.start_time < startOfDay || t.start_time > endOfDay) continue;
        if (targetDeviceIds && !targetDeviceIds.has(t.device_id)) continue;
        const h = new Date(t.start_time).getHours();
        const cat = memDb.appCategories.get(t.package_name)?.category || 'UNCLASSIFIED';
        rawRows.push({
          h,
          category: cat,
          total_sec: t.foreground_duration_sec
        });
      }
    }

    for (const r of rawRows) {
      const hIdx = Math.floor(Number(r.h));
      if (hIdx >= 0 && hIdx < 24) {
        const dur = Math.round(Number(r.total_sec) / 60); // converted to minutes for charting
        switch (r.category as AppCategory) {
          case 'PRODUCTIVE':
            hours[hIdx].productive += dur;
            break;
          case 'EDUCATIONAL':
            hours[hIdx].educational += dur;
            break;
          case 'SOCIAL_MEDIA':
            hours[hIdx].socialMedia += dur;
            break;
          case 'GAMING':
            hours[hIdx].gaming += dur;
            break;
          case 'ENTERTAINMENT':
            hours[hIdx].entertainment += dur;
            break;
          default:
            hours[hIdx].unclassified += dur;
        }
      }
    }

    return hours;
  }

  /**
   * Analyzes bandwidth consumption and flags spikes in streaming / gaming during class hours.
   */
  async getBandwidthConsumption(studentId?: string, targetDate = new Date()): Promise<{
    points: BandwidthPoint[];
    classHoursTotalBytes: number;
    afterHoursTotalBytes: number;
    classHourSpikesDetected: number;
  }> {
    const db = await getDatabase();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    let rows: any[] = [];
    if (db.isPostgres()) {
      let query = `
        SELECT 
          t.start_time,
          t.bytes_rx,
          t.bytes_tx,
          t.package_name,
          COALESCE(c.category, 'UNCLASSIFIED') as category
        FROM telemetry_intervals t
        JOIN devices d ON t.device_id = d.id
        LEFT JOIN app_categories c ON t.package_name = c.package_name
        WHERE t.start_time >= $1 AND t.start_time <= $2
      `;
      const params: any[] = [startOfDay, endOfDay];
      if (studentId) {
        query += ` AND d.student_id = $3`;
        params.push(studentId);
      }
      query += ` ORDER BY t.start_time ASC`;
      const res = await db.query(query, params);
      rows = res.rows;
    } else {
      const memDb = db as any;
      let targetDeviceIds: Set<string> | null = null;
      if (studentId) {
        targetDeviceIds = new Set(
          Array.from(memDb.devices.values())
            .filter((d: any) => d.student_id === studentId)
            .map((d: any) => d.id)
        );
      }

      rows = memDb.telemetryIntervals
        .filter((t: any) => {
          if (t.start_time < startOfDay || t.start_time > endOfDay) return false;
          if (targetDeviceIds && !targetDeviceIds.has(t.device_id)) return false;
          return true;
        })
        .map((t: any) => ({
          start_time: t.start_time,
          bytes_rx: t.bytes_rx,
          bytes_tx: t.bytes_tx,
          package_name: t.package_name,
          category: memDb.appCategories.get(t.package_name)?.category || 'UNCLASSIFIED'
        }))
        .sort((a: any, b: any) => a.start_time.getTime() - b.start_time.getTime());
    }

    const points: BandwidthPoint[] = [];
    let classHoursTotalBytes = 0;
    let afterHoursTotalBytes = 0;
    let classHourSpikesDetected = 0;

    for (const r of rows) {
      const d = new Date(r.start_time);
      const hour = d.getHours();
      const isClassHours = hour >= 8 && hour < 15; // 08:00 to 15:00
      const rx = Number(r.bytes_rx);
      const tx = Number(r.bytes_tx);
      const total = rx + tx;

      if (isClassHours) {
        classHoursTotalBytes += total;
        // Spike check: gaming or streaming > 15MB during school hours
        if ((r.category === 'GAMING' || r.category === 'ENTERTAINMENT') && rx > 15 * 1024 * 1024) {
          classHourSpikesDetected++;
        }
      } else {
        afterHoursTotalBytes += total;
      }

      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      points.push({
        time: timeStr,
        rxBytes: rx,
        txBytes: tx,
        totalBytes: total,
        isClassHours,
        topPackage: r.package_name,
        topCategory: r.category as AppCategory
      });
    }

    return {
      points,
      classHoursTotalBytes,
      afterHoursTotalBytes,
      classHourSpikesDetected
    };
  }

  /**
   * Tamper Alert Indicator: Highlights devices that failed to sync in > 2 hours
   * or who re-enabled battery optimization.
   */
  async getTamperAlerts(): Promise<TamperAlert[]> {
    const db = await getDatabase();
    const now = Date.now();
    const twoHoursMs = 2 * 60 * 60 * 1000;
    const alerts: TamperAlert[] = [];

    if (db.isPostgres()) {
      const res = await db.query(`
        SELECT 
          d.id as device_id,
          d.student_id,
          d.battery_optimization_disabled,
          d.last_sync_at,
          s.first_name,
          s.last_name,
          s.student_code
        FROM devices d
        JOIN students s ON d.student_id = s.id
        WHERE s.is_active = true
      `);

      for (const row of res.rows) {
        const lastSync = row.last_sync_at ? new Date(row.last_sync_at) : null;
        const lastSyncMs = lastSync ? lastSync.getTime() : 0;
        const delayMs = now - lastSyncMs;
        const delayMin = Math.round(delayMs / 60000);
        const syncTimedOut = delayMs > twoHoursMs || !lastSync;
        const batteryOptReEnabled = !row.battery_optimization_disabled;

        if (syncTimedOut || batteryOptReEnabled) {
          let alertType: TamperAlert['alertType'] = 'SYNC_TIMEOUT';
          let severity: TamperAlert['severity'] = 'WARNING';

          if (syncTimedOut && batteryOptReEnabled) {
            alertType = 'MULTIPLE_ANOMALIES';
            severity = 'CRITICAL';
          } else if (syncTimedOut) {
            alertType = 'SYNC_TIMEOUT';
            severity = delayMin > 240 ? 'CRITICAL' : 'WARNING';
          } else if (batteryOptReEnabled) {
            alertType = 'BATTERY_OP_RE_ENABLED';
            severity = 'CRITICAL';
          }

          alerts.push({
            deviceId: row.device_id,
            studentId: row.student_id,
            studentName: `${row.first_name} ${row.last_name}`,
            studentCode: row.student_code,
            lastSyncAt: lastSync,
            syncDelayMinutes: delayMin,
            batteryOptimizationDisabled: row.battery_optimization_disabled,
            alertType,
            severity
          });
        }
      }
    } else {
      const memDb = db as any;
      for (const dev of memDb.devices.values()) {
        const student = memDb.students.get(dev.student_id);
        if (!student || !student.is_active) continue;

        const lastSync = dev.last_sync_at ? new Date(dev.last_sync_at) : null;
        const lastSyncMs = lastSync ? lastSync.getTime() : 0;
        const delayMs = now - lastSyncMs;
        const delayMin = Math.round(delayMs / 60000);
        const syncTimedOut = delayMs > twoHoursMs || !lastSync;
        const batteryOptReEnabled = !dev.battery_optimization_disabled;

        if (syncTimedOut || batteryOptReEnabled) {
          let alertType: TamperAlert['alertType'] = 'SYNC_TIMEOUT';
          let severity: TamperAlert['severity'] = 'WARNING';

          if (syncTimedOut && batteryOptReEnabled) {
            alertType = 'MULTIPLE_ANOMALIES';
            severity = 'CRITICAL';
          } else if (syncTimedOut) {
            alertType = 'SYNC_TIMEOUT';
            severity = delayMin > 240 ? 'CRITICAL' : 'WARNING';
          } else if (batteryOptReEnabled) {
            alertType = 'BATTERY_OP_RE_ENABLED';
            severity = 'CRITICAL';
          }

          alerts.push({
            deviceId: dev.id,
            studentId: student.id,
            studentName: `${student.first_name} ${student.last_name}`,
            studentCode: student.student_code,
            lastSyncAt: lastSync,
            syncDelayMinutes: delayMin,
            batteryOptimizationDisabled: dev.battery_optimization_disabled,
            alertType,
            severity
          });
        }
      }
    }

    return alerts.sort((a, b) => b.syncDelayMinutes - a.syncDelayMinutes);
  }

  /**
   * Package-level summary breakdown.
   */
  async getPackageBreakdown(studentId?: string) {
    const db = await getDatabase();
    if (db.isPostgres()) {
      let query = `
        SELECT 
          t.package_name,
          COALESCE(c.app_name, t.package_name) as app_name,
          COALESCE(c.category, 'UNCLASSIFIED') as category,
          SUM(t.foreground_duration_sec) as total_duration_sec,
          SUM(t.bytes_rx) as total_bytes_rx,
          SUM(t.bytes_tx) as total_bytes_tx,
          COUNT(*) as interval_count
        FROM telemetry_intervals t
        JOIN devices d ON t.device_id = d.id
        LEFT JOIN app_categories c ON t.package_name = c.package_name
      `;
      const params: any[] = [];
      if (studentId) {
        query += ` WHERE d.student_id = $1`;
        params.push(studentId);
      }
      query += ` GROUP BY t.package_name, c.app_name, c.category ORDER BY total_duration_sec DESC LIMIT 20`;
      const res = await db.query(query, params);
      return res.rows;
    } else {
      const memDb = db as any;
      const agg = new Map<string, any>();

      for (const t of memDb.telemetryIntervals) {
        const item = agg.get(t.package_name) || {
          package_name: t.package_name,
          app_name: memDb.appCategories.get(t.package_name)?.app_name || t.package_name,
          category: memDb.appCategories.get(t.package_name)?.category || 'UNCLASSIFIED',
          total_duration_sec: 0,
          total_bytes_rx: 0,
          total_bytes_tx: 0,
          interval_count: 0
        };
        item.total_duration_sec += t.foreground_duration_sec;
        item.total_bytes_rx += t.bytes_rx;
        item.total_bytes_tx += t.bytes_tx;
        item.interval_count += 1;
        agg.set(t.package_name, item);
      }

      return Array.from(agg.values()).sort(
        (a, b) => b.total_duration_sec - a.total_duration_sec
      ).slice(0, 20);
    }
  }
}

export const analyticsService = new AnalyticsService();
