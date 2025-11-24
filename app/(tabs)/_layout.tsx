import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDrawer } from '../../contexts/DrawerContext';
import { useTheme } from '../../contexts/ThemeContext';

type TabName = 'discover' | 'search' | 'watchlist';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function TabLayout() {
    const { theme } = useTheme();
    const { openDrawer } = useDrawer();

    const animatedValues = useRef({
        discover: new Animated.Value(1),
        search: new Animated.Value(0),
        watchlist: new Animated.Value(0),
    }).current;

    const animateTab = (tabName: TabName) => {
        // Reset all tabs
        (Object.keys(animatedValues) as TabName[]).forEach(key => {
            if (key !== tabName) {
                Animated.timing(animatedValues[key], {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            }
        });

        // Animate active tab
        Animated.timing(animatedValues[tabName], {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const TabIcon = ({ focused, size, tabName }: {
        focused: boolean;
        size: number;
        tabName: TabName;
    }) => {
        const scale = animatedValues[tabName].interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.1],
        });

        // Define icon names for each tab
        const getIconName = (): IconName => {
            switch (tabName) {
                case 'discover':
                    return focused ? "compass" : "compass-outline";
                case 'search':
                    return focused ? "search" : "search-outline";
                case 'watchlist':
                    return focused ? "bookmark" : "bookmark-outline";
                default:
                    return "help-outline";
            }
        };

        return (
            <Animated.View style={{ transform: [{ scale }] }}>
                <Ionicons
                    name={getIconName()}
                    size={size}
                    color={focused ? theme.colors.tabBarActive : theme.colors.tabBarInactive}
                />
            </Animated.View>
        );
    };

    const CustomHeaderTitle = () => (
        <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitleCine, { color: theme.colors.primary }]}>Cine</Text>
            <Text style={[styles.headerTitleShelf, { color: theme.colors.text }]}>Shelf</Text>
        </View>
    );

    const MenuButton = () => (
        <Pressable onPress={openDrawer} style={{ paddingLeft: 20 }}>
            <Ionicons name="menu" size={28} color={theme.colors.headerText} />
        </Pressable>
    );

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.colors.tabBarActive,
                tabBarInactiveTintColor: theme.colors.tabBarInactive,
                headerShown: true,
                headerStyle: {
                    backgroundColor: theme.colors.headerBackground,
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                },
                headerTitleStyle: {
                    color: theme.colors.headerText,
                    fontSize: 20,
                    fontWeight: '700',
                    fontFamily: 'System',
                },
                headerTintColor: theme.colors.headerText,
                tabBarStyle: {
                    backgroundColor: theme.colors.tabBar,
                    borderTopColor: theme.colors.border,
                    borderTopWidth: 1,
                    height: Platform.OS === 'ios' ? 85 : 75,
                    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
                    paddingTop: 8,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                    fontFamily: 'System',
                    marginTop: 4,
                },
                animation: 'shift',
                lazy: true,
                headerLeft: () => <MenuButton />,
            }}>
            <Tabs.Screen
                name="discover"
                options={{
                    title: 'Discover',
                    tabBarIcon: ({ size, focused }) => (
                        <TabIcon
                            size={size}
                            focused={focused}
                            tabName="discover"
                        />
                    ),
                    headerTitle: () => <CustomHeaderTitle />,
                }}
                listeners={{
                    tabPress: () => animateTab('discover'),
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Search',
                    tabBarIcon: ({ size, focused }) => (
                        <TabIcon
                            size={size}
                            focused={focused}
                            tabName="search"
                        />
                    ),
                    headerShown: true,
                    headerLeft: () => <MenuButton />,
                    headerTitle: 'Search'
                }}
                listeners={{
                    tabPress: () => animateTab('search'),
                }}
            />
            <Tabs.Screen
                name="watchlist"
                options={{
                    title: 'Watchlist',
                    tabBarIcon: ({ size, focused }) => (
                        <TabIcon
                            size={size}
                            focused={focused}
                            tabName="watchlist"
                        />
                    ),
                    headerShown: true,
                    headerLeft: () => <MenuButton />,
                    headerTitle: 'Watchlist'
                }}
                listeners={{
                    tabPress: () => animateTab('watchlist'),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitleCine: {
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'System',
    },
    headerTitleShelf: {
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'System',
    },
});
