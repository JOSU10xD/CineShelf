import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDrawer } from '../contexts/DrawerContext';
import { ThemeKey, themes, useTheme } from '../contexts/ThemeContext';

export default function Settings() {
    const { theme, setTheme } = useTheme();
    const { openDrawer } = useDrawer();
    const router = useRouter();

    const ThemeOption = ({ themeKey, label }: { themeKey: ThemeKey; label: string }) => {
        const t = themes[themeKey];
        const isActive = theme.key === themeKey;

        return (
            <Pressable
                style={[
                    styles.themeOption,
                    {
                        backgroundColor: t.colors.card,
                        borderColor: isActive ? theme.colors.primary : t.colors.border,
                        borderWidth: isActive ? 2 : 1,
                    },
                ]}
                onPress={() => setTheme(themeKey)}
            >
                <View style={styles.themePreview}>
                    <View style={[styles.colorSwatch, { backgroundColor: t.colors.background }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: t.colors.primary }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: t.colors.text }]} />
                </View>
                <Text style={[styles.themeLabel, { color: t.colors.text }]}>{label}</Text>
                {isActive && (
                    <View style={[styles.checkIcon, { backgroundColor: theme.colors.primary }]}>
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                    </View>
                )}
            </Pressable>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.headerBackground }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.headerText} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.colors.headerText }]}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Appearance</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.secondary }]}>Choose your preferred theme</Text>

                <View style={styles.themeGrid}>
                    <ThemeOption themeKey="theme1" label="Bright & Dark" />
                    <ThemeOption themeKey="theme2" label="Cyan Dark" />
                    <ThemeOption themeKey="theme3" label="Muted Purple" />
                    <ThemeOption themeKey="theme4" label="Pink & Peach" />
                </View>
            </ScrollView>
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
        padding: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
        fontFamily: 'System',
    },
    sectionSubtitle: {
        fontSize: 16,
        marginBottom: 24,
        fontFamily: 'System',
    },
    themeGrid: {
        gap: 16,
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    themePreview: {
        flexDirection: 'row',
        marginRight: 16,
        gap: 8,
    },
    colorSwatch: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    themeLabel: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        fontFamily: 'System',
    },
    checkIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
