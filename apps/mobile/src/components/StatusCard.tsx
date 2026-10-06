import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  statusType?: 'success' | 'warning' | 'danger' | 'info';
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  subtitle,
  statusType = 'info'
}) => {
  const getBadgeColor = () => {
    switch (statusType) {
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'danger':
        return '#EF4444';
      default:
        return '#6366F1';
    }
  };

  return (
    <View style={[styles.card, { borderLeftColor: getBadgeColor() }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color: getBadgeColor() }]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  title: {
    fontSize: 13,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    marginBottom: 4
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B'
  }
});
