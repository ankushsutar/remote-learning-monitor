import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LiveMetricsViewProps {
  totalDurationSec: number;
  totalRxBytes: number;
  totalTxBytes: number;
  activeAppCount: number;
}

export const LiveMetricsView: React.FC<LiveMetricsViewProps> = ({
  totalDurationSec,
  totalRxBytes,
  totalTxBytes,
  activeAppCount
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Session Snapshot</Text>
      <View style={styles.grid}>
        <View style={styles.col}>
          <Text style={styles.label}>Screen Time</Text>
          <Text style={styles.metric}>{formatTime(totalDurationSec)}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Active Apps</Text>
          <Text style={styles.metric}>{activeAppCount}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Network Rx</Text>
          <Text style={styles.metric}>{formatBytes(totalRxBytes)}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Network Tx</Text>
          <Text style={styles.metric}>{formatBytes(totalTxBytes)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  col: {
    width: '48%',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  label: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  metric: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC'
  }
});
