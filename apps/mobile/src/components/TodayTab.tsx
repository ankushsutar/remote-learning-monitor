import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { FocusRing } from './FocusRing';

interface TodayTabProps {
  studentName?: string;
  totalForegroundSec: number;
  totalRxBytes: number;
  totalTxBytes: number;
  isSyncing: boolean;
  onSync: () => void;
  pendingCount: number;
  lastSyncTime?: string;
}

export const TodayTab: React.FC<TodayTabProps> = ({
  studentName = 'Alex',
  totalForegroundSec,
  isSyncing,
  onSync,
  pendingCount,
  lastSyncTime = 'Just now'
}) => {
  const [isStudyTimerRunning, setIsStudyTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStudyTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStudyTimerRunning]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Approximate study vs leisure split for display
  const studySec = Math.max(0, Math.round(totalForegroundSec * 0.72));
  const distractionSec = Math.max(0, totalForegroundSec - studySec);
  const calculatedScore = totalForegroundSec > 0
    ? Math.min(100, Math.max(20, Math.round((studySec / totalForegroundSec) * 100)))
    : 85;

  return (
    <View style={styles.container}>
      {/* Top Welcome & Sync Pill */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greetingText}>Hello, {studentName} 👋</Text>
          <Text style={styles.greetingSub}>Today's Learning Pulse</Text>
        </View>

        <TouchableOpacity
          style={[styles.syncPill, pendingCount > 0 ? styles.syncPillPending : styles.syncPillActive]}
          onPress={onSync}
          disabled={isSyncing}
          activeOpacity={0.8}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#818CF8" />
          ) : (
            <>
              <View style={[styles.statusDot, { backgroundColor: pendingCount > 0 ? '#F59E0B' : '#10B981' }]} />
              <Text style={styles.syncPillText}>
                {pendingCount > 0 ? `${pendingCount} to Sync` : 'Synced'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Hero Daily Focus Ring Card */}
      <View style={styles.card}>
        <FocusRing
          score={calculatedScore}
          studyDurationSec={studySec}
          distractionDurationSec={distractionSec}
        />
      </View>

      {/* Active Study Session Card */}
      <View style={[styles.card, styles.studyCard]}>
        <View style={styles.studyHeader}>
          <View>
            <Text style={styles.studyTitle}>Focused Study Mode</Text>
            <Text style={styles.studySubtitle}>
              {isStudyTimerRunning ? 'Session in progress...' : 'Track deep work blocks'}
            </Text>
          </View>
          <Text style={styles.timerDisplay}>{formatTimer(timerSeconds)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.studyButton, isStudyTimerRunning ? styles.stopStudyButton : styles.startStudyButton]}
          onPress={() => {
            if (isStudyTimerRunning) {
              setIsStudyTimerRunning(false);
            } else {
              setIsStudyTimerRunning(true);
            }
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.studyButtonText}>
            {isStudyTimerRunning ? '⏹ Stop Focus Session' : '▶ Start 25m Focus Block'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Summary Pill Banner */}
      <View style={styles.tipBanner}>
        <Text style={styles.tipIcon}>💡</Text>
        <Text style={styles.tipText}>
          Core school hours are <Text style={styles.boldText}>08:00 – 15:00</Text>. Educational app focus maintains your highest daily grade!
        </Text>
      </View>
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
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5
  },
  greetingSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1
  },
  syncPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  syncPillPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)'
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  syncPillText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600'
  },
  card: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  studyCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1
  },
  studyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  studyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC'
  },
  studySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2
  },
  timerDisplay: {
    fontSize: 26,
    fontWeight: '900',
    color: '#818CF8',
    fontVariant: ['tabular-nums']
  },
  studyButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  startStudyButton: {
    backgroundColor: '#4F46E5'
  },
  stopStudyButton: {
    backgroundColor: '#EF4444'
  },
  studyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  tipBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center'
  },
  tipIcon: {
    fontSize: 18,
    marginRight: 10
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17
  },
  boldText: {
    color: '#CBD5E1',
    fontWeight: '700'
  }
});
