import React from 'react';
import { View, StyleSheet } from 'react-native';

interface MiniBarChartProps {
  color?: string;
  height?: number;
  barCount?: number;
}

export const MiniBarChart: React.FC<MiniBarChartProps> = ({
  color = '#8B5CF6',
  height = 36,
  barCount = 10
}) => {
  // Relative bar heights matching the reference battery chart
  const barHeights = [40, 65, 30, 85, 95, 45, 60, 80, 50, 70];

  return (
    <View style={[styles.container, { height }]}>
      {barHeights.slice(0, barCount).map((h, idx) => (
        <View key={idx} style={styles.barCol}>
          <View
            style={[
              styles.bar,
              {
                height: `${h}%`,
                backgroundColor: color,
                opacity: idx === 4 ? 1 : 0.45 + (idx % 3) * 0.2
              }
            ]}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 4
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end'
  },
  bar: {
    width: 4,
    borderRadius: 2
  }
});
