import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from '../components/Drawer';
import { AppProvider } from '../contexts/AppContext';
import { DrawerProvider } from '../contexts/DrawerContext';
import { ThemeProvider } from '../contexts/ThemeContext';

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
        <GestureHandlerRootView style={styles.container}>
            <ThemeProvider>
                <DrawerProvider>
                    <AppProvider>
                        <Stack screenOptions={{
                            headerShown: false,
                            animation: 'slide_from_right',
                            animationDuration: 350,
                            gestureEnabled: true,
                            gestureDirection: 'horizontal',
                        }}>
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen name="settings" options={{ presentation: 'card', headerShown: false }} />
                            <Stack.Screen name="about" options={{ presentation: 'modal', headerShown: false }} />
                        </Stack>
                        <Drawer />
                    </AppProvider>
                </DrawerProvider>
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
