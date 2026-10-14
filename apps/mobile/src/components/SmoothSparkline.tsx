import React from 'react';
import { View, StyleSheet } from 'react-native';

interface SmoothSparklineProps {
  color?: string;
  height?: number;
  showPeakDot?: boolean;
}

export const SmoothSparkline: React.FC<SmoothSparklineProps> = ({
  color = '#8B5CF6',
  height = 36,
  showPeakDot = false
}) => {
  // Wave coordinates as heights percentage (0 to 100) across 16 steps
  const points = [40, 45, 52, 48, 38, 32, 60, 85, 30, 45, 65, 75, 68, 55, 50, 48];

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.lineContainer}>
        {points.map((val, idx) => {
          if (idx === points.length - 1) return null;
          const nextVal = points[idx + 1];
          const diff = nextVal - val;
          const isPeak = showPeakDot && idx === 7;

          return (
            <View key={idx} style={styles.segmentWrapper}>
              {/* Segment line */}
              <View
                style={[
                  styles.segment,
                  {
                    backgroundColor: color,
                    bottom: `${val}%`,
                    transform: [{ rotate: `${-diff * 1.8}deg` }]
                  }
                ]}
              />

              {/* Glowing peak dot if enabled */}
              {isPeak && (
                <View
                  style={[
                    styles.peakDot,
                    {
                      backgroundColor: color,
                      shadowColor: color,
                      bottom: `${val + 10}%`
                    }
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    marginVertical: 6
  },
  lineContainer: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
    alignItems: 'flex-end',
    justifyContent: 'space-between'
  },
  segmentWrapper: {
    flex: 1,
    height: '100%',
    position: 'relative'
  },
  segment: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 1.5
  },
  peakDot: {
    position: 'absolute',
    left: '20%',
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  }
});
