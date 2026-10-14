import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '../theme/theme';

interface SparklineChartProps {
  data: number[];
  theme: ThemeColors;
  currentValue?: number;
  unit?: string;
  labels?: string[];
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  data = [65, 70, 68, 75, 82, 88, 79, 85, 92, 88],
  theme,
  currentValue = 88,
  unit = '%',
  labels = ['12 AM', '6 AM', '12 PM', '6 PM', '12 AM']
}) => {
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;
  const peakIndex = data.indexOf(maxVal);

  return (
    <View style={styles.container}>
      {/* Chart Visual Surface */}
      <View style={styles.chartSurface}>
        {/* Horizontal Grid lines */}
        <View style={[styles.gridLine, { borderColor: theme.mode === 'light' ? '#F1F5F9' : 'rgba(255,255,255,0.05)', top: '25%' }]} />
        <View style={[styles.gridLine, { borderColor: theme.mode === 'light' ? '#F1F5F9' : 'rgba(255,255,255,0.05)', top: '50%' }]} />
        <View style={[styles.gridLine, { borderColor: theme.mode === 'light' ? '#F1F5F9' : 'rgba(255,255,255,0.05)', top: '75%' }]} />

        {/* Data Columns / Sparkline Bars with curve appearance */}
        <View style={styles.barsContainer}>
          {data.map((val, idx) => {
            const heightPct = Math.max(15, Math.min(100, Math.round(((val - minVal) / range) * 80 + 15)));
            const isPeak = idx === peakIndex;
            const isLatest = idx === data.length - 1;

            return (
              <View key={idx} style={styles.barCol}>
                {isPeak && (
                  <View style={[styles.peakBadge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.peakBadgeText}>{val}{unit}</Text>
                    <View style={[styles.peakArrow, { borderTopColor: theme.primary }]} />
                  </View>
                )}

                <View style={styles.barTrack}>
                  {/* Gradient fill appearance bar */}
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${heightPct}%`,
                        backgroundColor: isPeak
                          ? theme.primary
                          : theme.mode === 'light'
                          ? 'rgba(13, 148, 136, 0.28)'
                          : 'rgba(99, 102, 241, 0.35)'
                      }
                    ]}
                  >
                    {/* Top glowing cap dot */}
                    <View
                      style={[
                        styles.capDot,
                        {
                          backgroundColor: isPeak ? '#FFFFFF' : theme.primary,
                          borderColor: theme.primary
                        }
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Time Axis Labels */}
      <View style={styles.labelsRow}>
        {labels.map((lbl, idx) => (
          <Text key={idx} style={[styles.axisLabel, { color: theme.textMuted }]}>
            {lbl}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 10
  },
  chartSurface: {
    height: 120,
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
    marginBottom: 8
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderStyle: 'dashed'
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingHorizontal: 8
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative'
  },
  barTrack: {
    width: 8,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  barFill: {
    width: 6,
    borderRadius: 4,
    position: 'relative',
    alignItems: 'center'
  },
  capDot: {
    position: 'absolute',
    top: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1
  },
  peakBadge: {
    position: 'absolute',
    top: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3
  },
  peakBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800'
  },
  peakArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
    marginTop: -1
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4
  },
  axisLabel: {
    fontSize: 10,
    fontWeight: '600'
  }
});
