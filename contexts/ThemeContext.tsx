import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StatusBar } from 'react-native';

export type ThemeKey = 'theme1' | 'theme2' | 'theme3' | 'theme4';

export interface Theme {
    key: ThemeKey;
    colors: {
        background: string;
        text: string;
        primary: string;
        secondary: string;
        card: string;
        border: string;
        notification: string;
        tabBar: string;
        tabBarActive: string;
        tabBarInactive: string;
        headerBackground: string;
        headerText: string;
    };
    dark: boolean;
}

export const themes: Record<ThemeKey, Theme> = {
    theme1: {
        key: 'theme1',
        dark: true,
        colors: {
            background: '#102542',
            text: '#FFFFFF',
            primary: '#F87060',
            secondary: '#CD533B',
            card: '#1A3A63',
            border: '#2A4A73',
            notification: '#F87060',
            tabBar: '#0A192F',
            tabBarActive: '#F87060',
            tabBarInactive: '#8892B0',
            headerBackground: '#0A192F',
            headerText: '#F87060',
        },
    },
    theme2: {
        key: 'theme2',
        dark: true,
        colors: {
            background: '#0A0A0A',
            text: '#FFFFFF',
            primary: '#00D4FF',
            secondary: '#0088AA',
            card: '#1A1A1A',
            border: '#333333',
            notification: '#00D4FF',
            tabBar: '#050505',
            tabBarActive: '#00D4FF',
            tabBarInactive: '#666666',
            headerBackground: '#050505',
            headerText: '#00D4FF',
        },
    },
    theme3: {
        key: 'theme3',
        dark: true,
        colors: {
            background: '#1F1C2C',
            text: '#FFFFFF',
            primary: '#928DAB',
            secondary: '#6A6580',
            card: '#2D293F',
            border: '#3E3955',
            notification: '#928DAB',
            tabBar: '#161420',
            tabBarActive: '#928DAB',
            tabBarInactive: '#555068',
            headerBackground: '#161420',
            headerText: '#928DAB',
        },
    },
    theme4: {
        key: 'theme4',
        dark: false,
        colors: {
            background: '#FCE4D8',
            text: '#2D2D2D',
            primary: '#F75590',
            secondary: '#D1346B',
            card: '#FFF0E8',
            border: '#E8C4B0',
            notification: '#F75590',
            tabBar: '#FFF8F5',
            tabBarActive: '#F75590',
            tabBarInactive: '#9E8B85',
            headerBackground: '#FFF8F5',
            headerText: '#F75590',
        },
    },
};

interface ThemeContextType {
    theme: Theme;
    setTheme: (key: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [themeKey, setThemeKey] = useState<ThemeKey>('theme2'); // Default to Theme 2 (existing style)
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const storedTheme = await AsyncStorage.getItem('@cineshelf_theme');
                if (storedTheme && Object.keys(themes).includes(storedTheme)) {
                    setThemeKey(storedTheme as ThemeKey);
                }
            } catch (error) {
                console.error('Failed to load theme', error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadTheme();
    }, []);

    const setTheme = async (key: ThemeKey) => {
        setThemeKey(key);
        try {
            await AsyncStorage.setItem('@cineshelf_theme', key);
        } catch (error) {
            console.error('Failed to save theme', error);
        }
    };

    const theme = themes[themeKey];

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            <StatusBar
                barStyle={theme.dark ? 'light-content' : 'dark-content'}
                backgroundColor={theme.colors.headerBackground}
            />
            {children}
        </ThemeContext.Provider>
    );
};
