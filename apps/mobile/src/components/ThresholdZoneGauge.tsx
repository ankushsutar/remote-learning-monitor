import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ThresholdZoneGaugeProps {
  value: number; // e.g. 88
  unit?: string; // e.g. "%" or "ms"
  min?: number;  // e.g. 40
  targetMin?: number; // e.g. 75
  targetMax?: number; // e.g. 95
  max?: number;  // e.g. 100
  color?: string;
  themeMode?: 'light' | 'dark';
}

export const ThresholdZoneGauge: React.FC<ThresholdZoneGaugeProps> = ({
  value = 88,
  unit = '%',
  min = 40,
  targetMin = 75,
  targetMax = 95,
  max = 100,
  color = '#10B981',
  themeMode = 'light'
}) => {
  const isLight = themeMode === 'light';
  const range = max - min;
  const clampedVal = Math.max(min, Math.min(max, value));
  const markerPosPct = Math.round(((clampedVal - min) / range) * 100);
  const targetStartPct = Math.round(((targetMin - min) / range) * 100);
  const targetWidthPct = Math.round(((targetMax - targetMin) / range) * 100);

  return (
    <View style={styles.container}>
      {/* Visual Track Bar */}
      <View style={[styles.track, { backgroundColor: isLight ? '#E5E7EB' : '#1E293B' }]}>
        {/* Highlighted Target Zone */}
        <View
          style={[
            styles.targetZone,
            {
              left: `${targetStartPct}%`,
              width: `${targetWidthPct}%`,
              backgroundColor: isLight ? '#D1FAE5' : 'rgba(16, 185, 129, 0.25)',
              borderColor: isLight ? '#10B981' : 'rgba(16, 185, 129, 0.5)'
            }
          ]}
        />

        {/* Current Value Marker Pin */}
        <View
          style={[
            styles.markerPin,
            {
              left: `${markerPosPct}%`,
              backgroundColor: color,
              shadowColor: color
            }
          ]}
        />
      </View>

      {/* Axis Values Below */}
      <View style={styles.labelsRow}>
        <Text style={[styles.axisText, { color: isLight ? '#9CA3AF' : '#64748B' }]}>
          {min}{unit}
        </Text>
        <Text style={[styles.axisText, { color: isLight ? '#065F46' : '#34D399', fontWeight: '800' }]}>
          {targetMin}{unit} Target
        </Text>
        <Text style={[styles.axisText, { color: isLight ? '#9CA3AF' : '#64748B' }]}>
          {max}{unit}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8
  },
  track: {
    height: 14,
    borderRadius: 7,
    width: '100%',
    position: 'relative',
    overflow: 'visible'
  },
  targetZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 6,
    borderWidth: 1
  },
  markerPin: {
    position: 'absolute',
    top: -4,
    width: 6,
    height: 22,
    borderRadius: 3,
    marginLeft: -3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  axisText: {
    fontSize: 10,
    fontWeight: '600'
  }
});
