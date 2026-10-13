import { useState, useEffect, useCallback } from 'react';
import UsageTelemetry, { AppTelemetryRecord } from '../../modules/usage-telemetry';
import {
  initDatabase,
  enqueueTelemetry,
  getQueueStats,
  peekQueue,
  syncBufferedTelemetry,
  QueuedTelemetryRecord,
  SyncResult
} from '../storage/db';
import { telemetryClient } from '../api/telemetryClient';
import { Platform } from 'react-native';

export interface TelemetryState {
  hasUsagePermission: boolean;
  isBatteryOptimizationIgnored: boolean;
  isCollecting: boolean;
  isSyncing: boolean;
  queueStats: {
    pendingCount: number;
    oldestTimestamp: number | null;
    newestTimestamp: number | null;
  };
  queuedRecords: QueuedTelemetryRecord[];
  lastSyncResult: SyncResult | null;
  pairedStudent: string | null;
  deviceId: string | null;
}

export function useTelemetry(
  backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.0.2.2:4000'
) {
  const [state, setState] = useState<TelemetryState>({
    hasUsagePermission: false,
    isBatteryOptimizationIgnored: false,
    isCollecting: false,
    isSyncing: false,
    queueStats: { pendingCount: 0, oldestTimestamp: null, newestTimestamp: null },
    queuedRecords: [],
    lastSyncResult: null,
    pairedStudent: null,
    deviceId: null
  });

  // Refresh permissions and unified outbox queue stats
  const refreshStatus = useCallback(async () => {
    const hasUsage = UsageTelemetry.hasUsagePermission();
    const isBatteryIgnored = UsageTelemetry.isBatteryOptimizationIgnored();

    let stats = { pendingCount: 0, oldestTimestamp: null as number | null, newestTimestamp: null as number | null };
    let records: QueuedTelemetryRecord[] = [];

    if (Platform.OS === 'android') {
      try {
        const nativeStats = UsageTelemetry.getOutboxStats();
        const nativeRecords = UsageTelemetry.getOutboxRecords(15);
        if (nativeStats && nativeStats.pendingCount >= 0) {
          stats = {
            pendingCount: nativeStats.pendingCount,
            oldestTimestamp: nativeStats.oldestTimestamp || null,
            newestTimestamp: nativeStats.newestTimestamp || null
          };
          records = nativeRecords.map((r, idx) => ({
            id: (r as any).id ?? (idx + 1),
            packageName: r.packageName,
            startTime: r.startTime,
            endTime: r.endTime,
            foregroundDurationSec: r.foregroundDurationSec,
            bytesRx: r.bytesRx,
            bytesTx: r.bytesTx,
            createdAt: r.endTime,
            retryCount: (r as any).retryCount ?? 0,
            status: 'PENDING'
          }));
        }
      } catch {
        // Fallback to SQLite DB if native outbox threw
        stats = await getQueueStats();
        records = await peekQueue(15);
      }
    } else {
      stats = await getQueueStats();
      records = await peekQueue(15);
    }

    setState((prev) => ({
      ...prev,
      hasUsagePermission: hasUsage,
      isBatteryOptimizationIgnored: isBatteryIgnored,
      queueStats: stats,
      queuedRecords: records
    }));
  }, []);

  // Initialize DB and status on mount
  useEffect(() => {
    (async () => {
      await initDatabase();
      await refreshStatus();
    })();

    const interval = setInterval(refreshStatus, 8000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  // Request Usage Permission
  const requestUsagePermission = useCallback(() => {
    UsageTelemetry.requestUsagePermission();
    setTimeout(refreshStatus, 1500);
  }, [refreshStatus]);

  // Request Battery Optimization Exemption
  const requestBatteryOpt = useCallback(() => {
    UsageTelemetry.requestIgnoreBatteryOptimization();
    setTimeout(refreshStatus, 1500);
  }, [refreshStatus]);

  // Collect telemetry for a custom window (e.g., past 15 minutes) and enqueue
  const collectAndEnqueue = useCallback(
    async (lookbackMinutes = 15): Promise<AppTelemetryRecord[]> => {
      setState((prev) => ({ ...prev, isCollecting: true }));
      try {
        const now = Date.now();
        const start = now - lookbackMinutes * 60 * 1000;
        const records = await UsageTelemetry.collectIntervalTelemetry(start, now);
        if (records.length > 0) {
          await enqueueTelemetry(records);
        }
        await refreshStatus();
        return records;
      } catch (err) {
        console.error('[useTelemetry] Collection error:', err);
        return [];
      } finally {
        setState((prev) => ({ ...prev, isCollecting: false }));
      }
    },
    [refreshStatus]
  );

  // Trigger manual sync of offline buffer
  const triggerSync = useCallback(async (): Promise<SyncResult> => {
    setState((prev) => ({ ...prev, isSyncing: true }));
    try {
      if (Platform.OS === 'android') {
        const nativeRes = await UsageTelemetry.triggerImmediateSync();
        if (nativeRes.success) {
          const res: SyncResult = {
            success: true,
            uploadedCount: nativeRes.uploadedCount,
            remainingCount: nativeRes.remainingCount
          };
          setState((prev) => ({ ...prev, lastSyncResult: res }));
          await refreshStatus();
          return res;
        }
      }

      const token = telemetryClient.getToken() || 'dev-demo-token';
      const result = await syncBufferedTelemetry(backendUrl, token);
      setState((prev) => ({ ...prev, lastSyncResult: result }));
      await refreshStatus();
      return result;
    } catch (err: any) {
      const failedResult: SyncResult = {
        success: false,
        uploadedCount: 0,
        remainingCount: state.queueStats.pendingCount,
        error: err.message
      };
      setState((prev) => ({ ...prev, lastSyncResult: failedResult }));
      return failedResult;
    } finally {
      setState((prev) => ({ ...prev, isSyncing: false }));
    }
  }, [backendUrl, refreshStatus, state.queueStats.pendingCount]);

  // Configure and start background WorkManager
  const enableBackgroundWorker = useCallback(
    (token: string, deviceId: string) => {
      UsageTelemetry.configureSyncWorker(backendUrl, token, deviceId);
      UsageTelemetry.startBackgroundSync();
    },
    [backendUrl]
  );

  return {
    ...state,
    refreshStatus,
    requestUsagePermission,
    openAppSettings: UsageTelemetry.openAppSettings,
    requestBatteryOpt,
    collectAndEnqueue,
    triggerSync,
    enableBackgroundWorker,
    startForegroundMonitoring: UsageTelemetry.startForegroundMonitoring,
    stopForegroundMonitoring: UsageTelemetry.stopForegroundMonitoring
  };
}
