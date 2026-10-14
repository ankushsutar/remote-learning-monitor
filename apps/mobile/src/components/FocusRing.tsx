import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '../theme/theme';

interface FocusRingProps {
  score: number; // 0 to 100
  studyDurationSec: number;
  distractionDurationSec: number;
  theme?: ThemeColors;
}

export const FocusRing: React.FC<FocusRingProps> = ({
  score,
  studyDurationSec,
  distractionDurationSec,
  theme
}) => {
  const formatMinutes = (sec: number) => {
    const mins = Math.floor(sec / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  const isLight = !theme || theme.mode === 'light';

  const getScoreTheme = (val: number) => {
    if (val >= 80) {
      return {
        color: '#0D9488', // Emerald Teal from Reference
        glow: 'rgba(13, 148, 136, 0.2)',
        bgPastel: isLight ? '#F0FDFA' : 'rgba(13, 148, 136, 0.12)',
        rating: 'Optimal Focus',
        tag: 'HIGH YIELD'
      };
    }
    if (val >= 60) {
      return {
        color: '#6366F1', // Electric Indigo
        glow: 'rgba(99, 102, 241, 0.2)',
        bgPastel: isLight ? '#F5F3FF' : 'rgba(99, 102, 241, 0.12)',
        rating: 'Productive',
        tag: 'STABLE'
      };
    }
    if (val >= 40) {
      return {
        color: '#F59E0B', // Amber
        glow: 'rgba(245, 158, 11, 0.2)',
        bgPastel: isLight ? '#FFFBEB' : 'rgba(245, 158, 11, 0.12)',
        rating: 'Balanced',
        tag: 'MODERATE'
      };
    }
    return {
      color: '#F43F5E', // Rose
      glow: 'rgba(244, 63, 94, 0.2)',
      bgPastel: isLight ? '#FFF1F2' : 'rgba(244, 63, 94, 0.12)',
      rating: 'Distraction Alert',
      tag: 'ATTENTION'
    };
  };

  const currentTheme = getScoreTheme(score);
  const totalSec = studyDurationSec + distractionDurationSec;
  const studyPct = totalSec > 0 ? Math.round((studyDurationSec / totalSec) * 100) : 100;

  return (
    <View style={styles.container}>
      {/* Outer Luminous Atmospheric Halo */}
      <View
        style={[
          styles.haloContainer,
          {
            borderColor: currentTheme.glow,
            backgroundColor: currentTheme.bgPastel
          }
        ]}
      >
        {/* Mid Concentric Ring */}
        <View
          style={[
            styles.middleRing,
            {
              borderColor: `${currentTheme.color}35`,
              backgroundColor: isLight ? '#FFFFFF' : 'rgba(10, 15, 30, 0.9)'
            }
          ]}
        >
          {/* Main Visual Beacon Core */}
          <View
            style={[
              styles.coreCircle,
              {
                borderColor: currentTheme.color,
                backgroundColor: isLight ? '#F8FAFC' : '#090D1A'
              }
            ]}
          >
            <View style={styles.coreInner}>
              <Text
                style={[
                  styles.eyebrow,
                  { color: isLight ? '#0D9488' : '#818CF8' }
                ]}
              >
                DAILY FOCUS SCORE
              </Text>
              <Text
                style={[
                  styles.scoreHero,
                  { color: isLight ? '#0F172A' : '#F8FAFC' }
                ]}
              >
                {Math.round(score)}%
              </Text>

              {/* Status Pill with Dot */}
              <View
                style={[
                  styles.ratingPill,
                  {
                    backgroundColor: `${currentTheme.color}15`,
                    borderColor: `${currentTheme.color}35`
                  }
                ]}
              >
                <View
                  style={[
                    styles.pulsingDot,
                    {
                      backgroundColor: currentTheme.color,
                      shadowColor: currentTheme.color
                    }
                  ]}
                />
                <Text style={[styles.ratingText, { color: currentTheme.color }]}>
                  {currentTheme.rating}
                </Text>
              </View>

              <Text
                style={[
                  styles.metaSubtext,
                  { color: isLight ? '#64748B' : '#94A3B8' }
                ]}
              >
                Target: ≥ 75% for Academic Honors
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Mini Stats Chips Below Ring */}
      <View style={styles.statsRow}>
        <View
          style={[
            styles.statChip,
            {
              backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 23, 42, 0.75)',
              borderColor: isLight ? '#E2E8F0' : 'rgba(16, 185, 129, 0.28)'
            }
          ]}
        >
          <View style={[styles.dotBeacon, { backgroundColor: '#10B981', shadowColor: '#10B981' }]} />
          <View style={styles.chipTextGroup}>
            <Text style={[styles.chipLabel, { color: isLight ? '#64748B' : '#94A3B8' }]}>
              Study Focus
            </Text>
            <Text style={[styles.chipValue, { color: isLight ? '#0F172A' : '#F8FAFC' }]}>
              {formatMinutes(studyDurationSec)}
            </Text>
          </View>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>{studyPct}%</Text>
          </View>
        </View>

        <View
          style={[
            styles.statChip,
            {
              backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 23, 42, 0.75)',
              borderColor: isLight ? '#E2E8F0' : 'rgba(244, 63, 94, 0.28)'
            }
          ]}
        >
          <View style={[styles.dotBeacon, { backgroundColor: '#F43F5E', shadowColor: '#F43F5E' }]} />
          <View style={styles.chipTextGroup}>
            <Text style={[styles.chipLabel, { color: isLight ? '#64748B' : '#94A3B8' }]}>
              Distraction
            </Text>
            <Text style={[styles.chipValue, { color: isLight ? '#0F172A' : '#F8FAFC' }]}>
              {formatMinutes(distractionDurationSec)}
            </Text>
          </View>
          <View style={[styles.badgePill, styles.distractionBadge]}>
            <Text style={[styles.badgePillText, styles.distractionBadgeText]}>
              {100 - studyPct}%
            </Text>
          </View>
        </View>
      </View>

      {/* Micro Ratio Bar */}
      <View
        style={[
          styles.ratioBarContainer,
          { backgroundColor: isLight ? '#E2E8F0' : '#1E293B' }
        ]}
      >
        <View style={[styles.ratioBarStudy, { flex: Math.max(0.01, studyPct) }]} />
        <View style={[styles.ratioBarDistract, { flex: Math.max(0.01, 100 - studyPct) }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 10
  },
  haloContainer: {
    width: 206,
    height: 206,
    borderRadius: 103,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4
  },
  middleRing: {
    width: 188,
    height: 188,
    borderRadius: 94,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  coreCircle: {
    width: 166,
    height: 166,
    borderRadius: 83,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4
  },
  coreInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 2
  },
  scoreHero: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums']
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 2,
    marginBottom: 4
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  metaSubtext: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center'
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 4
  },
  statChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  dotBeacon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8
  },
  chipTextGroup: {
    flex: 1
  },
  chipLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.3
  },
  chipValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
    fontVariant: ['tabular-nums']
  },
  badgePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8
  },
  badgePillText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800'
  },
  distractionBadge: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)'
  },
  distractionBadgeText: {
    color: '#F43F5E'
  },
  ratioBarContainer: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    width: '95%',
    marginTop: 12
  },
  ratioBarStudy: {
    backgroundColor: '#10B981'
  },
  ratioBarDistract: {
    backgroundColor: '#F43F5E'
  }
});
