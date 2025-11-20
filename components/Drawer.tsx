import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useDrawer } from '../contexts/DrawerContext';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

export const Drawer = () => {
    const { isOpen, closeDrawer } = useDrawer();
    const { theme } = useTheme();
    const router = useRouter();

    const translateX = useSharedValue(-DRAWER_WIDTH);
    const backdropOpacity = useSharedValue(0);
    const zIndex = useSharedValue(-1);

    useEffect(() => {
        if (isOpen) {
            zIndex.value = 1000;
            translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
            backdropOpacity.value = withTiming(0.5);
        } else {
            translateX.value = withTiming(-DRAWER_WIDTH, undefined, (finished) => {
                if (finished) {
                    zIndex.value = -1;
                }
            });
            backdropOpacity.value = withTiming(0);
        }
    }, [isOpen]);

    const drawerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
        zIndex: zIndex.value,
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
        zIndex: zIndex.value === 1000 ? 999 : -1,
    }));

    const handleNavigation = (route: string) => {
        closeDrawer();
        // Small delay to allow drawer to start closing
        setTimeout(() => {
            router.push(route as any);
        }, 150);
    };

    return (
        <>
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
            </Animated.View>

            <Animated.View
                style={[
                    styles.drawer,
                    drawerStyle,
                    { backgroundColor: theme.colors.card, borderRightColor: theme.colors.border },
                ]}
            >
                <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                    <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>CineShelf</Text>
                    <Pressable onPress={closeDrawer} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </Pressable>
                </View>

                <View style={styles.content}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.menuItem,
                            { backgroundColor: pressed ? theme.colors.border : 'transparent' },
                        ]}
                        onPress={() => handleNavigation('/settings')}
                    >
                        <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
                        <Text style={[styles.menuText, { color: theme.colors.text }]}>Settings</Text>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.menuItem,
                            { backgroundColor: pressed ? theme.colors.border : 'transparent' },
                        ]}
                        onPress={() => handleNavigation('/about')}
                    >
                        <Ionicons name="information-circle-outline" size={24} color={theme.colors.text} />
                        <Text style={[styles.menuText, { color: theme.colors.text }]}>About</Text>
                    </Pressable>
                </View>

                <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
                    <Text style={[styles.footerText, { color: theme.colors.secondary }]}>v1.0.0</Text>
                </View>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    drawer: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: DRAWER_WIDTH,
        borderRightWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        paddingTop: 50, // Safe area top
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'System',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        paddingTop: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 16,
    },
    menuText: {
        fontSize: 16,
        fontWeight: '500',
        fontFamily: 'System',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
    }
});
