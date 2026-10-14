import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { triggerHaptic } from '../utils/haptics';
import { ThemeColors } from '../theme/theme';

export type TabKey = 'today' | 'insights' | 'settings';

interface BottomTabBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  pendingRecordsCount?: number;
  theme: ThemeColors;
  onQuickAction?: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  pendingRecordsCount = 0,
  theme,
  onQuickAction
}) => {
  const isLight = theme.mode === 'light';

  const handlePress = (tabKey: TabKey) => {
    triggerHaptic('light');
    onTabChange(tabKey);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View
        style={[
          styles.dockCapsule,
          {
            backgroundColor: isLight ? '#FFFFFF' : 'rgba(18, 24, 38, 0.95)',
            borderColor: isLight ? '#E5E7EB' : 'rgba(255, 255, 255, 0.1)',
            shadowColor: isLight ? '#64748B' : '#000000'
          }
        ]}
      >
        {/* Tab 1: Home (Active is Black Circle like Reference Image!) */}
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'today' && (isLight ? styles.activeCircleLight : styles.activeCircleDark)
          ]}
          onPress={() => handlePress('today')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'today' && styles.activeIcon]}>
            🏠
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Trends / Diagnostics */}
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'insights' && (isLight ? styles.activeCircleLight : styles.activeCircleDark)
          ]}
          onPress={() => handlePress('insights')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'insights' && styles.activeIcon]}>
            📈
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Guardian / Settings */}
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'settings' && (isLight ? styles.activeCircleLight : styles.activeCircleDark)
          ]}
          onPress={() => handlePress('settings')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'settings' && styles.activeIcon]}>
            🛡️
          </Text>
          {pendingRecordsCount > 0 && (
            <View style={styles.badgeGlowContainer}>
              <View style={styles.badgePill}>
                <Text style={styles.badgeText}>
                  {pendingRecordsCount > 99 ? '99+' : pendingRecordsCount}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Action Button: Method X Circular Teal Action Button */}
        <TouchableOpacity
          style={[
            styles.actionPill,
            { backgroundColor: '#0D9488' }
          ]}
          onPress={() => {
            triggerHaptic('medium');
            if (onQuickAction) onQuickAction();
            else handlePress('today');
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionPillText, { color: '#FFFFFF' }]}>⚡</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: 22,
    backgroundColor: 'transparent',
    alignItems: 'center'
  },
  dockCapsule: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 36,
    paddingVertical: 6,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10
  },
  tabItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  activeCircleLight: {
    backgroundColor: '#111827', // Signature black active circle from Reference Phone 1!
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  activeCircleDark: {
    backgroundColor: '#0D9488',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.7
  },
  activeIcon: {
    opacity: 1
  },
  badgeGlowContainer: {
    position: 'absolute',
    top: 2,
    right: 2
  },
  badgePill: {
    backgroundColor: '#F59E0B',
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: {
    color: '#000000',
    fontSize: 8,
    fontWeight: '900',
    fontVariant: ['tabular-nums']
  },
  actionPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionPillText: {
    fontSize: 16,
    fontWeight: '800'
  }
});
