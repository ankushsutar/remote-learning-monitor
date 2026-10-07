import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { PermissionToggle } from './PermissionToggle';

interface SettingsTabProps {
  backendUrl: string;
  setBackendUrl: (url: string) => void;
  studentCode: string;
  setStudentCode: (code: string) => void;
  isPairing: boolean;
  onPair: () => void;
  pairedInfo: { studentName: string; deviceId: string } | null;
  hasUsagePermission: boolean;
  isBatteryOptimizationIgnored: boolean;
  onRequestUsage: () => void;
  onRequestBattery: () => void;
  onOpenAppSettings: () => void;
  pendingCount: number;
  isSyncing: boolean;
  onSync: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  backendUrl,
  setBackendUrl,
  studentCode,
  setStudentCode,
  isPairing,
  onPair,
  pairedInfo,
  hasUsagePermission,
  isBatteryOptimizationIgnored,
  onRequestUsage,
  onRequestBattery,
  onOpenAppSettings,
  pendingCount,
  isSyncing,
  onSync
}) => {
  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.sectionTitle}>Guardian & Device Settings</Text>
      <Text style={styles.sectionSubtitle}>Device pairing and background telemetry policies</Text>

      {/* Student Enrollment Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Student Enrollment</Text>

        {pairedInfo ? (
          <View style={styles.enrolledBox}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {pairedInfo.studentName.charAt(0)}
                </Text>
              </View>
              <View>
                <Text style={styles.enrolledName}>{pairedInfo.studentName}</Text>
                <Text style={styles.enrolledCode}>ID: {pairedInfo.deviceId.slice(0, 14)}...</Text>
              </View>
            </View>

            <View style={styles.activePill}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>WorkManager: Active (15m Periodic Sync)</Text>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.inputLabel}>Backend Server URL</Text>
            <TextInput
              style={styles.input}
              value={backendUrl}
              onChangeText={setBackendUrl}
              placeholder="http://10.0.0.209:4000"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Student Enrollment Code</Text>
            <TextInput
              style={styles.input}
              value={studentCode}
              onChangeText={setStudentCode}
              placeholder="STU-94021"
              placeholderTextColor="#64748B"
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onPair}
              disabled={isPairing}
              activeOpacity={0.8}
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

      {/* System Permissions Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>System Permissions</Text>

        <PermissionToggle
          title="Usage Access (UsageStatsManager)"
          description="Measures application foreground intervals for academic focus scoring."
          isGranted={hasUsagePermission}
          onRequest={onRequestUsage}
        />

        <PermissionToggle
          title="Battery Optimization Exemption"
          description="Prevents Android Doze mode from sleeping background sync workers."
          isGranted={isBatteryOptimizationIgnored}
          onRequest={onRequestBattery}
          requiredText="Exempt Needed"
        />

        {!hasUsagePermission && (
          <TouchableOpacity
            style={styles.restrictedAlert}
            onPress={onOpenAppSettings}
            activeOpacity={0.7}
          >
            <Text style={styles.restrictedText}>
              ⚠️ On Android 13/14, if it says "Restricted setting": Tap here &rarr; Tap (⋮) in top right &rarr; "Allow restricted settings".
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Offline Storage Diagnostics */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Local Offline Buffer</Text>
        <View style={styles.bufferRow}>
          <View>
            <Text style={styles.bufferTitle}>{pendingCount} Records Queued</Text>
            <Text style={styles.bufferSub}>Encrypted local SQLite FIFO store</Text>
          </View>

          <TouchableOpacity
            style={[styles.syncButton, pendingCount === 0 && styles.disabledButton]}
            onPress={onSync}
            disabled={isSyncing || pendingCount === 0}
            activeOpacity={0.8}
          >
            {isSyncing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.syncButtonText}>Sync Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Privacy Guarantee Transparency Card */}
      <View style={styles.privacyCard}>
        <Text style={styles.privacyHeader}>🛡️ Student Privacy Pledge</Text>
        <Text style={styles.privacyText}>
          This device operates under strict guardian telemetry standards. Private chats, passwords, keystrokes, and photos are never collected or stored.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 90
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 16
  },
  card: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12
  },
  enrolledBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155'
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800'
  },
  enrolledName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC'
  },
  enrolledCode: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 8
  },
  activeText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600'
  },
  inputLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 6,
    fontWeight: '600'
  },
  input: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    color: '#F8FAFC',
    padding: 12,
    fontSize: 14,
    marginBottom: 12
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  restrictedAlert: {
    marginTop: 10,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderColor: '#EAB308',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10
  },
  restrictedText: {
    color: '#FDE047',
    fontSize: 12,
    lineHeight: 17
  },
  bufferRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bufferTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC'
  },
  bufferSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2
  },
  syncButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10
  },
  disabledButton: {
    backgroundColor: '#334155',
    opacity: 0.6
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  privacyCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14
  },
  privacyHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 4
  },
  privacyText: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17
  }
});
