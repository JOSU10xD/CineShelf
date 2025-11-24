import { Stack } from 'expo-router';
import React from 'react';

export default function WatchlistStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0A0A' },
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="watchlist" options={{ headerShown: false }} />
    </Stack>
  );
}