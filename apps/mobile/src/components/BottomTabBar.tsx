import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type TabKey = 'today' | 'insights' | 'settings';

interface BottomTabBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  pendingRecordsCount?: number;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  pendingRecordsCount = 0
}) => {
  const tabs = [
    { key: 'today' as TabKey, label: 'Today', icon: '🎯' },
    { key: 'insights' as TabKey, label: 'Insights', icon: '📊' },
    { key: 'settings' as TabKey, label: 'Guardian', icon: '🛡️' }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
              {tab.key === 'settings' && pendingRecordsCount > 0 && (
                <View style={styles.badgeDot} />
              )}
            </TouchableOpacity>
          );
        })}
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
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: 'transparent'
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    position: 'relative'
  },
  activeTabButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    borderColor: '#6366F1'
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8'
  },
  activeTabLabel: {
    color: '#818CF8',
    fontWeight: '700'
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    position: 'absolute',
    top: 6,
    right: 8
  }
});
