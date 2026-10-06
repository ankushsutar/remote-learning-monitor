import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { QueuedTelemetryRecord } from '../storage/db';

interface TelemetryQueueListProps {
  records: QueuedTelemetryRecord[];
}

export const TelemetryQueueList: React.FC<TelemetryQueueListProps> = ({ records }) => {
  if (records.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Offline buffer queue is empty. All intervals synchronized.</Text>
      </View>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderItem = ({ item }: { item: QueuedTelemetryRecord }) => {
    const appShortName = item.packageName.split('.').pop() || item.packageName;

    return (
      <View style={styles.recordCard}>
        <View style={styles.recordHeader}>
          <Text style={styles.packageName} numberOfLines={1}>
            {appShortName}
          </Text>
          <Text style={styles.durationBadge}>{item.foregroundDurationSec}s</Text>
        </View>
        <Text style={styles.fullPackage}>{item.packageName}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Rx: {formatBytes(item.bytesRx)} | Tx: {formatBytes(item.bytesTx)}
          </Text>
          {item.retryCount > 0 && (
            <Text style={styles.retryBadge}>Retry #{item.retryCount}</Text>
          )}
        </View>
        {item.lastError && (
          <Text style={styles.errorText} numberOfLines={1}>
            {item.lastError}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Local FIFO Buffer ({records.length} items)</Text>
      <FlatList
        data={records}
        keyExtractor={(item: QueuedTelemetryRecord) => item.id.toString()}
        renderItem={renderItem}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12
  },
  header: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  emptyContainer: {
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center'
  },
  recordCard: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6'
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  packageName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
    flex: 1,
    marginRight: 8
  },
  durationBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  fullPackage: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  metaText: {
    fontSize: 12,
    color: '#94A3B8'
  },
  retryBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4
  },
  errorText: {
    fontSize: 10,
    color: '#F87171',
    marginTop: 4
  }
});
