import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function About() {
    const { theme } = useTheme();
    const router = useRouter();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.headerBackground }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={theme.colors.headerText} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.colors.headerText }]}>About</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={[styles.logoContainer, { backgroundColor: theme.colors.card }]}>
                    <Ionicons name="film-outline" size={64} color={theme.colors.primary} />
                </View>

                <Text style={[styles.appName, { color: theme.colors.text }]}>CineShelf</Text>
                <Text style={[styles.version, { color: theme.colors.secondary }]}>Version 1.0.0</Text>

                <Text style={[styles.description, { color: theme.colors.text }]}>
                    CineShelf is your personal movie collection manager. Discover new films, keep track of what you want to watch, and organize your favorites.
                </Text>

                <View style={[styles.infoCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>UI Refresh</Text>
                    <Text style={[styles.infoText, { color: theme.colors.text }]}>
                        Now featuring a modern, Aura-inspired design with smooth animations and customizable themes.
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'System',
    },
    backButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        padding: 40,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    appName: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 8,
        fontFamily: 'System',
    },
    version: {
        fontSize: 16,
        marginBottom: 32,
        fontFamily: 'System',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
        fontFamily: 'System',
    },
    infoCard: {
        width: '100%',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        fontFamily: 'System',
    },
    infoText: {
        fontSize: 14,
        lineHeight: 20,
        fontFamily: 'System',
    },
});
