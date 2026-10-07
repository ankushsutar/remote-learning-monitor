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

  // Refresh permissions and queue stats
  const refreshStatus = useCallback(async () => {
    const hasUsage = UsageTelemetry.hasUsagePermission();
    const isBatteryIgnored = UsageTelemetry.isBatteryOptimizationIgnored();
    const stats = await getQueueStats();
    const records = await peekQueue(15);

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
    setTimeout(refreshStatus, 2000);
  }, [refreshStatus]);

  // Request Battery Optimization Exemption
  const requestBatteryOpt = useCallback(() => {
    UsageTelemetry.requestIgnoreBatteryOptimization();
    setTimeout(refreshStatus, 2000);
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
    enableBackgroundWorker
  };
}
