import { Asset } from 'expo-asset';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface SplashProps {
    onFinish: () => void;
}

export const Splash = ({ onFinish }: SplashProps) => {
    const { theme } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        const loadAssets = async () => {
            try {
                // Preload only the logo
                // Assuming cinelogo.jpeg is in assets folder. If not, user needs to provide it.
                // Using require to bundle it.
                await Asset.fromModule(require('../assets/images/cinelogo.jpeg')).downloadAsync();
            } catch (e) {
                console.warn("Error loading splash asset", e);
            }
        };

        const animate = () => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // Hold for a bit
                setTimeout(() => {
                    onFinish();
                }, 500);
            });
        };

        loadAssets().then(animate);
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Animated.Image
                source={require('../assets/images/cinelogo.jpeg')}
                style={[
                    styles.logo,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
                resizeMode="contain"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    logo: {
        width: width * 0.5,
        height: width * 0.5,
    },
});
