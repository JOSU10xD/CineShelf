import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

export interface Insight {
  id: string;
  category: string;
  title?: string;
  body: string;
}

interface CinemaLoadingInsightsProps {
  insights?: Insight[];
}

const DEFAULT_INSIGHTS: Insight[] = [
  {
    id: '1',
    category: 'Almost Cast',
    body: 'Al Pacino was offered the role of Han Solo in Star Wars, but turned it down because he did not understand the script.',
  },
  {
    id: '2',
    category: 'Critic Note',
    body: 'Citizen Kane did not win Best Picture in 1941. It was booed at the Oscars and lost to How Green Was My Valley.',
  },
  {
    id: '3',
    category: 'Movie Myth',
    body: 'The famous line "Play it again, Sam" is never actually spoken in Casablanca. Ilsa says, "Play it once, Sam."',
  },
  {
    id: '4',
    category: 'Film Wisdom',
    body: 'Cinema is a matter of what is in the frame and what is out. — Martin Scorsese',
  },
  {
    id: '5',
    category: 'Cinema Note',
    body: 'The green digital code in The Matrix is actually made of sushi recipes scanned from a Japanese cookbook.',
  },
  {
    id: '6',
    category: 'Almost Cast',
    body: 'John Travolta was the first choice to play Forrest Gump, a decision he later admitted was a mistake to decline.',
  },
  {
    id: '7',
    category: 'Film Wisdom',
    body: 'If it can be written, or thought, it can be filmed. — Stanley Kubrick',
  },
  {
    id: '8',
    category: 'Movie Myth',
    body: 'The blood in the famous Psycho shower scene was actually Bosco Chocolate Syrup.',
  },
];

export default function CinemaLoadingInsights({ insights = DEFAULT_INSIGHTS }: CinemaLoadingInsightsProps) {
  const { theme } = useTheme();

  // Safeguard: Ensure we have insights
  const data = insights.length > 0 ? insights : DEFAULT_INSIGHTS;

  // Choose a random starting index
  const getRandomIndex = useCallback(() => {
    return Math.floor(Math.random() * data.length);
  }, [data.length]);

  const [currentIndex, setCurrentIndex] = useState(getRandomIndex);
  
  // Keep track of the active index in a ref to avoid outdated interval state
  const indexRef = useRef(currentIndex);
  indexRef.current = currentIndex;

  // Reanimated shared values for smooth slide + fade transitions
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  const getNextIndex = useCallback(() => {
    if (data.length <= 1) return 0;
    
    let nextIndex = Math.floor(Math.random() * data.length);
    // Never show the same card twice consecutively
    while (nextIndex === indexRef.current) {
      nextIndex = Math.floor(Math.random() * data.length);
    }
    return nextIndex;
  }, [data.length]);

  // Transition animation to rotate insight cards
  const rotateInsight = useCallback(() => {
    // 1. Slide up and fade out the current card
    opacity.value = withTiming(0, { duration: 400 });
    translateY.value = withTiming(-12, { duration: 400 }, (finished) => {
      if (finished) {
        // 2. Select the next card index and set it
        const nextIndex = getNextIndex();
        runOnJS(setCurrentIndex)(nextIndex);

        // 3. Reset position below the card boundary
        translateY.value = 12;

        // 4. Slide up to center and fade in
        opacity.value = withTiming(1, { duration: 400 });
        translateY.value = withTiming(0, { duration: 400 });
      }
    });
  }, [getNextIndex, opacity, translateY]);

  useEffect(() => {
    // Rotate every 4 seconds
    const interval = setInterval(() => {
      rotateInsight();
    }, 4000);

    return () => {
      clearInterval(interval);
    };
  }, [rotateInsight]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  const activeInsight = data[currentIndex];

  if (!activeInsight) return null;

  return (
    <View style={[styles.cardContainer, { borderColor: theme.colors.border }]}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Text style={[styles.categoryLabel, { color: theme.colors.primary }]}>
          {activeInsight.category.toUpperCase()}
        </Text>
        <Text style={[styles.bodyText, { color: theme.colors.text }]} numberOfLines={3}>
          {activeInsight.body}
        </Text>
        <Text style={[styles.footerText, { color: theme.colors.secondary }]}>
          Refreshing your collection...
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    minHeight: 150,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)', // Subtle transparent glassmorphism tint
    marginTop: 28,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  card: {
    width: '100%',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 12,
    fontFamily: 'System',
    textAlign: 'center',
  },
  bodyText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'System',
  },
  footerText: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.6,
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
});
