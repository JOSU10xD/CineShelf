import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ToastProps {
    visible: boolean;
    message: string;
    onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({ visible, message, onHide }) => {
    const { theme } = useTheme();
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.delay(2000),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => onHide());
        }
    }, [visible, onHide, opacity]);

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.toast,
                {
                    opacity,
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border
                }
            ]}
            pointerEvents="none"
        >
            <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
            <Text style={[styles.toastText, { color: theme.colors.text }]}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 1,
        gap: 10,
        zIndex: 1000,
    },
    toastText: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'System',
    },
});
