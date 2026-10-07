import React, { useState } from 'react';
import { registerRootComponent } from 'expo';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useTelemetry } from './hooks/useTelemetry';
import { StatusCard } from './components/StatusCard';
import { PermissionToggle } from './components/PermissionToggle';
import { TelemetryQueueList } from './components/TelemetryQueueList';
import { LiveMetricsView } from './components/LiveMetricsView';
import { telemetryClient } from './api/telemetryClient';

export default function App() {
  const [backendUrl, setBackendUrl] = useState(
    process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.0.2.2:4000'
  );
  const [studentCode, setStudentCode] = useState(
    process.env.EXPO_PUBLIC_DEFAULT_STUDENT_CODE || 'STU-94021'
  );
  const [isPairing, setIsPairing] = useState(false);
  const [pairedInfo, setPairedInfo] = useState<{
    studentName: string;
    deviceId: string;
  } | null>(null);

  const {
    hasUsagePermission,
    isBatteryOptimizationIgnored,
    isCollecting,
    isSyncing,
    queueStats,
    queuedRecords,
    lastSyncResult,
    requestUsagePermission,
    openAppSettings,
    requestBatteryOpt,
    collectAndEnqueue,
    triggerSync,
    enableBackgroundWorker
  } = useTelemetry(backendUrl);

  const handlePair = async () => {
    setIsPairing(true);
    try {
      telemetryClient.setBaseUrl(backendUrl);
      const res = await telemetryClient.pairDevice(
        studentCode,
        `android-dev-${Date.now().toString(36)}`,
        'Android 14 (API 34)'
      );
      setPairedInfo({
        studentName: res.studentName,
        deviceId: res.deviceId
      });
      // Enable background WorkManager sync
      enableBackgroundWorker(res.token, res.deviceId);
    } catch (err: any) {
      alert(`Pairing error: ${err.message}`);
    } finally {
      setIsPairing(false);
    }
  };

  const totalForeground = queuedRecords.reduce((acc, r) => acc + r.foregroundDurationSec, 0);
  const totalRx = queuedRecords.reduce((acc, r) => acc + r.bytesRx, 0);
  const totalTx = queuedRecords.reduce((acc, r) => acc + r.bytesTx, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSub}>Student Telemetry Client</Text>
          <Text style={styles.headerTitle}>Guardian & Focus Monitor</Text>
          <Text style={styles.versionTag}>Android 14+ • API 34 Native WorkManager</Text>
        </View>

        {/* Device Pairing Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Device Enrollment</Text>
          {pairedInfo ? (
            <View style={styles.enrolledBox}>
              <Text style={styles.enrolledText}>
                Enrolled Student: <Text style={styles.bold}>{pairedInfo.studentName}</Text>
              </Text>
              <Text style={styles.deviceIdText}>Device ID: {pairedInfo.deviceId}</Text>
              <Text style={styles.syncStatusActive}>Background WorkManager: ACTIVE (15m interval)</Text>
            </View>
          ) : (
            <View>
              <Text style={styles.label}>Backend API Endpoint</Text>
              <TextInput
                style={styles.input}
                value={backendUrl}
                onChangeText={setBackendUrl}
                placeholder="http://10.0.2.2:4000"
                placeholderTextColor="#64748B"
              />
              <Text style={styles.label}>Student Pairing Code</Text>
              <TextInput
                style={styles.input}
                value={studentCode}
                onChangeText={setStudentCode}
                placeholder="STU-XXXXX"
                placeholderTextColor="#64748B"
              />
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handlePair}
                disabled={isPairing}
              >
                {isPairing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Pair & Authorize Device</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Security & OS Permissions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>System Permissions</Text>
          <PermissionToggle
            title="Usage Access (UsageStatsManager)"
            description="Required to measure exact foreground intervals via ACTIVITY_RESUMED and ACTIVITY_PAUSED events."
            isGranted={hasUsagePermission}
            onRequest={requestUsagePermission}
          />
          <PermissionToggle
            title="Battery Optimization Exemption"
            description="Prevents Android Doze mode from killing periodic 15-minute background telemetry tasks."
            isGranted={isBatteryOptimizationIgnored}
            onRequest={requestBatteryOpt}
            requiredText="Exempt Needed"
          />
          {!hasUsagePermission && (
            <TouchableOpacity
              style={styles.restrictedSettingsHint}
              onPress={openAppSettings}
              activeOpacity={0.7}
            >
              <Text style={styles.restrictedSettingsText}>
                ⚠️ On Android 13/14, if it says "Restricted setting": Tap here to open App Info &rarr; Tap (⋮) in top right &rarr; "Allow restricted settings".
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Local Buffer Status */}
        <View style={styles.metricsRow}>
          <View style={styles.metricHalf}>
            <StatusCard
              title="SQLite Buffer"
              value={`${queueStats.pendingCount} records`}
              subtitle="FIFO local queue"
              statusType={queueStats.pendingCount > 0 ? 'warning' : 'success'}
            />
          </View>
          <View style={styles.metricHalf}>
            <StatusCard
              title="Sync Status"
              value={lastSyncResult ? (lastSyncResult.success ? 'Synced' : 'Retry Pending') : 'Idle'}
              subtitle={
                lastSyncResult?.uploadedCount
                  ? `Uploaded ${lastSyncResult.uploadedCount} items`
                  : 'Ready to transmit'
              }
              statusType={lastSyncResult?.success ? 'success' : 'info'}
            />
          </View>
        </View>

        {/* Live Metrics */}
        <LiveMetricsView
          totalDurationSec={totalForeground}
          totalRxBytes={totalRx}
          totalTxBytes={totalTx}
          activeAppCount={queuedRecords.length}
        />

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.collectBtn]}
            onPress={() => collectAndEnqueue(15)}
            disabled={isCollecting}
          >
            {isCollecting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.actionBtnText}>Capture 15m Telemetry</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.syncBtn]}
            onPress={triggerSync}
            disabled={isSyncing || queueStats.pendingCount === 0}
          >
            {isSyncing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.actionBtnText}>Sync Offline Buffer</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Queue Preview */}
        <TelemetryQueueList records={queuedRecords} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F19'
  },
  container: {
    padding: 16
  },
  header: {
    marginBottom: 20,
    marginTop: 8
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    marginVertical: 4
  },
  versionTag: {
    fontSize: 12,
    color: '#64748B'
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1F2937'
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 12
  },
  label: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 6,
    fontWeight: '600'
  },
  input: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    color: '#F9FAFB',
    padding: 12,
    fontSize: 14,
    marginBottom: 12
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  },
  enrolledBox: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981'
  },
  enrolledText: {
    color: '#F1F5F9',
    fontSize: 14
  },
  bold: {
    fontWeight: '700'
  },
  deviceIdText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4
  },
  syncStatusActive: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  metricHalf: {
    width: '48%'
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12
  },
  actionBtn: {
    flex: 0.48,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  collectBtn: {
    backgroundColor: '#2563EB'
  },
  syncBtn: {
    backgroundColor: '#059669'
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  restrictedSettingsHint: {
    marginTop: 12,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderColor: '#EAB308',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10
  },
  restrictedSettingsText: {
    color: '#FDE047',
    fontSize: 12,
    lineHeight: 17
  }
});

registerRootComponent(App);

