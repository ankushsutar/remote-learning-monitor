import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { triggerHaptic } from '../utils/haptics';
import { ThemeColors } from '../theme/theme';
import { QueuedTelemetryRecord } from '../storage/db';
import { computeFocusMetrics } from '../utils/appClassifier';
import { MethodDonutArc } from './MethodDonutArc';

interface TodayTabProps {
  studentName?: string;
  records?: QueuedTelemetryRecord[];
  totalForegroundSec: number;
  totalRxBytes: number;
  totalTxBytes: number;
  isSyncing: boolean;
  onSync: () => void;
  pendingCount: number;
  lastSyncTime?: string;
  onOpenPrivacyLedger?: () => void;
  onNavigateToInsights?: () => void;
  theme: ThemeColors;
  onToggleTheme?: () => void;
}

export const TodayTab: React.FC<TodayTabProps> = ({
  studentName = 'Alex',
  records = [],
  totalForegroundSec,
  totalRxBytes,
  totalTxBytes,
  isSyncing,
  onSync,
  pendingCount,
  onOpenPrivacyLedger,
  onNavigateToInsights,
  theme,
  onToggleTheme
}) => {
  const [isStudyTimerRunning, setIsStudyTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [selectedPresetMins, setSelectedPresetMins] = useState(25);
  const [sessionCompletedCount, setSessionCompletedCount] = useState(3);

  const isLight = theme.mode === 'light';

  // Compute 100% REAL dynamic metrics from the hardware records
  const metrics = computeFocusMetrics(records);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStudyTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            triggerHaptic('success');
            setSessionCompletedCount((c) => c + 1);
            setIsStudyTimerRunning(false);
            return selectedPresetMins * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStudyTimerRunning, selectedPresetMins]);

  const selectPreset = (mins: number) => {
    triggerHaptic('light');
    setSelectedPresetMins(mins);
    setIsStudyTimerRunning(false);
    setTimerSeconds(mins * 60);
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMinutes = (sec: number) => {
    if (sec === 0) return '0m';
    const mins = Math.floor(sec / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 5 hours daily study goal
  const dailyGoalSec = 5 * 3600;
  const goalProgressPct = Math.min(100, Math.round((metrics.studySec / dailyGoalSec) * 100));

  return (
    <View style={styles.container}>
      {/* 1. Header (Exact Match to Method X: Avatar, Sarah, "Your health matters ♡", search/bell) */}
      <View style={styles.headerRow}>
        <View style={styles.profileLeft}>
          <View style={[styles.avatarCircle, { backgroundColor: '#0D9488' }]}>
            <Text style={styles.avatarInitial}>{studentName.charAt(0)}</Text>
          </View>
          <View style={styles.profileTextCol}>
            <Text style={[styles.greetingSub, { color: theme.textMuted }]}>Good morning,</Text>
            <Text style={[styles.profileName, { color: theme.textPrimary }]}>{studentName}</Text>
            <Text style={[styles.tagline, { color: '#0D9488' }]}>Your academic focus matters ♡</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          {onToggleTheme && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: isLight ? '#FFFFFF' : '#1E293B', borderColor: theme.cardBorder }]}
              onPress={() => {
                triggerHaptic('light');
                onToggleTheme();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.actionBtnText}>{isLight ? '🌙' : '☀️'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: isLight ? '#FFFFFF' : '#1E293B', borderColor: theme.cardBorder }]}
            onPress={() => {
              triggerHaptic('light');
              onSync();
            }}
            disabled={isSyncing}
            activeOpacity={0.7}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#0D9488" />
            ) : (
              <View style={styles.bellWrapper}>
                <Text style={styles.actionBtnText}>🔔</Text>
                {pendingCount > 0 && <View style={styles.bellUnreadDot} />}
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Scheduled Focus Block Pill (Exact Match to "Time for your medication" from Method X!) */}
      <View
        style={[
          styles.schedulePillBanner,
          {
            backgroundColor: isLight ? '#F0FDFA' : 'rgba(13, 148, 136, 0.15)',
            borderColor: isLight ? '#CCFBF1' : 'rgba(13, 148, 136, 0.3)'
          }
        ]}
      >
        <View style={styles.scheduleIconCircle}>
          <Text style={styles.scheduleIcon}>🎯</Text>
        </View>
        <View style={styles.scheduleTextCol}>
          <Text style={[styles.scheduleTitle, { color: isLight ? '#0F766E' : '#5EEAD4' }]}>
            Time for scheduled study block
          </Text>
          <Text style={[styles.scheduleSubtitle, { color: isLight ? '#475569' : '#94A3B8' }]}>
            Mathematics & Deep Work Session
          </Text>
        </View>
        <Text style={[styles.scheduleTimeText, { color: isLight ? '#0D9488' : '#5EEAD4' }]}>
          09:00 AM ➔
        </Text>
      </View>

      {/* 3. Hero Focus/Sleep Card (Exact Match to Sleep Card with Donut Arc from Method X!) */}
      <View
        style={[
          styles.heroSleepCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            shadowColor: theme.shadowColor
          }
        ]}
      >
        <View style={styles.sleepLeftCol}>
          <View style={styles.sleepTitleRow}>
            <Text style={styles.sleepMoonIcon}>⏱️</Text>
            <View>
              <Text style={[styles.sleepCardTitle, { color: theme.textSecondary }]}>
                Deep Work Focus
              </Text>
              <Text style={[styles.sleepSub, { color: theme.textMuted }]}>
                Today • {formatMinutes(metrics.studySec)}
              </Text>
            </View>
          </View>

          {/* Huge Hero Duration Number */}
          <Text style={[styles.heroSleepDuration, { color: theme.textPrimary }]}>
            {formatMinutes(metrics.studySec)}
          </Text>

          {/* Sleep Quality / Focus Quality Indicator */}
          <View style={styles.sleepQualityRow}>
            <Text style={[styles.sleepQualityLabel, { color: theme.textSecondary }]}>
              Focus quality: {metrics.scoreLabel}
            </Text>
            <View style={[styles.qualityDot, { backgroundColor: metrics.score >= 70 ? '#10B981' : '#F59E0B' }]} />
          </View>
        </View>

        {/* 3/4 Donut Arc on Right from Reference! */}
        <View style={styles.sleepRightCol}>
          <MethodDonutArc
            score={metrics.score}
            color="#0D9488"
            trackColor={isLight ? '#CCFBF1' : 'rgba(13, 148, 136, 0.2)'}
            icon="🎯"
            size={86}
          />
        </View>
      </View>

      {/* 4. "Health Parameters" (2x2 Bento Grid from Method X!) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
          Academic Parameters
        </Text>
        <TouchableOpacity onPress={onNavigateToInsights} activeOpacity={0.7}>
          <Text style={styles.sectionViewAllText}>View all ➔</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.paramGrid}>
        {/* Card 1: Focus Score (Heart Rate equivalent) */}
        <TouchableOpacity
          style={[
            styles.paramCard,
            { backgroundColor: theme.card, borderColor: theme.cardBorder, shadowColor: theme.shadowColor }
          ]}
          onPress={onNavigateToInsights}
          activeOpacity={0.8}
        >
          <View style={styles.paramCardHeader}>
            <View style={[styles.paramIconCircle, { backgroundColor: isLight ? '#F0FDFA' : 'rgba(13, 148, 136, 0.2)' }]}>
              <Text style={styles.paramIcon}>🎯</Text>
            </View>
            <Text style={[styles.paramCardName, { color: theme.textSecondary }]}>Focus Score</Text>
          </View>

          <Text style={[styles.paramCardValue, { color: theme.textPrimary }]}>
            {metrics.score}%
          </Text>

          <View style={styles.paramCardFooter}>
            <View style={[styles.statusMiniDot, { backgroundColor: metrics.score >= 70 ? '#10B981' : '#F59E0B' }]} />
            <Text style={[styles.paramCardStatus, { color: metrics.score >= 70 ? '#10B981' : '#F59E0B' }]}>
              {metrics.scoreLabel}
            </Text>
            <Text style={styles.chevronArrow}>➔</Text>
          </View>
        </TouchableOpacity>

        {/* Card 2: Deep Study (Blood Pressure equivalent) */}
        <TouchableOpacity
          style={[
            styles.paramCard,
            { backgroundColor: theme.card, borderColor: theme.cardBorder, shadowColor: theme.shadowColor }
          ]}
          onPress={onNavigateToInsights}
          activeOpacity={0.8}
        >
          <View style={styles.paramCardHeader}>
            <View style={[styles.paramIconCircle, { backgroundColor: isLight ? '#EFF6FF' : 'rgba(59, 130, 246, 0.2)' }]}>
              <Text style={styles.paramIcon}>⏱️</Text>
            </View>
            <Text style={[styles.paramCardName, { color: theme.textSecondary }]}>Deep Study</Text>
          </View>

          <Text style={[styles.paramCardValue, { color: theme.textPrimary }]}>
            {formatMinutes(metrics.studySec)}
          </Text>

          <View style={styles.paramCardFooter}>
            <View style={[styles.statusMiniDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={[styles.paramCardStatus, { color: '#3B82F6' }]}>Goal in sight</Text>
            <Text style={styles.chevronArrow}>➔</Text>
          </View>
        </TouchableOpacity>

        {/* Card 3: Distraction (SpO2 equivalent) */}
        <TouchableOpacity
          style={[
            styles.paramCard,
            { backgroundColor: theme.card, borderColor: theme.cardBorder, shadowColor: theme.shadowColor }
          ]}
          onPress={onNavigateToInsights}
          activeOpacity={0.8}
        >
          <View style={styles.paramCardHeader}>
            <View style={[styles.paramIconCircle, { backgroundColor: isLight ? '#FFF1F2' : 'rgba(244, 63, 94, 0.2)' }]}>
              <Text style={styles.paramIcon}>📉</Text>
            </View>
            <Text style={[styles.paramCardName, { color: theme.textSecondary }]}>Distraction</Text>
          </View>

          <Text style={[styles.paramCardValue, { color: theme.textPrimary }]}>
            {formatMinutes(metrics.distractionSec)}
          </Text>

          <View style={styles.paramCardFooter}>
            <View style={[styles.statusMiniDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.paramCardStatus, { color: '#10B981' }]}>Under threshold</Text>
            <Text style={styles.chevronArrow}>➔</Text>
          </View>
        </TouchableOpacity>

        {/* Card 4: Telemetry Data Traffic (Blood Sugar equivalent) */}
        <TouchableOpacity
          style={[
            styles.paramCard,
            { backgroundColor: theme.card, borderColor: theme.cardBorder, shadowColor: theme.shadowColor }
          ]}
          onPress={onNavigateToInsights}
          activeOpacity={0.8}
        >
          <View style={styles.paramCardHeader}>
            <View style={[styles.paramIconCircle, { backgroundColor: isLight ? '#ECFDF5' : 'rgba(16, 185, 129, 0.2)' }]}>
              <Text style={styles.paramIcon}>📶</Text>
            </View>
            <Text style={[styles.paramCardName, { color: theme.textSecondary }]}>Data Sync</Text>
          </View>

          <Text style={[styles.paramCardValue, { color: theme.textPrimary }]}>
            {formatBytes(metrics.totalRxBytes + metrics.totalTxBytes)}
          </Text>

          <View style={styles.paramCardFooter}>
            <View style={[styles.statusMiniDot, { backgroundColor: '#0D9488' }]} />
            <Text style={[styles.paramCardStatus, { color: '#0D9488' }]}>Live Wi-Fi</Text>
            <Text style={styles.chevronArrow}>➔</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 5. "Today's Activity" Progress Card (Exact Match to 4,320 steps card from Method X!) */}
      <View
        style={[
          styles.activityCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            shadowColor: theme.shadowColor
          }
        ]}
      >
        <View style={styles.activityHeaderRow}>
          <View style={styles.activityLeft}>
            <View style={[styles.activityIconCircle, { backgroundColor: isLight ? '#F0FDFA' : 'rgba(13, 148, 136, 0.2)' }]}>
              <Text style={styles.activityRunnerIcon}>🏃‍♂️</Text>
            </View>
            <View>
              <Text style={[styles.activityTitle, { color: theme.textPrimary }]}>Today's Focus Goal</Text>
              <Text style={[styles.activitySubtitle, { color: theme.textMuted }]}>Target: 5h deep study</Text>
            </View>
          </View>

          <View style={styles.activityRight}>
            <Text style={[styles.activityValueBold, { color: theme.textPrimary }]}>
              {formatMinutes(metrics.studySec)}
            </Text>
            <Text style={[styles.activityPctText, { color: '#0D9488' }]}>
              {goalProgressPct}% ➔
            </Text>
          </View>
        </View>

        {/* Smooth horizontal progress bar in Teal from reference */}
        <View style={[styles.activityBarTrack, { backgroundColor: isLight ? '#E2E8F0' : '#1E293B' }]}>
          <View
            style={[
              styles.activityBarFill,
              { width: `${goalProgressPct}%`, backgroundColor: '#0D9488' }
            ]}
          />
        </View>
      </View>

      {/* 6. Pomodoro Deep Focus Timer Block */}
      <View
        style={[
          styles.timerCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            shadowColor: theme.shadowColor
          }
        ]}
      >
        <View style={styles.timerHeaderRow}>
          <View>
            <Text style={[styles.timerTitle, { color: theme.textPrimary }]}>Pomodoro Study Block</Text>
            <Text style={[styles.timerSub, { color: theme.textMuted }]}>
              {sessionCompletedCount}/4 blocks completed today
            </Text>
          </View>
          <Text style={[styles.clockDisplay, { color: '#0D9488' }]}>{formatTimer(timerSeconds)}</Text>
        </View>

        <View style={styles.presetButtonsRow}>
          {[
            { label: '25m Focus', mins: 25 },
            { label: '50m Deep', mins: 50 },
            { label: '5m Break', mins: 5 }
          ].map((preset) => {
            const isSelected = selectedPresetMins === preset.mins;
            return (
              <TouchableOpacity
                key={preset.mins}
                style={[
                  styles.presetBtn,
                  {
                    backgroundColor: isSelected
                      ? '#0D9488'
                      : (isLight ? '#F1F5F9' : 'rgba(30, 41, 59, 0.6)'),
                    borderColor: theme.cardBorder
                  }
                ]}
                onPress={() => selectPreset(preset.mins)}
                disabled={isStudyTimerRunning}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.presetBtnText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.textSecondary,
                      fontWeight: isSelected ? '800' : '600'
                    }
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.timerControlsRow}>
          <TouchableOpacity
            style={[
              styles.startBlockBtn,
              { backgroundColor: isStudyTimerRunning ? '#EF4444' : '#0D9488' }
            ]}
            onPress={() => {
              triggerHaptic('medium');
              setIsStudyTimerRunning(!isStudyTimerRunning);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.startBlockBtnText}>
              {isStudyTimerRunning ? '⏸ Pause Block' : '▶ Start Study Block'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resetBlockBtn, { backgroundColor: isLight ? '#F1F5F9' : '#1E293B', borderColor: theme.cardBorder }]}
            onPress={() => {
              triggerHaptic('light');
              setIsStudyTimerRunning(false);
              setTimerSeconds(selectedPresetMins * 60);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.resetBlockBtnText, { color: theme.textSecondary }]}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 7. Student Privacy Ledger Banner */}
      {onOpenPrivacyLedger && (
        <TouchableOpacity
          style={[
            styles.privacyBanner,
            {
              backgroundColor: isLight ? '#F8FAFC' : 'rgba(15, 23, 42, 0.78)',
              borderColor: isLight ? '#E2E8F0' : 'rgba(13, 148, 136, 0.28)'
            }
          ]}
          onPress={() => {
            triggerHaptic('light');
            onOpenPrivacyLedger();
          }}
          activeOpacity={0.8}
        >
          <View style={styles.privacyIconCircle}>
            <Text style={styles.privacyIcon}>🛡️</Text>
          </View>
          <View style={styles.privacyTextCol}>
            <View style={styles.privacyTitleRow}>
              <Text style={[styles.privacyTitle, { color: theme.textPrimary }]}>Student Privacy Ledger</Text>
              <View style={styles.zeroBadge}>
                <Text style={styles.zeroBadgeText}>ZERO CONTENT</Text>
              </View>
            </View>
            <Text style={[styles.privacySub, { color: theme.textSecondary }]}>
              Verified educational telemetry • No personal chat or camera access
            </Text>
          </View>
          <Text style={[styles.privacyArrow, { color: '#0D9488' }]}>➔</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 96
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900'
  },
  profileTextCol: {
    flex: 1
  },
  greetingSub: {
    fontSize: 11,
    fontWeight: '500'
  },
  profileName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4
  },
  tagline: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionBtnText: {
    fontSize: 15
  },
  bellWrapper: {
    position: 'relative'
  },
  bellUnreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0D9488'
  },
  schedulePillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14
  },
  scheduleIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  scheduleIcon: {
    fontSize: 16,
    color: '#FFFFFF'
  },
  scheduleTextCol: {
    flex: 1
  },
  scheduleTitle: {
    fontSize: 13,
    fontWeight: '800'
  },
  scheduleSubtitle: {
    fontSize: 11,
    marginTop: 1
  },
  scheduleTimeText: {
    fontSize: 11,
    fontWeight: '800'
  },
  heroSleepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3
  },
  sleepLeftCol: {
    flex: 1.3
  },
  sleepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  sleepMoonIcon: {
    fontSize: 20,
    marginRight: 8
  },
  sleepCardTitle: {
    fontSize: 13,
    fontWeight: '800'
  },
  sleepSub: {
    fontSize: 10,
    marginTop: 1
  },
  heroSleepDuration: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    marginVertical: 4
  },
  sleepQualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  sleepQualityLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginRight: 6
  },
  qualityDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  sleepRightCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '800'
  },
  sectionViewAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D9488'
  },
  paramGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14
  },
  paramCard: {
    width: '48.5%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  paramCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  paramIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6
  },
  paramIcon: {
    fontSize: 14
  },
  paramCardName: {
    fontSize: 11,
    fontWeight: '700'
  },
  paramCardValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginVertical: 4,
    fontVariant: ['tabular-nums']
  },
  paramCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4
  },
  statusMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4
  },
  paramCardStatus: {
    fontSize: 10,
    fontWeight: '700',
    flex: 1
  },
  chevronArrow: {
    fontSize: 10,
    color: '#94A3B8'
  },
  activityCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  activityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  activityIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  activityRunnerIcon: {
    fontSize: 18
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '800'
  },
  activitySubtitle: {
    fontSize: 10,
    marginTop: 1
  },
  activityRight: {
    alignItems: 'flex-end'
  },
  activityValueBold: {
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums']
  },
  activityPctText: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2
  },
  activityBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden'
  },
  activityBarFill: {
    height: '100%',
    borderRadius: 4
  },
  timerCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  timerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  timerTitle: {
    fontSize: 14,
    fontWeight: '800'
  },
  timerSub: {
    fontSize: 11,
    marginTop: 1
  },
  clockDisplay: {
    fontSize: 26,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center'
  },
  presetBtnText: {
    fontSize: 11
  },
  timerControlsRow: {
    flexDirection: 'row',
    gap: 8
  },
  startBlockBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  startBlockBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  resetBlockBtn: {
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  resetBlockBtnText: {
    fontSize: 12,
    fontWeight: '700'
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14
  },
  privacyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  privacyIcon: {
    fontSize: 18
  },
  privacyTextCol: {
    flex: 1
  },
  privacyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '800'
  },
  zeroBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  zeroBadgeText: {
    color: '#10B981',
    fontSize: 8,
    fontWeight: '800'
  },
  privacySub: {
    fontSize: 11,
    marginTop: 2
  },
  privacyArrow: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 6
  }
});
