import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FocusRingProps {
  score: number; // 0 to 100
  studyDurationSec: number;
  distractionDurationSec: number;
}

export const FocusRing: React.FC<FocusRingProps> = ({
  score,
  studyDurationSec,
  distractionDurationSec
}) => {
  const formatMinutes = (sec: number) => {
    const mins = Math.floor(sec / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  const getScoreColor = (val: number) => {
    if (val >= 75) return '#10B981'; // Emerald
    if (val >= 50) return '#6366F1'; // Indigo
    if (val >= 30) return '#F59E0B'; // Amber
    return '#EF4444'; // Rose
  };

  const getScoreRating = (val: number) => {
    if (val >= 80) return 'Optimal Focus';
    if (val >= 60) return 'Productive';
    if (val >= 40) return 'Balanced';
    return 'High Distraction';
  };

  const activeColor = getScoreColor(score);
  const ratingText = getScoreRating(score);

  return (
    <View style={styles.container}>
      {/* Outer Glow Halo */}
      <View style={[styles.halo, { borderColor: `${activeColor}20` }]}>
        {/* Main Circular Ring */}
        <View style={[styles.outerRing, { borderColor: activeColor }]}>
          <View style={styles.innerContent}>
            <Text style={styles.scoreNumber}>{Math.round(score)}%</Text>
            <View style={[styles.ratingPill, { backgroundColor: `${activeColor}25` }]}>
              <Text style={[styles.ratingText, { color: activeColor }]}>{ratingText}</Text>
            </View>
            <Text style={styles.subtext}>Daily Focus Score</Text>
          </View>
        </View>
      </View>

      {/* Mini Stats Chips Below Ring */}
      <View style={styles.statsRow}>
        <View style={[styles.statChip, styles.studyChip]}>
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          <View>
            <Text style={styles.chipLabel}>Study Focus</Text>
            <Text style={styles.chipValue}>{formatMinutes(studyDurationSec)}</Text>
          </View>
        </View>

        <View style={[styles.statChip, styles.distractionChip]}>
          <View style={[styles.dot, { backgroundColor: '#F43F5E' }]} />
          <View>
            <Text style={styles.chipLabel}>Distraction</Text>
            <Text style={styles.chipValue}>{formatMinutes(distractionDurationSec)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12
  },
  halo: {
    width: 204,
    height: 204,
    borderRadius: 102,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)'
  },
  outerRing: {
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  scoreNumber: {
    fontSize: 42,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -1
  },
  ratingPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 2,
    marginBottom: 4
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  subtext: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500'
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    width: '100%',
    justifyContent: 'center'
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 130
  },
  studyChip: {
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  distractionChip: {
    borderColor: 'rgba(244, 63, 94, 0.3)'
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8
  },
  chipLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  chipValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 1
  }
});
