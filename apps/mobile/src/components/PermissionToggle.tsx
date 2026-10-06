import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PermissionToggleProps {
  title: string;
  description: string;
  isGranted: boolean;
  onRequest: () => void;
  requiredText?: string;
}

export const PermissionToggle: React.FC<PermissionToggleProps> = ({
  title,
  description,
  isGranted,
  onRequest,
  requiredText = 'Required'
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{title}</Text>
          <View style={[styles.badge, isGranted ? styles.badgeGranted : styles.badgeMissing]}>
            <Text style={[styles.badgeText, isGranted ? styles.badgeTextGranted : styles.badgeTextMissing]}>
              {isGranted ? 'GRANTED' : requiredText}
            </Text>
          </View>
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
      {!isGranted && (
        <TouchableOpacity style={styles.actionButton} onPress={onRequest} activeOpacity={0.8}>
          <Text style={styles.actionButtonText}>Grant Access</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6
  },
  textContainer: {
    marginBottom: 8
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC'
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  badgeGranted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981'
  },
  badgeMissing: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444'
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  badgeTextGranted: {
    color: '#34D399'
  },
  badgeTextMissing: {
    color: '#F87171'
  },
  description: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18
  },
  actionButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13
  }
});
