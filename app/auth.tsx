import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';

export default function AuthScreen() {
    const { signInWithGoogle, signInAsGuest, loading, user } = useAuth();
    const { theme } = useTheme();
    const router = useRouter();

    // Effect to handle navigation after user state changes
    React.useEffect(() => {
        if (user) {
            // Navigation is handled by _layout.tsx based on user/profile state
        }
    }, [user]);

    const handleGuestLogin = async () => {
        await signInAsGuest();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.colors.primary }]}>CineShelf</Text>
                <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>
                    Your personal movie collection
                </Text>

                <View style={styles.spacer} />

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                    onPress={signInWithGoogle}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={theme.colors.primary} />
                    ) : (
                        <>
                            <Ionicons name="logo-google" size={24} color={theme.colors.text} />
                            <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                                Sign in with Google
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleGuestLogin}
                >
                    <Text style={[styles.skipText, { color: theme.colors.secondary }]}>
                        Continue as Guest
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
    },
    title: {
        fontSize: 42,
        fontWeight: '800',
        marginBottom: 12,
        fontFamily: 'System',
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 48,
        fontFamily: 'System',
    },
    spacer: {
        height: 40,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        borderWidth: 1,
        width: '100%',
        justifyContent: 'center',
        gap: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'System',
    },
    skipButton: {
        marginTop: 24,
        padding: 12,
    },
    skipText: {
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});
