import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MethodDonutArcProps {
  score: number; // 0 to 100
  color?: string;
  trackColor?: string;
  icon?: string;
  size?: number;
}

export const MethodDonutArc: React.FC<MethodDonutArcProps> = ({
  score = 88,
  color = '#0D9488',
  trackColor = '#E0F2FE',
  icon = '🎯',
  size = 78
}) => {
  const borderWidth = Math.round(size * 0.12);
  const innerSize = size - borderWidth * 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background Track Circle */}
      <View
        style={[
          styles.trackCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth,
            borderColor: trackColor
          }
        ]}
      />

      {/* Partial Arc Overlay */}
      <View
        style={[
          styles.arcOverlay,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth,
            borderColor: color,
            borderBottomColor: 'transparent',
            borderLeftColor: score > 75 ? color : 'transparent'
          }
        ]}
      />

      {/* Center Icon Circle */}
      <View
        style={[
          styles.centerIconBox,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2
          }
        ]}
      >
        <Text style={{ fontSize: Math.round(size * 0.3) }}>{icon}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  trackCircle: {
    position: 'absolute'
  },
  arcOverlay: {
    position: 'absolute',
    transform: [{ rotate: '-45deg' }]
  },
  centerIconBox: {
    alignItems: 'center',
    justifyContent: 'center'
  }
});
