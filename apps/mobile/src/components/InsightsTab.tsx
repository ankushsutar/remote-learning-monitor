import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { QueuedTelemetryRecord } from '../storage/db';

interface InsightsTabProps {
  records: QueuedTelemetryRecord[];
  isCollecting: boolean;
  onCollect: () => void;
  totalRxBytes: number;
  totalTxBytes: number;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({
  records,
  isCollecting,
  onCollect,
  totalRxBytes,
  totalTxBytes
}) => {
  const getAppMeta = (pkg: string) => {
    const map: Record<string, { name: string; icon: string; category: string; color: string }> = {
      'com.google.android.apps.classroom': { name: 'Google Classroom', icon: '📘', category: 'Educational', color: '#10B981' },
      'org.khanacademy.android': { name: 'Khan Academy', icon: '🎓', category: 'Educational', color: '#10B981' },
      'com.google.android.youtube': { name: 'YouTube', icon: '📺', category: 'Entertainment', color: '#EF4444' },
      'com.whatsapp': { name: 'WhatsApp', icon: '💬', category: 'Social Media', color: '#3B82F6' },
      'com.instagram.android': { name: 'Instagram', icon: '📸', category: 'Social Media', color: '#EC4899' },
      'com.roblox.client': { name: 'Roblox', icon: '🎮', category: 'Gaming', color: '#F59E0B' },
      'com.discord': { name: 'Discord', icon: '🎧', category: 'Social Media', color: '#6366F1' },
      'com.sec.android.app.launcher': { name: 'Home Screen', icon: '📱', category: 'System', color: '#64748B' },
      'com.android.settings': { name: 'Device Settings', icon: '⚙️', category: 'System', color: '#64748B' },
      'com.samsung.android.forest': { name: 'Digital Wellbeing', icon: '🌿', category: 'System', color: '#64748B' },
      'com.telemetry.studentmonitor': { name: 'Telemetry Monitor', icon: '🛡️', category: 'Focus Monitor', color: '#818CF8' }
    };

    if (map[pkg]) return map[pkg];

    const cleanName = pkg.split('.').pop() || pkg;
    return {
      name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      icon: '📱',
      category: 'Unclassified',
      color: '#94A3B8'
    };
  };

  const formatSeconds = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return remainder > 0 ? `${mins}m ${remainder}s` : `${mins}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={styles.container}>
      {/* Header with Quick Snapshot action */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>Application Insights</Text>
          <Text style={styles.sectionSubtitle}>Real-time foreground session tracking</Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onCollect}
          disabled={isCollecting}
          activeOpacity={0.8}
        >
          {isCollecting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.refreshButtonText}>⚡ Snapshot 15m</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Network Bandwidth Summary Card */}
      <View style={styles.bandwidthCard}>
        <Text style={styles.cardHeader}>Total Network Traffic</Text>
        <View style={styles.bandwidthRow}>
          <View style={styles.bandwidthCol}>
            <Text style={styles.bandwidthLabel}>📥 Inbound (Rx)</Text>
            <Text style={styles.bandwidthValue}>{formatBytes(totalRxBytes)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.bandwidthCol}>
            <Text style={styles.bandwidthLabel}>📤 Outbound (Tx)</Text>
            <Text style={styles.bandwidthValue}>{formatBytes(totalTxBytes)}</Text>
          </View>
        </View>
      </View>

      {/* Active Application Leaderboard */}
      <Text style={styles.subHeading}>Recent Applications ({records.length})</Text>

      {records.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>⏳</Text>
          <Text style={styles.emptyTitle}>No Recent Records in Buffer</Text>
          <Text style={styles.emptySubtitle}>
            Tap 'Snapshot 15m' above to pull your current application usage stats.
          </Text>
        </View>
      ) : (
        records.map((record, idx) => {
          const meta = getAppMeta(record.packageName);
          return (
            <View key={`${record.packageName}-${idx}`} style={styles.appCard}>
              <View style={styles.appIconBox}>
                <Text style={styles.appEmoji}>{meta.icon}</Text>
              </View>

              <View style={styles.appInfo}>
                <Text style={styles.appName} numberOfLines={1}>{meta.name}</Text>
                <View style={styles.categoryRow}>
                  <View style={[styles.categoryBadge, { backgroundColor: `${meta.color}20` }]}>
                    <Text style={[styles.categoryText, { color: meta.color }]}>{meta.category}</Text>
                  </View>
                  <Text style={styles.pkgText} numberOfLines={1}>• {record.packageName}</Text>
                </View>
              </View>

              <View style={styles.durationCol}>
                <Text style={styles.durationText}>{formatSeconds(record.foregroundDurationSec)}</Text>
                <Text style={styles.netSmall}>
                  {formatBytes(record.bytesRx + record.bytesTx)}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 90
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
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
    marginTop: 2
  },
  refreshButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12
  },
  bandwidthCard: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  bandwidthRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  bandwidthCol: {
    flex: 1,
    alignItems: 'center'
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: '#334155'
  },
  bandwidthLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4
  },
  bandwidthValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC'
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  appCard: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center'
  },
  appIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  appEmoji: {
    fontSize: 20
  },
  appInfo: {
    flex: 1
  },
  appName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC'
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginRight: 6
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  pkgText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1
  },
  durationCol: {
    alignItems: 'flex-end',
    marginLeft: 8
  },
  durationText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC'
  },
  netSmall: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  emptyCard: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 10
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18
  }
});
