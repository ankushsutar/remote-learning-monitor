import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { FocusRing } from './FocusRing';
import { triggerHaptic } from '../utils/haptics';

interface TodayTabProps {
  studentName?: string;
  totalForegroundSec: number;
  totalRxBytes: number;
  totalTxBytes: number;
  isSyncing: boolean;
  onSync: () => void;
  pendingCount: number;
  lastSyncTime?: string;
  onOpenPrivacyLedger?: () => void;
}

export const TodayTab: React.FC<TodayTabProps> = ({
  studentName = 'Alex',
  totalForegroundSec,
  isSyncing,
  onSync,
  pendingCount,
  onOpenPrivacyLedger
}) => {
  const [isStudyTimerRunning, setIsStudyTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60); // 25-minute Pomodoro focus block
  const [sessionCompletedCount, setSessionCompletedCount] = useState(3);
  const [lastSyncRelative, setLastSyncRelative] = useState('Just now');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStudyTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            triggerHaptic('success');
            setSessionCompletedCount((c) => c + 1);
            setIsStudyTimerRunning(false);
            return 25 * 60;
          }
          return prev - 1;
        });
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
  const studySec = Math.max(0, Math.round(totalForegroundSec * 0.76));
  const distractionSec = Math.max(0, totalForegroundSec - studySec);
  const calculatedScore = totalForegroundSec > 0
    ? Math.min(100, Math.max(20, Math.round((studySec / totalForegroundSec) * 100)))
    : 88;

  return (
    <View style={styles.container}>
      {/* Top Welcome & Sync Pill */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>LEARNING COMPANION</Text>
          </View>
          <Text style={styles.greetingText}>Hello, {studentName} 👋</Text>
          <Text style={styles.greetingSub}>Daily Academic Focus & Wellness</Text>
        </View>

        <TouchableOpacity
          style={[styles.syncPill, pendingCount > 0 ? styles.syncPillPending : styles.syncPillActive]}
          onPress={() => {
            triggerHaptic('light');
            onSync();
          }}
          disabled={isSyncing}
          activeOpacity={0.8}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#818CF8" />
          ) : (
            <>
              <View style={[styles.statusDot, { backgroundColor: pendingCount > 0 ? '#F59E0B' : '#10B981' }]} />
              <Text style={styles.syncPillText}>
                {pendingCount > 0 ? `${pendingCount} to Sync` : 'Synced • Wi-Fi'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Focus Consistency Streak Banner */}
      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <View style={styles.streakBadge}>
            <Text style={styles.streakBadgeText}>🔥 5-DAY STREAK</Text>
          </View>
          <Text style={styles.streakSub}>Top 10% in Class Engagement</Text>
        </View>
        <Text style={styles.streakTitle}>Academic Focus Consistency</Text>
        {/* Weekly Day Dots */}
        <View style={styles.streakDotsRow}>
          {[
            { day: 'M', active: true },
            { day: 'T', active: true },
            { day: 'W', active: true },
            { day: 'T', active: true },
            { day: 'F', active: true },
            { day: 'S', active: false },
            { day: 'S', active: false }
          ].map((item, idx) => (
            <View key={idx} style={styles.streakDotCol}>
              <View style={[styles.streakDot, item.active ? styles.streakDotActive : styles.streakDotInactive]}>
                <Text style={styles.streakDotCheck}>{item.active ? '✓' : ''}</Text>
              </View>
              <Text style={styles.streakDotDay}>{item.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Hero Daily Focus Ring Card */}
      <View style={styles.card}>
        <FocusRing
          score={calculatedScore}
          studyDurationSec={studySec}
          distractionDurationSec={distractionSec}
        />
      </View>

      {/* Pomodoro Deep Work Focus Block */}
      <View style={[styles.card, styles.studyCard]}>
        <View style={styles.studyHeader}>
          <View>
            <View style={styles.pomodoroBadge}>
              <Text style={styles.pomodoroBadgeText}>POMODORO SESSIONS ({sessionCompletedCount}/4 COMPLETED)</Text>
            </View>
            <Text style={styles.studyTitle}>Focused Study Mode</Text>
            <Text style={styles.studySubtitle}>
              {isStudyTimerRunning ? 'Session active • Muting distractions' : '25-minute deep focus block'}
            </Text>
          </View>
          <Text style={styles.timerDisplay}>{formatTimer(timerSeconds)}</Text>
        </View>

        <View style={styles.studyButtonsRow}>
          <TouchableOpacity
            style={[styles.studyButton, isStudyTimerRunning ? styles.stopStudyButton : styles.startStudyButton]}
            onPress={() => {
              triggerHaptic('medium');
              setIsStudyTimerRunning(!isStudyTimerRunning);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.studyButtonText}>
              {isStudyTimerRunning ? '⏸ Pause Focus Session' : '▶ Start 25m Focus Block'}
            </Text>
          </TouchableOpacity>

          {isStudyTimerRunning && (
            <TouchableOpacity
              style={styles.resetTimerButton}
              onPress={() => {
                setIsStudyTimerRunning(false);
                setTimerSeconds(25 * 60);
              }}
            >
              <Text style={styles.resetTimerText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Privacy Transparency Trigger Pill */}
      {onOpenPrivacyLedger && (
        <TouchableOpacity style={styles.privacyPillBanner} onPress={onOpenPrivacyLedger} activeOpacity={0.8}>
          <Text style={styles.privacyPillIcon}>🛡️</Text>
          <View style={styles.privacyPillTextCol}>
            <Text style={styles.privacyPillTitle}>Student Privacy Ledger</Text>
            <Text style={styles.privacyPillSubtitle}>Zero-content telemetry • Tap to see what we collect</Text>
          </View>
          <Text style={styles.privacyPillArrow}>➔</Text>
        </TouchableOpacity>
      )}

      {/* Quick Summary Tip */}
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
  roleTag: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4
  },
  roleTagText: {
    color: '#818CF8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5
  },
  greetingSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1
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
  streakCard: {
    backgroundColor: '#111625',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  streakBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  streakBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800'
  },
  streakSub: {
    color: '#9CA3AF',
    fontSize: 11
  },
  streakTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12
  },
  streakDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8
  },
  streakDotCol: {
    alignItems: 'center',
    gap: 4
  },
  streakDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  streakDotActive: {
    backgroundColor: '#10B981'
  },
  streakDotInactive: {
    backgroundColor: '#1E2538'
  },
  streakDotCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  streakDotDay: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '700'
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
  pomodoroBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4
  },
  pomodoroBadgeText: {
    color: '#818CF8',
    fontSize: 9,
    fontWeight: '800'
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
  studyButtonsRow: {
    flexDirection: 'row',
    gap: 8
  },
  studyButton: {
    flex: 1,
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
  resetTimerButton: {
    paddingHorizontal: 16,
    backgroundColor: '#1E2538',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  resetTimerText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600'
  },
  privacyPillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111625',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14
  },
  privacyPillIcon: {
    fontSize: 20,
    marginRight: 10
  },
  privacyPillTextCol: {
    flex: 1
  },
  privacyPillTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  privacyPillSubtitle: {
    color: '#9CA3AF',
    fontSize: 11
  },
  privacyPillArrow: {
    color: '#818CF8',
    fontSize: 14,
    fontWeight: '700'
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
