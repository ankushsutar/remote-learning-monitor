export interface DevicePairingResponse {
  token: string;
  deviceId: string;
  studentId: string;
  studentName: string;
  schoolId: string;
  expiresIn: number;
}

export class TelemetryApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://10.0.0.209:4000') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  setToken(token: string) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  /**
   * Pairs the mobile device using student pairing code and device fingerprint.
   */
  async pairDevice(
    studentCode: string,
    deviceFingerprint: string,
    osVersion: string
  ): Promise<DevicePairingResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/auth/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentCode,
        deviceFingerprint,
        osVersion,
        batteryOptimizationDisabled: true
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Device pairing failed (${res.status}): ${err}`);
    }

    const data: DevicePairingResponse = await res.json();
    this.token = data.token;
    return data;
  }

  /**
   * Reports device heartbeat & battery optimization state.
   */
  async reportHeartbeat(
    deviceId: string,
    batteryOptDisabled: boolean
  ): Promise<{ status: string }> {
    if (!this.token) throw new Error('Unauthenticated device.');
    const res = await fetch(`${this.baseUrl}/api/v1/devices/${deviceId}/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`
      },
      body: JSON.stringify({
        batteryOptimizationDisabled: batteryOptDisabled,
        timestamp: Date.now()
      })
    });

    if (!res.ok) {
      throw new Error(`Heartbeat failed: ${res.status}`);
    }

    return res.json();
  }
}

export const telemetryClient = new TelemetryApiClient();
