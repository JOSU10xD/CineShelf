// app/components/FadeInOnFocus.tsx
import { useIsFocused } from '@react-navigation/native';
import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

interface Props {
  style?: StyleProp<ViewStyle>;
  duration?: number; // ms
  startOpacity?: number; // opacity when unfocused
}

export default function FadeInOnFocus({
  children,
  style,
  duration = 280,
  startOpacity = 0.0,
}: PropsWithChildren<Props>) {
  const focused = useIsFocused();
  const anim = useRef(new Animated.Value(focused ? 1 : startOpacity)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: focused ? 1 : startOpacity,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [focused, anim, duration, startOpacity]);

  return (
    <Animated.View style={[{ flex: 1, opacity: anim }, style]}>
      {children}
    </Animated.View>
  );
}
