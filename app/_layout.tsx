import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from '../components/Drawer';
import { Splash } from '../components/Splash';
import { AppProvider } from '../contexts/AppContext';
import { AuthProvider } from '../contexts/AuthContext';
import { DrawerProvider } from '../contexts/DrawerContext';
import { ProfileProvider } from '../contexts/ProfileContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';

function RootLayoutNav() {
    const [splashComplete, setSplashComplete] = useState(false);
    const { user, loading: authLoading } = useAuth();
    const { profile, loading: profileLoading } = useUserProfile(user?.uid);
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (!splashComplete || authLoading || profileLoading) return;

        const inAuthGroup = (segments[0] as string) === 'auth';
        const inProfileSetup = (segments[0] as string) === 'profile-setup';

        if (!user && !inAuthGroup) {
            // Redirect to auth if not logged in (optional, or let them browse as guest)
            // Requirement says: "Add a new Auth screen before Home when user not authenticated"
            // But also "Keep a fallback guest/no-login flow unchanged".
            // So we will NOT force redirect to auth, but we will show Auth screen if they choose to login.
            // However, the Splash requirement says "immediately navigates to Auth or Home".
            // Let's navigate to Auth if no user, but allow skipping.
            router.replace('/auth' as any);
        } else if (user && !profile && !inProfileSetup) {
            // If logged in but no profile, go to setup
            router.replace('/profile-setup' as any);
        } else if (user && profile && (inAuthGroup || inProfileSetup)) {
            // If logged in and has profile, go to home
            router.replace('/(tabs)/discover' as any);
        }
    }, [user, profile, splashComplete, authLoading, profileLoading, segments]);

    if (!splashComplete) {
        return <Splash onFinish={() => setSplashComplete(true)} />;
    }

    return (
        <Stack screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 350,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
        }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ presentation: 'card', headerShown: false }} />
            <Stack.Screen name="about" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
    );
}

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
                <AuthProvider>
                    <ProfileProvider>
                        <DrawerProvider>
                            <AppProvider>
                                <RootLayoutNav />
                                <Drawer />
                            </AppProvider>
                        </DrawerProvider>
                    </ProfileProvider>
                </AuthProvider>
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
