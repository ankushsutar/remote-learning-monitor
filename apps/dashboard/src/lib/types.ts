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
  first_name: string;
  last_name: string;
  is_active: boolean;
  device_id: string | null;
  device_fingerprint: string | null;
  os_version: string | null;
  battery_optimization_disabled: boolean | null;
  last_sync_at: string | null;
}

export interface FocusScoreResult {
  score: number;
  productiveSeconds: number;
  educationalSeconds: number;
  socialMediaSeconds: number;
  gamingSeconds: number;
  entertainmentSeconds: number;
  unclassifiedSeconds: number;
  totalScreenTimeSeconds: number;
}

export interface TimelinePoint {
  hour: string;
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
  lastSyncAt: string | null;
  syncDelayMinutes: number;
  batteryOptimizationDisabled: boolean;
  alertType: 'SYNC_TIMEOUT' | 'BATTERY_OP_RE_ENABLED' | 'MULTIPLE_ANOMALIES';
  severity: 'CRITICAL' | 'WARNING';
}

export interface PackageBreakdownItem {
  package_name: string;
  app_name: string;
  appName?: string;
  category: AppCategory;
  total_duration_sec: number;
  total_bytes_rx: number;
  total_bytes_tx: number;
  interval_count: number;
}

export interface DashboardSummary {
  focusScore: FocusScoreResult;
  timeline: TimelinePoint[];
  bandwidth: {
    points: BandwidthPoint[];
    classHoursTotalBytes: number;
    afterHoursTotalBytes: number;
    classHourSpikesDetected: number;
  };
  tamperAlerts: TamperAlert[];
  packages: PackageBreakdownItem[];
  timestamp: number;
}
