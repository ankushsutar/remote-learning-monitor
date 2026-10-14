import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { triggerHaptic } from '../utils/haptics';
import { ThemeColors } from '../theme/theme';

interface PermissionToggleProps {
  title: string;
  description: string;
  isGranted: boolean;
  onRequest: () => void;
  requiredText?: string;
  theme?: ThemeColors;
}

export const PermissionToggle: React.FC<PermissionToggleProps> = ({
  title,
  description,
  isGranted,
  onRequest,
  requiredText = 'Required',
  theme
}) => {
  const isLight = !theme || theme.mode === 'light';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 23, 42, 0.72)',
          borderColor: isGranted
            ? (isLight ? '#A7F3D0' : 'rgba(16, 185, 129, 0.25)')
            : (isLight ? '#FDE68A' : 'rgba(245, 158, 11, 0.3)'),
          shadowColor: isLight ? '#64748B' : '#000000'
        }
      ]}
    >
      <View style={styles.textContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: isLight ? '#0F172A' : '#F8FAFC' }]}>
            {title}
          </Text>
          <View
            style={[
              styles.badge,
              isGranted
                ? {
                    backgroundColor: isLight ? '#ECFDF5' : 'rgba(16, 185, 129, 0.14)',
                    borderColor: isLight ? '#10B981' : 'rgba(16, 185, 129, 0.4)'
                  }
                : {
                    backgroundColor: isLight ? '#FFFBEB' : 'rgba(245, 158, 11, 0.14)',
                    borderColor: isLight ? '#F59E0B' : 'rgba(245, 158, 11, 0.4)'
                  }
            ]}
          >
            <View
              style={[
                styles.badgeDot,
                { backgroundColor: isGranted ? '#10B981' : '#F59E0B' }
              ]}
            />
            <Text
              style={[
                styles.badgeText,
                { color: isGranted ? (isLight ? '#047857' : '#10B981') : (isLight ? '#B45309' : '#F59E0B') }
              ]}
            >
              {isGranted ? 'ACTIVE' : requiredText.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[styles.description, { color: isLight ? '#64748B' : '#94A3B8' }]}>
          {description}
        </Text>
      </View>

      {!isGranted && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: isLight ? '#0D9488' : '#4F46E5' }]}
          onPress={() => {
            triggerHaptic('medium');
            onRequest();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>Authorize Permission ➔</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginVertical: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  textContainer: {
    marginBottom: 6
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    marginRight: 8
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  description: {
    fontSize: 12,
    lineHeight: 17
  },
  actionButton: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.2
  }
});
