import { Stack } from 'expo-router';
import { AppProvider } from '../contexts/AppContext';

export default function RootLayout() {
  // Polyfill for window.ethereum to prevent crashes in some environments
  if (typeof window !== 'undefined' && !(window as any).ethereum) {
    try {
      (window as any).ethereum = {
        selectedAddress: null,
      };
    } catch (e) {
      // Ignore if we can't set it
    }
  }

  return (
    <AppProvider>
      <Stack screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 350,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AppProvider>
  );
}