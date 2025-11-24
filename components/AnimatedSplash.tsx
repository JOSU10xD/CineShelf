import { Asset } from 'expo-asset';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

interface AnimatedSplashProps {
    onFinish: () => void;
}

export const AnimatedSplash = ({ onFinish }: AnimatedSplashProps) => {
    const { theme } = useTheme();
    const [isReady, setIsReady] = useState(false);

    // Animation values
    const scale = useSharedValue(0.3);
    const opacity = useSharedValue(0);
    const containerOpacity = useSharedValue(1);

    useEffect(() => {
        const prepare = async () => {
            try {
                // Preload assets
                await Asset.fromModule(require('../assets/images/cinelogo.jpeg')).downloadAsync();
            } catch (e) {
                console.warn(e);
            } finally {
                setIsReady(true);
            }
        };

        prepare();
    }, []);

    useEffect(() => {
        if (isReady) {
            // Start animation
            opacity.value = withTiming(1, { duration: 800 });
            scale.value = withSpring(1, { damping: 12, stiffness: 100 });

            // Exit animation
            containerOpacity.value = withDelay(2000, withTiming(0, { duration: 500 }, (finished) => {
                if (finished) {
                    runOnJS(onFinish)();
                }
            }));
        }
    }, [isReady]);

    const logoStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }]
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value
    }));

    if (!isReady) return null;

    return (
        <Animated.View style={[styles.container, { backgroundColor: theme.colors.background }, containerStyle]}>
            <Animated.Image
                source={require('../assets/images/cinelogo.jpeg')}
                style={[styles.logo, logoStyle]}
                resizeMode="contain"
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
    },
    logo: {
        width: 200,
        height: 200,
    },
});
