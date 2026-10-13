import { requireNativeModule, Platform } from 'expo-modules-core';

export interface AppTelemetryRecord {
  packageName: string;
  startTime: number;
  endTime: number;
  foregroundDurationSec: number;
  bytesRx: number;
  bytesTx: number;
}

export interface OutboxStats {
  pendingCount: number;
  oldestTimestamp: number;
  newestTimestamp: number;
  storageSizeBytes: number;
}

export interface NativeSyncResult {
  success: boolean;
  uploadedCount: number;
  remainingCount: number;
  error?: string | null;
}

interface NativeUsageTelemetryModule {
  hasUsagePermission(): boolean;
  requestUsagePermission(): void;
  isBatteryOptimizationIgnored(): boolean;
  requestIgnoreBatteryOptimization(): void;
  collectIntervalTelemetry(startTime: number, endTime: number): Promise<AppTelemetryRecord[]>;
  configureSyncWorker(backendUrl: string, deviceToken: string, deviceId: string): void;
  startBackgroundSync(): void;
  stopBackgroundSync(): void;
  openAppSettings(): void;
  getOutboxStats(): OutboxStats;
  getOutboxRecords(limit: number): AppTelemetryRecord[];
  triggerImmediateSync(): Promise<NativeSyncResult>;
  startForegroundMonitoring(): void;
  stopForegroundMonitoring(): void;
}

// Fallback for non-Android environments or development testing
const mockModule: NativeUsageTelemetryModule = {
  hasUsagePermission: () => true,
  requestUsagePermission: () => console.log('[UsageTelemetry] Mock requestUsagePermission invoked'),
  isBatteryOptimizationIgnored: () => true,
  requestIgnoreBatteryOptimization: () => console.log('[UsageTelemetry] Mock requestIgnoreBatteryOptimization invoked'),
  collectIntervalTelemetry: async (startTime: number, endTime: number): Promise<AppTelemetryRecord[]> => {
    const elapsed = Math.max(1, Math.floor((endTime - startTime) / 1000));
    return [
      {
        packageName: 'com.google.android.apps.classroom',
        startTime,
        endTime,
        foregroundDurationSec: Math.min(elapsed, 450),
        bytesRx: 1542000,
        bytesTx: 320000
      },
      {
        packageName: 'org.khanacademy.android',
        startTime,
        endTime,
        foregroundDurationSec: Math.min(elapsed, 280),
        bytesRx: 3820000,
        bytesTx: 190000
      },
      {
        packageName: 'com.instagram.android',
        startTime,
        endTime,
        foregroundDurationSec: Math.min(elapsed, 120),
        bytesRx: 5410000,
        bytesTx: 820000
      }
    ];
  },
  configureSyncWorker: (backendUrl: string, deviceToken: string, deviceId: string) => {
    console.log(`[UsageTelemetry] Mock configureSyncWorker: ${backendUrl}, device: ${deviceId}`);
  },
  startBackgroundSync: () => console.log('[UsageTelemetry] Mock startBackgroundSync'),
  stopBackgroundSync: () => console.log('[UsageTelemetry] Mock stopBackgroundSync'),
  openAppSettings: () => console.log('[UsageTelemetry] Mock openAppSettings invoked'),
  getOutboxStats: () => ({
    pendingCount: 0,
    oldestTimestamp: 0,
    newestTimestamp: 0,
    storageSizeBytes: 0
  }),
  getOutboxRecords: (_limit: number) => [],
  triggerImmediateSync: async () => ({
    success: true,
    uploadedCount: 0,
    remainingCount: 0,
    error: null
  }),
  startForegroundMonitoring: () => console.log('[UsageTelemetry] Mock startForegroundMonitoring'),
  stopForegroundMonitoring: () => console.log('[UsageTelemetry] Mock stopForegroundMonitoring')
};

let NativeModule: NativeUsageTelemetryModule;
try {
  if (Platform.OS === 'android') {
    NativeModule = requireNativeModule<NativeUsageTelemetryModule>('UsageTelemetry');
  } else {
    NativeModule = mockModule;
  }
} catch (e) {
  console.warn('[UsageTelemetry] Native module unavailable, falling back to mock provider:', e);
  NativeModule = mockModule;
}

export function hasUsagePermission(): boolean {
  try {
    return NativeModule.hasUsagePermission();
  } catch {
    return false;
  }
}

export function requestUsagePermission(): void {
  NativeModule.requestUsagePermission();
}

export function isBatteryOptimizationIgnored(): boolean {
  try {
    return NativeModule.isBatteryOptimizationIgnored();
  } catch {
    return false;
  }
}

export function requestIgnoreBatteryOptimization(): void {
  NativeModule.requestIgnoreBatteryOptimization();
}

export async function collectIntervalTelemetry(
  startTime: number,
  endTime: number
): Promise<AppTelemetryRecord[]> {
  return NativeModule.collectIntervalTelemetry(startTime, endTime);
}

export function configureSyncWorker(backendUrl: string, deviceToken: string, deviceId: string): void {
  NativeModule.configureSyncWorker(backendUrl, deviceToken, deviceId);
}

export function startBackgroundSync(): void {
  NativeModule.startBackgroundSync();
}

export function stopBackgroundSync(): void {
  NativeModule.stopBackgroundSync();
}

export function openAppSettings(): void {
  NativeModule.openAppSettings();
}

export function getOutboxStats(): OutboxStats {
  try {
    return NativeModule.getOutboxStats();
  } catch {
    return { pendingCount: 0, oldestTimestamp: 0, newestTimestamp: 0, storageSizeBytes: 0 };
  }
}

export function getOutboxRecords(limit = 50): AppTelemetryRecord[] {
  try {
    return NativeModule.getOutboxRecords(limit);
  } catch {
    return [];
  }
}

export async function triggerImmediateSync(): Promise<NativeSyncResult> {
  try {
    return await NativeModule.triggerImmediateSync();
  } catch (err: any) {
    return { success: false, uploadedCount: 0, remainingCount: 0, error: err.message };
  }
}

export function startForegroundMonitoring(): void {
  NativeModule.startForegroundMonitoring();
}

export function stopForegroundMonitoring(): void {
  NativeModule.stopForegroundMonitoring();
}

export default {
  hasUsagePermission,
  requestUsagePermission,
  openAppSettings,
  isBatteryOptimizationIgnored,
  requestIgnoreBatteryOptimization,
  collectIntervalTelemetry,
  configureSyncWorker,
  startBackgroundSync,
  stopBackgroundSync,
  getOutboxStats,
  getOutboxRecords,
  triggerImmediateSync,
  startForegroundMonitoring,
  stopForegroundMonitoring
};
