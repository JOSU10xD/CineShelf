import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';

type TabName = 'discover' | 'search' | 'watchlist';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function TabLayout() {
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
          useNativeDriver: false,
        }).start();
      }
    });

    // Animate active tab
    Animated.timing(animatedValues[tabName], {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
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
          color={focused ? '#00D4FF' : '#888'}
        />
      </Animated.View>
    );
  };

  const CustomHeaderTitle = () => (
    <View style={styles.headerTitleContainer}>
      <Text style={styles.headerTitleCine}>Cine</Text>
      <Text style={styles.headerTitleShelf}>Shelf</Text>
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#00D4FF',
        tabBarInactiveTintColor: '#888',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#0A0A0A',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#1A1A1A',
        },
        headerTitleStyle: {
          color: '#FFFFFF',
          fontSize: 20,
          fontWeight: '700',
          fontFamily: 'System',
        },
        headerTintColor: '#00D4FF',
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopColor: '#1A1A1A',
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
      }}>
      <Tabs.Screen
        name="index"
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
          headerShown: false,
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
          headerShown: false,
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
    color: '#00D4FF',
    fontFamily: 'System',
  },
  headerTitleShelf: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  tabButton: {
    flex: 1,
    position: 'relative',
  },
  tabBackground: {
    position: 'absolute',
    top: 4,
    left: 8,
    right: 8,
    bottom: Platform.OS === 'ios' ? 25 : 10,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  tabTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});