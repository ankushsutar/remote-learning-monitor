import React from 'react';
import { View, StyleSheet } from 'react-native';

interface WavePulseLineProps {
  color?: string;
  width?: number;
  height?: number;
}

export const WavePulseLine: React.FC<WavePulseLineProps> = ({
  color = '#FF6B8B',
  width = 90,
  height = 24
}) => {
  return (
    <View style={[styles.container, { width, height }]}>
      {/* Flat baseline left */}
      <View style={[styles.line, { backgroundColor: color, width: '22%', top: 12 }]} />
      
      {/* First small blip down */}
      <View style={[styles.diagLine, { backgroundColor: color, width: 2, height: 8, top: 12, left: '22%', transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.diagLine, { backgroundColor: color, width: 2, height: 16, top: 5, left: '28%', transform: [{ rotate: '-45deg' }] }]} />
      
      {/* Sharp QRS Spike up */}
      <View style={[styles.diagLine, { backgroundColor: color, width: 2.5, height: 22, top: 1, left: '40%', transform: [{ rotate: '25deg' }] }]} />
      <View style={[styles.diagLine, { backgroundColor: color, width: 2.5, height: 24, top: 1, left: '50%', transform: [{ rotate: '-30deg' }] }]} />
      
      {/* T wave recovery */}
      <View style={[styles.diagLine, { backgroundColor: color, width: 2, height: 10, top: 10, left: '60%', transform: [{ rotate: '40deg' }] }]} />
      <View style={[styles.diagLine, { backgroundColor: color, width: 2, height: 8, top: 12, left: '68%', transform: [{ rotate: '-40deg' }] }]} />

      {/* Flat baseline right */}
      <View style={[styles.line, { backgroundColor: color, width: '26%', top: 12, right: 0 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    marginLeft: 8
  },
  line: {
    position: 'absolute',
    height: 2,
    borderRadius: 1
  },
  diagLine: {
    position: 'absolute',
    borderRadius: 1
  }
});
