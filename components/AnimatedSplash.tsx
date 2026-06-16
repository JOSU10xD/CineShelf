import { Asset } from 'expo-asset';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Loader from './Loader';
import CinemaLoadingInsights from './CinemaLoadingInsights';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface AnimatedSplashProps {
    ready: boolean;
    onFinish: () => void;
}

export const AnimatedSplash = ({ ready, onFinish }: AnimatedSplashProps) => {
    const [isReady, setIsReady] = useState(false);

    // Animation values
    const logoScale = useSharedValue(0.5);
    const logoOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(20);
    const textOpacity = useSharedValue(0);
    const containerOpacity = useSharedValue(1);

    useEffect(() => {
        const prepare = async () => {
            try {
                // Preload assets
                await Promise.all([
                    Asset.fromModule(require('../assets/images/cineshelf.png')).downloadAsync(),
                    Asset.fromModule(require('../assets/images/cineshelftxt.png')).downloadAsync(),
                ]);
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
            // Animate Logo
            logoOpacity.value = withTiming(1, { duration: 1000 });
            logoScale.value = withSpring(1.0, { damping: 15, stiffness: 90 });

            // Animate Text after logo starts
            textOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
            textTranslateY.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 90 }));
        }
    }, [isReady, logoOpacity, logoScale, textOpacity, textTranslateY]);

    useEffect(() => {
        if (isReady && ready) {
            // Smooth exit animation
            containerOpacity.value = withDelay(1200, withTiming(0, { duration: 600 }, (finished) => {
                if (finished) {
                    runOnJS(onFinish)();
                }
            }));
        }
    }, [isReady, ready, containerOpacity, onFinish]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value
    }));

    const logoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ scale: logoScale.value }]
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textTranslateY.value }]
    }));

    if (!isReady) return null;

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <View style={styles.content}>
                <Animated.Image
                    source={require('../assets/images/cineshelf.png')}
                    style={[styles.logo, logoStyle]}
                    resizeMode="contain"
                />
                <Animated.Image
                    source={require('../assets/images/cineshelftxt.png')}
                    style={[styles.textLogo, textStyle]}
                    resizeMode="contain"
                />
                <Animated.View style={[styles.loaderContainer, textStyle]}>
                    <Loader />
                    <CinemaLoadingInsights />
                </Animated.View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0A0A0A', // Deep dark professional startup state
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
    },
    content: {
        alignItems: 'center',
        gap: 16,
    },
    logo: {
        width: 140,
        height: 140,
    },
    textLogo: {
        width: 180,
        height: 45,
    },
    loaderContainer: {
        marginTop: 20,
        alignItems: 'center',
        width: '100%',
    },
});
