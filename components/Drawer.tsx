import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
    Dimensions,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { useDrawer } from '../contexts/DrawerContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';
import { useWatchlist } from '../hooks/useWatchlist';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.8, 300); // Max width 300

// Avatar assets mapping
const AVATARS: Record<string, any> = {
    '1': { uri: 'https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg' },
    '2': { uri: 'https://img.freepik.com/free-psd/3d-illustration-person-with-pink-hair_23-2149436186.jpg' },
    '3': { uri: 'https://img.freepik.com/free-psd/3d-illustration-person-with-glasses_23-2149436190.jpg' },
    '4': { uri: 'https://img.freepik.com/free-psd/3d-illustration-person_23-2149436192.jpg' },
};

export const Drawer = () => {
    const { isOpen, closeDrawer } = useDrawer();
    const { theme } = useTheme();
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { profile } = useUserProfile(user?.uid);
    const { watchlist } = useWatchlist(user?.uid);

    const translateX = useSharedValue(-DRAWER_WIDTH);
    const backdropOpacity = useSharedValue(0);
    const zIndex = useSharedValue(-1);

    useEffect(() => {
        if (isOpen) {
            zIndex.value = 1000;
            translateX.value = withTiming(0, { duration: 300 });
            backdropOpacity.value = withTiming(0.5);
        } else {
            translateX.value = withTiming(-DRAWER_WIDTH, { duration: 300 }, (finished) => {
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
        }, 100);
    };

    const handleSignOut = async () => {
        closeDrawer();
        await signOut();
        router.replace('/auth' as any);
    };

    const avatarSource = profile?.avatarId ? AVATARS[String(profile.avatarId)] : null;

    // if (!isOpen && zIndex.value === -1) return null; // Removed to fix Reanimated warning

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
                {/* Header Section */}
                <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                    <View style={styles.userInfo}>
                        {user ? (
                            <>
                                <View style={styles.avatarContainer}>
                                    {avatarSource ? (
                                        <Image source={avatarSource} style={styles.avatar} />
                                    ) : (
                                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                                            <Text style={styles.avatarInitials}>
                                                {profile?.username?.substring(0, 1).toUpperCase() || 'U'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.userTextContainer}>
                                    <Text style={[styles.username, { color: theme.colors.text }]} numberOfLines={1}>
                                        {profile?.username || 'User'}
                                    </Text>
                                    <TouchableOpacity onPress={() => handleNavigation('/profile-edit')}>
                                        <Text style={[styles.editProfileText, { color: theme.colors.primary }]}>Edit Profile</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>CineShelf</Text>
                        )}
                    </View>
                    <Pressable onPress={closeDrawer} style={styles.closeButton} hitSlop={10}>
                        <Ionicons name="close-circle" size={32} color={theme.colors.text} />
                    </Pressable>
                </View>

                {/* Content Section */}
                <View style={styles.content}>
                    {user && (
                        <View style={styles.statsContainer}>
                            <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                                <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                                    {watchlist.length}
                                </Text>
                                <Text style={[styles.statLabel, { color: theme.colors.secondary }]}>
                                    Movies in Watchlist
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.menuContainer}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.menuItem,
                                { backgroundColor: pressed ? theme.colors.border : 'transparent' },
                            ]}
                            onPress={() => handleNavigation('/genre-picker')}
                        >
                            <Ionicons name="grid-outline" size={24} color={theme.colors.text} />
                            <Text style={[styles.menuText, { color: theme.colors.text }]}>Pick Genres</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.menuItem,
                                { backgroundColor: pressed ? theme.colors.border : 'transparent' },
                            ]}
                            onPress={() => handleNavigation('/ai-recommend')}
                        >
                            <Ionicons name="sparkles-outline" size={24} color={theme.colors.text} />
                            <Text style={[styles.menuText, { color: theme.colors.text }]}>AI Assistant</Text>
                        </Pressable>

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
                </View>

                {/* Footer Section */}
                <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
                    {user ? (
                        <Pressable
                            style={({ pressed }) => [
                                styles.logoutButton,
                                { backgroundColor: pressed ? theme.colors.error + '20' : 'transparent' }
                            ]}
                            onPress={handleSignOut}
                        >
                            <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
                            <Text style={[styles.menuText, { color: theme.colors.error }]}>Sign Out</Text>
                        </Pressable>
                    ) : (
                        <Pressable
                            style={styles.menuItem}
                            onPress={() => handleNavigation('/auth')}
                        >
                            <Ionicons name="log-in-outline" size={24} color={theme.colors.primary} />
                            <Text style={[styles.menuText, { color: theme.colors.primary }]}>Sign In</Text>
                        </Pressable>
                    )}
                    <Text style={[styles.versionText, { color: theme.colors.secondary }]}>v1.0.0</Text>
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
        paddingTop: 0, // Remove padding top as we handle it in header
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50, // Add padding for status bar
        borderBottomWidth: 1,
    },
    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    userTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 20,
    },
    username: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'System',
        marginBottom: 2,
    },
    editProfileText: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'System',
        marginTop: 2,
    },
    email: {
        fontSize: 12,
        fontFamily: 'System',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'System',
    },
    closeButton: {
        padding: 4,
        marginLeft: 8,
    },
    content: {
        flex: 1,
        paddingVertical: 20,
    },
    statsContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    statItem: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        gap: 12,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'System',
    },
    statLabel: {
        fontSize: 14,
        fontFamily: 'System',
    },
    menuContainer: {
        gap: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 16,
        width: '100%',
    },
    menuText: {
        fontSize: 16,
        fontWeight: '500',
        fontFamily: 'System',
    },
    footer: {
        paddingVertical: 20,
        borderTopWidth: 1,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 12,
        marginTop: 12,
    }
});

