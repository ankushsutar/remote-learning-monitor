export type AppCategory =
  | 'PRODUCTIVE'
  | 'EDUCATIONAL'
  | 'SOCIAL_MEDIA'
  | 'GAMING'
  | 'ENTERTAINMENT'
  | 'UNCLASSIFIED';

export interface Student {
  id: string;
  student_code: string;
  school_id: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Device {
  id: string;
  student_id: string;
  device_fingerprint: string;
  os_version: string;
  battery_optimization_disabled: boolean;
  last_sync_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface AppCategoryRecord {
  package_name: string;
  app_name: string;
  category: AppCategory;
  created_at: Date;
  updated_at: Date;
}

export interface TelemetryInterval {
  id: string | number;
  device_id: string;
  package_name: string;
  start_time: Date;
  end_time: Date;
  foreground_duration_sec: number;
  bytes_rx: number;
  bytes_tx: number;
  created_at?: Date;
}

export interface FocusScoreResult {
  score: number; // 0 to 100 percentage
  productiveSeconds: number;
  educationalSeconds: number;
  socialMediaSeconds: number;
  gamingSeconds: number;
  entertainmentSeconds: number;
  unclassifiedSeconds: number;
  totalScreenTimeSeconds: number;
}

export interface TimelinePoint {
  hour: string; // e.g., "08:00"
  productive: number;
  educational: number;
  socialMedia: number;
  gaming: number;
  entertainment: number;
  unclassified: number;
}

export interface BandwidthPoint {
  time: string;
  rxBytes: number;
  txBytes: number;
  totalBytes: number;
  isClassHours: boolean;
  topPackage?: string;
  topCategory?: AppCategory;
}

export interface TamperAlert {
  deviceId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  lastSyncAt: Date | null;
  syncDelayMinutes: number;
  batteryOptimizationDisabled: boolean;
  alertType: 'SYNC_TIMEOUT' | 'BATTERY_OP_RE_ENABLED' | 'MULTIPLE_ANOMALIES';
  severity: 'CRITICAL' | 'WARNING';
}
