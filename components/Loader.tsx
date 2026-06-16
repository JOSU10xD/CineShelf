import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Helper to interpolate between two HEX colors to create a beautiful gradient shade
function interpolateColor(color1: string, color2: string, factor: number) {
  const c1 = color1.replace('#', '');
  const c2 = color2.replace('#', '');

  const r1 = parseInt(c1.substring(0, 2), 16);
  const g1 = parseInt(c1.substring(2, 4), 16);
  const b1 = parseInt(c1.substring(4, 6), 16);

  const r2 = parseInt(c2.substring(0, 2), 16);
  const g2 = parseInt(c2.substring(2, 4), 16);
  const b2 = parseInt(c2.substring(4, 6), 16);

  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

export default function Loader() {
  const { theme } = useTheme();

  // Create 5 animated values for the 5 ripple delay tiers (d-0 to d-4)
  const anim0 = useRef(new Animated.Value(0)).current;
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;
  const anim4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Each tier has a timing sequence: delay, fade-in, fade-out, remaining loop padding
    const createTiming = (value: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.delay(600 - delay),
      ]);
    };

    const loop = Animated.loop(
      Animated.parallel([
        createTiming(anim0, 0),
        createTiming(anim1, 100),
        createTiming(anim2, 200),
        createTiming(anim3, 300),
        createTiming(anim4, 400),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [anim0, anim1, anim2, anim3, anim4]);

  // Map the 9 cells to their delay animators and interpolated theme colors
  const cells = [
    { key: '1', anim: anim0, color: interpolateColor(theme.colors.primary, theme.colors.secondary, 0) },
    { key: '2', anim: anim1, color: interpolateColor(theme.colors.primary, theme.colors.secondary, 0.125) },
    { key: '3', anim: anim2, color: interpolateColor(theme.colors.primary, theme.colors.secondary, 0.25) },
    { key: '4', anim: anim1, color: interpolateColor(theme.colors.primary, theme.colors.secondary, 0.375) },
    { key: '5', anim: anim2, color: interpolateColor(theme.colors.primary, theme.colors.secondary, 0.5) },
    { key: '6', anim: anim2, color: interpolateColor(theme.colors.primary, theme.colors.secondary, 0.625) },
    { key: '7', anim: anim3, color: interpolateColor(theme.colors.primary, theme.colors.secondary, 0.75) },
    { key: '8', anim: anim3, color: interpolateColor(theme.colors.primary, theme.colors.secondary, 0.875) },
    { key: '9', anim: anim4, color: interpolateColor(theme.colors.primary, theme.colors.secondary, 1.0) },
  ];

  return (
    <View style={styles.loader}>
      {cells.map((cell) => (
        <Animated.View
          key={cell.key}
          style={[
            styles.cell,
            {
              backgroundColor: cell.color,
              opacity: cell.anim,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    width: 162,
    height: 162,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cell: {
    width: 52,
    height: 52,
    margin: 1,
    borderRadius: 4,
  },
});
