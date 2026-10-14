import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { triggerHaptic } from '../utils/haptics';

interface DataPoint {
  timeLabel: string;
  value: number; // 0 to 100
}

interface MethodDiagnosticsChartProps {
  data: DataPoint[];
  selectedRange: '24h' | '7d' | '30d' | '90d';
  accentColor?: string;
  isLight?: boolean;
}

export const MethodDiagnosticsChart: React.FC<MethodDiagnosticsChartProps> = ({
  data,
  selectedRange,
  accentColor = '#0D9488',
  isLight = true
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(() => {
    // Default to the highest or near-end peak index
    let maxIdx = 0;
    let maxVal = -1;
    data.forEach((d, i) => {
      if (d.value > maxVal) {
        maxVal = d.value;
        maxIdx = i;
      }
    });
    return maxIdx;
  });

  const chartHeight = 140;
  const gridTicks = [100, 80, 60, 40, 20];

  const selectedPoint = data[selectedIndex] || data[0];

  return (
    <View style={styles.wrapper}>
      {/* Chart Layout: Left Y-Axis + Right Chart Canvas */}
      <View style={styles.chartRow}>
        {/* Y-Axis Column */}
        <View style={[styles.yAxisCol, { height: chartHeight }]}>
          {gridTicks.map((tick) => (
            <Text
              key={tick}
              style={[
                styles.axisTickText,
                { color: isLight ? '#94A3B8' : '#64748B' }
              ]}
            >
              {tick}
            </Text>
          ))}
        </View>

        {/* Chart Canvas Area */}
        <View style={[styles.canvasArea, { height: chartHeight }]}>
          {/* Horizontal Gridlines */}
          {gridTicks.map((tick, idx) => {
            const topPct = (idx / (gridTicks.length - 1)) * 100;
            return (
              <View
                key={`grid-${tick}`}
                style={[
                  styles.gridLine,
                  {
                    top: `${topPct}%`,
                    backgroundColor: isLight
                      ? 'rgba(226, 232, 240, 0.7)'
                      : 'rgba(255, 255, 255, 0.06)'
                  }
                ]}
              />
            );
          })}

          {/* Area Fill Columns under the curve */}
          <View style={styles.fillAreaContainer}>
            {data.map((item, idx) => {
              const heightPct = Math.max(8, Math.min(100, item.value));
              const isSelected = idx === selectedIndex;
              return (
                <TouchableOpacity
                  key={`bar-${idx}`}
                  activeOpacity={0.8}
                  onPress={() => {
                    triggerHaptic('light');
                    setSelectedIndex(idx);
                  }}
                  style={styles.colTouchTarget}
                >
                  <View
                    style={[
                      styles.colFill,
                      {
                        height: `${heightPct}%`,
                        backgroundColor: isSelected
                          ? isLight
                            ? 'rgba(13, 148, 136, 0.22)'
                            : 'rgba(20, 184, 166, 0.3)'
                          : isLight
                          ? 'rgba(13, 148, 136, 0.07)'
                          : 'rgba(20, 184, 166, 0.08)'
                      }
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Connected Sparkline Curve (Segmented Line interpolation) */}
          <View style={styles.lineContainer}>
            {data.map((item, idx) => {
              if (idx === data.length - 1) return null;
              const nextItem = data[idx + 1];
              const diff = nextItem.value - item.value;
              const bottomPct = item.value;

              return (
                <View key={`seg-${idx}`} style={styles.segmentSlot}>
                  <View
                    style={[
                      styles.segmentLine,
                      {
                        backgroundColor: accentColor,
                        bottom: `${bottomPct}%`,
                        transform: [{ rotate: `${-diff * 1.5}deg` }]
                      }
                    ]}
                  />
                </View>
              );
            })}
          </View>

          {/* Vertical Indicator Guide & Floating Badge at Selected Point */}
          {selectedPoint && (
            <View
              style={[
                styles.indicatorOverlay,
                {
                  left: `${((selectedIndex + 0.5) / data.length) * 100}%`
                }
              ]}
              pointerEvents="none"
            >
              {/* Floating Tooltip Pill (Exact Method X Badge) */}
              <View
                style={[
                  styles.floatingTooltip,
                  {
                    backgroundColor: '#0F766E',
                    bottom: `${Math.min(92, selectedPoint.value + 12)}%`
                  }
                ]}
              >
                <Text style={styles.tooltipText}>{selectedPoint.value}%</Text>
              </View>

              {/* Vertical Dashed / Light Line */}
              <View
                style={[
                  styles.verticalGuideLine,
                  {
                    backgroundColor: accentColor,
                    height: `${selectedPoint.value}%`
                  }
                ]}
              />

              {/* Active Marker Dot on the Curve */}
              <View
                style={[
                  styles.activeDot,
                  {
                    backgroundColor: accentColor,
                    bottom: `${selectedPoint.value}%`
                  }
                ]}
              >
                <View style={styles.innerDotCore} />
              </View>
            </View>
          )}
        </View>
      </View>

      {/* X-Axis Time Labels at the Bottom */}
      <View style={styles.xAxisRow}>
        <View style={styles.xAxisColSpacer} />
        <View style={styles.xAxisLabelsArea}>
          {getXAxisLabels(selectedRange).map((label, idx) => (
            <Text
              key={`${label}-${idx}`}
              style={[
                styles.xAxisText,
                { color: isLight ? '#94A3B8' : '#64748B' }
              ]}
            >
              {label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
};

function getXAxisLabels(range: '24h' | '7d' | '30d' | '90d'): string[] {
  switch (range) {
    case '24h':
      return ['12 AM', '6 AM', '12 PM', '6 PM', '12 AM'];
    case '7d':
      return ['Mon', 'Wed', 'Fri', 'Sun'];
    case '30d':
      return ['W1', 'W2', 'W3', 'W4'];
    case '90d':
      return ['Month 1', 'Month 2', 'Month 3'];
  }
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginVertical: 4
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  yAxisCol: {
    width: 32,
    justifyContent: 'space-between',
    paddingVertical: 2,
    alignItems: 'flex-start'
  },
  axisTickText: {
    fontSize: 10,
    fontWeight: '600',
    fontVariant: ['tabular-nums']
  },
  canvasArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden'
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1
  },
  fillAreaContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row'
  },
  colTouchTarget: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'stretch'
  },
  colFill: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3
  },
  lineContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end'
  },
  segmentSlot: {
    flex: 1,
    height: '100%',
    position: 'relative'
  },
  segmentLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 1.5
  },
  indicatorOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  floatingTooltip: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums']
  },
  verticalGuideLine: {
    width: 1.5,
    opacity: 0.45
  },
  activeDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -5,
    marginBottom: -6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4
  },
  innerDotCore: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF'
  },
  xAxisRow: {
    flexDirection: 'row',
    marginTop: 8
  },
  xAxisColSpacer: {
    width: 32
  },
  xAxisLabelsArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4
  },
  xAxisText: {
    fontSize: 10,
    fontWeight: '600'
  }
});
