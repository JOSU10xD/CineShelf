import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  scrollTo,
  SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ImageWithFallback } from '../../../components/ImageWithFallback';
import { useApp } from '../../../contexts/AppContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { TMDBSearchResult } from '../../../types/tmdb';

// --- Constants & Types ---

type WatchlistItem = TMDBSearchResult & { addedAt: string };

const CARD_HEIGHT = 130;
const MARGIN_BOTTOM = 12;
const ITEM_HEIGHT = CARD_HEIGHT + MARGIN_BOTTOM;

// Auto-scroll configuration
const AUTO_SCROLL_ZONE = 150; // Distance from top/bottom edge to trigger auto-scroll
const AUTO_SCROLL_SPEED = 3; // Pixels per frame (moderate speed)
const LONG_PRESS_DELAY = 200;
const SPRING_CONFIG = { damping: 20, stiffness: 150 };

// Helper to generate a stable ID
const getItemId = (item: WatchlistItem) => `${item.id}-${item.media_type}-${item.addedAt}`;

// --- Components ---

export default function WatchlistScreen() {
  const { watchlist, removeFromWatchlist, reorderWatchlist } = useApp();
  const { theme } = useTheme();
  const router = useRouter();
  const [dragMode, setDragMode] = useState(false);

  // Provide safe fallbacks for optional theme color keys (TS types may not include warning/error)
  const themeColorsAny = (theme.colors as any) ?? {};
  const WARNING_COLOR = themeColorsAny.warning ?? '#FFD700';
  const ERROR_COLOR = themeColorsAny.error ?? '#FF6B6B';

  // Local copy for optimistic updates
  const [localItems, setLocalItems] = useState<WatchlistItem[]>(watchlist);

  useEffect(() => {
    setLocalItems(watchlist);
  }, [watchlist]);

  // Shared values
  const scrollY = useSharedValue(0);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const positions = useSharedValue<Record<string, number>>({});
  const containerHeight = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const shouldAutoScroll = useSharedValue(false);
  const autoScrollDirection = useSharedValue(0); // -1 for up, 1 for down, 0 for none
  const activeDropIndex = useSharedValue(-1);

  // Initialize positions
  useEffect(() => {
    const newPositions: Record<string, number> = {};
    localItems.forEach((item, index) => {
      newPositions[getItemId(item)] = index;
    });
    positions.value = newPositions;
    contentHeight.value = localItems.length * ITEM_HEIGHT;
  }, [localItems, positions, contentHeight]);

  // Auto-scroll loop - this scrolls the list
  useFrameCallback(() => {
    if (shouldAutoScroll.value && isDragging.value && autoScrollDirection.value !== 0) {
      const targetScroll = scrollY.value + (autoScrollDirection.value * AUTO_SCROLL_SPEED);
      const maxScroll = Math.max(0, contentHeight.value - containerHeight.value);
      const clampedScroll = Math.max(0, Math.min(maxScroll, targetScroll));

      if (Math.abs(scrollY.value - clampedScroll) > 0.1) {
        scrollTo(scrollViewRef, 0, clampedScroll, false);
      } else {
        // Reached the end, stop auto-scrolling
        shouldAutoScroll.value = false;
        autoScrollDirection.value = 0;
      }
    }
  });

  const handleRemove = useCallback(
    (id: number, mediaType: string) => {
      removeFromWatchlist(id, mediaType);
    },
    [removeFromWatchlist]
  );

  const handleMoviePress = useCallback(
    (movie: WatchlistItem) => {
      if (isDragging.value) return;
      router.push({
        pathname: '/watchlist/movie-details',
        params: { id: String(movie.id), type: movie.media_type },
      } as any);
    },
    [router, isDragging]
  );

  const handleReorderComplete = useCallback((finalPositions: Record<string, number>) => {
    const newOrder = [...localItems].sort((a, b) => {
      const indexA = finalPositions[getItemId(a)];
      const indexB = finalPositions[getItemId(b)];
      return indexA - indexB;
    });
    setLocalItems(newOrder);
    reorderWatchlist(newOrder);
  }, [localItems, reorderWatchlist]);

  const triggerHapticStart = useCallback(() => {
    try {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      // Ignore haptic errors
    }
  }, []);

  const triggerHapticMove = useCallback(() => {
    try {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Ignore haptic errors
    }
  }, []);

  const triggerHapticEnd = useCallback(() => {
    try {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      // Ignore haptic errors
    }
  }, []);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
    containerHeight.value = event.layoutMeasurement.height;
  });

  // Placeholder style
  const placeholderStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      top: withSpring(activeDropIndex.value * ITEM_HEIGHT, SPRING_CONFIG),
      left: 16,
      right: 16,
      height: CARD_HEIGHT,
      backgroundColor: theme.colors.primary + '10', // 10% opacity via 8-digit hex
      borderColor: theme.colors.primary + '30', // 30% opacity
      borderWidth: 1,
      borderRadius: 16,
      borderStyle: 'dashed',
      opacity: activeDropIndex.value >= 0 ? withTiming(1) : withTiming(0),
      zIndex: -1,
    };
  });

  if (!watchlist || watchlist.length === 0) {
    return (
      <GestureHandlerRootView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={80} color={theme.colors.border} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Your Watchlist is Empty</Text>
          <Text style={[styles.emptyText, { color: theme.colors.secondary }]}>
            Search for movies and TV shows to add them to your watchlist
          </Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text }]}>My Watchlist</Text>
          <Text style={[styles.subtitle, { color: theme.colors.primary }]}>
            {watchlist.length} {watchlist.length === 1 ? 'item' : 'items'}
            {dragMode && ' • Drag to reorder'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.dragModeButton,
            {
              backgroundColor: dragMode ? theme.colors.primary : (theme.dark ? 'rgba(0,0,0,0)' : theme.colors.card),
              borderColor: theme.colors.primary
            }
          ]}
          onPress={() => setDragMode(!dragMode)}
        >
          <Ionicons
            name={dragMode ? 'checkmark' : 'move'}
            size={20}
            color={dragMode ? theme.colors.background : theme.colors.primary}
          />
          <Text style={[styles.dragModeText, { color: dragMode ? theme.colors.background : theme.colors.primary }]}>
            {dragMode ? 'Done' : 'Reorder'}
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        ref={scrollViewRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { height: Math.max(localItems.length * ITEM_HEIGHT + 120, Dimensions.get('window').height) }
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDragging.value}
      >
        {/* Visual Placeholder */}
        <Animated.View style={placeholderStyle} />

        {localItems.map((item) => (
          <SortableItem
            key={getItemId(item)}
            item={item}
            positions={positions}
            scrollY={scrollY}
            containerHeight={containerHeight}
            itemsCount={localItems.length}
            dragMode={dragMode}
            onPress={handleMoviePress}
            onRemove={handleRemove}
            onReorderComplete={handleReorderComplete}
            globalIsDragging={isDragging}
            shouldAutoScroll={shouldAutoScroll}
            autoScrollDirection={autoScrollDirection}
            activeDropIndex={activeDropIndex}
            onHapticStart={triggerHapticStart}
            onHapticMove={triggerHapticMove}
            onHapticEnd={triggerHapticEnd}
            // pass down fallback colors in case child uses them (keeps behavior identical)
          />
        ))}
      </Animated.ScrollView>
    </GestureHandlerRootView>
  );
}

// --- Sortable Item Component ---

interface SortableItemProps {
  item: WatchlistItem;
  positions: SharedValue<Record<string, number>>;
  scrollY: SharedValue<number>;
  containerHeight: SharedValue<number>;
  itemsCount: number;
  dragMode: boolean;
  onPress: (item: WatchlistItem) => void;
  onRemove: (id: number, mediaType: string) => void;
  onReorderComplete: (positions: Record<string, number>) => void;
  globalIsDragging: SharedValue<boolean>;
  shouldAutoScroll: SharedValue<boolean>;
  autoScrollDirection: SharedValue<number>;
  activeDropIndex: SharedValue<number>;
  onHapticStart: () => void;
  onHapticMove: () => void;
  onHapticEnd: () => void;
}

function SortableItem({
  item,
  positions,
  scrollY,
  containerHeight,
  itemsCount,
  dragMode,
  onPress,
  onRemove,
  onReorderComplete,
  globalIsDragging,
  shouldAutoScroll,
  autoScrollDirection,
  activeDropIndex,
  onHapticStart,
  onHapticMove,
  onHapticEnd,
}: SortableItemProps) {
  const { theme } = useTheme();
  const themeColorsAny = (theme.colors as any) ?? {};
  const WARNING_COLOR = themeColorsAny.warning ?? '#FFD700';
  const ERROR_COLOR = themeColorsAny.error ?? '#FF6B6B';

  const id = getItemId(item);
  const isDragging = useSharedValue(false);
  const zIndex = useSharedValue(0);
  const scale = useSharedValue(1);

  const dragTranslationY = useSharedValue(0);
  const startTop = useSharedValue(0);
  const lastSwapIndex = useSharedValue(-1);
  const autoScrollAccumulator = useSharedValue(0); // Tracks auto-scroll movement

  // Derived top position
  const top = useDerivedValue(() => {
    if (isDragging.value) {
      // During drag, position = initial position + manual drag + auto-scroll compensation
      return startTop.value + dragTranslationY.value + autoScrollAccumulator.value;
    }
    const index = positions.value[id];
    if (typeof index !== 'number') return 0;
    return withSpring(index * ITEM_HEIGHT, SPRING_CONFIG);
  }, [positions, id]);

  // Frame callback to update dragged card position during auto-scroll
  useFrameCallback(() => {
    if (isDragging.value && shouldAutoScroll.value && autoScrollDirection.value !== 0) {
      // Move the dragged card in the opposite direction of scroll
      // This makes it appear to move through the list
      autoScrollAccumulator.value += autoScrollDirection.value * AUTO_SCROLL_SPEED;

      // Calculate the current absolute position
      const currentAbsoluteY = startTop.value + dragTranslationY.value + autoScrollAccumulator.value;
      const centerOffset = currentAbsoluteY + CARD_HEIGHT / 2;
      const newIndex = Math.floor(centerOffset / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(itemsCount - 1, newIndex));

      // Update visual placeholder
      activeDropIndex.value = clampedIndex;

      const oldIndex = positions.value[id];

      if (clampedIndex !== oldIndex) {
        const newPositions = { ...positions.value };

        for (const key in newPositions) {
          const currentIndex = newPositions[key];

          if (key === id) {
            newPositions[key] = clampedIndex;
            continue;
          }

          if (oldIndex < clampedIndex) {
            if (currentIndex > oldIndex && currentIndex <= clampedIndex) {
              newPositions[key] = currentIndex - 1;
            }
          } else {
            if (currentIndex >= clampedIndex && currentIndex < oldIndex) {
              newPositions[key] = currentIndex + 1;
            }
          }
        }

        positions.value = newPositions;

        if (clampedIndex !== lastSwapIndex.value) {
          runOnJS(onHapticMove)();
          lastSwapIndex.value = clampedIndex;
        }
      }

      // Check if we've reached the end
      if (clampedIndex === 0 && autoScrollDirection.value === -1) {
        // Reached top
        shouldAutoScroll.value = false;
        autoScrollDirection.value = 0;
      } else if (clampedIndex === itemsCount - 1 && autoScrollDirection.value === 1) {
        // Reached bottom
        shouldAutoScroll.value = false;
        autoScrollDirection.value = 0;
      }
    }
  });

  const panGesture = Gesture.Pan()
    .enabled(dragMode)
    .activateAfterLongPress(LONG_PRESS_DELAY)
    .onStart(() => {
      const currentPos = positions.value[id];
      if (typeof currentPos !== 'number') return;

      isDragging.value = true;
      globalIsDragging.value = true;
      zIndex.value = 100;
      scale.value = withSpring(1.05, SPRING_CONFIG);

      startTop.value = currentPos * ITEM_HEIGHT;
      dragTranslationY.value = 0;
      autoScrollAccumulator.value = 0;
      activeDropIndex.value = currentPos;
      lastSwapIndex.value = currentPos;

      runOnJS(onHapticStart)();
    })
    .onUpdate((event) => {
      if (!isDragging.value) return;

      dragTranslationY.value = event.translationY;

      // Calculate current position including auto-scroll offset
      const currentAbsoluteY = startTop.value + event.translationY + autoScrollAccumulator.value;
      const centerOffset = currentAbsoluteY + CARD_HEIGHT / 2;
      const newIndex = Math.floor(centerOffset / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(itemsCount - 1, newIndex));

      // Update visual placeholder
      activeDropIndex.value = clampedIndex;

      const oldIndex = positions.value[id];

      if (clampedIndex !== oldIndex) {
        const newPositions = { ...positions.value };

        for (const key in newPositions) {
          const currentIndex = newPositions[key];

          if (key === id) {
            newPositions[key] = clampedIndex;
            continue;
          }

          if (oldIndex < clampedIndex) {
            if (currentIndex > oldIndex && currentIndex <= clampedIndex) {
              newPositions[key] = currentIndex - 1;
            }
          } else {
            if (currentIndex >= clampedIndex && currentIndex < oldIndex) {
              newPositions[key] = currentIndex + 1;
            }
          }
        }

        positions.value = newPositions;

        if (clampedIndex !== lastSwapIndex.value) {
          runOnJS(onHapticMove)();
          lastSwapIndex.value = clampedIndex;
        }
      }

      // Auto-scroll logic based on screen position
      const screenY = currentAbsoluteY - scrollY.value;

      if (screenY < AUTO_SCROLL_ZONE && clampedIndex > 0) {
        // Near top - scroll up
        shouldAutoScroll.value = true;
        autoScrollDirection.value = -1;
      } else if (screenY > containerHeight.value - AUTO_SCROLL_ZONE && clampedIndex < itemsCount - 1) {
        // Near bottom - scroll down
        shouldAutoScroll.value = true;
        autoScrollDirection.value = 1;
      } else {
        // In middle zone - stop auto-scrolling
        shouldAutoScroll.value = false;
        autoScrollDirection.value = 0;
      }
    })
    .onFinalize(() => {
      if (!isDragging.value) return;

      isDragging.value = false;
      globalIsDragging.value = false;
      shouldAutoScroll.value = false;
      autoScrollDirection.value = 0;
      activeDropIndex.value = -1;
      zIndex.value = 0;
      scale.value = withSpring(1, SPRING_CONFIG);
      dragTranslationY.value = 0;
      autoScrollAccumulator.value = 0;
      lastSwapIndex.value = -1;

      runOnJS(onHapticEnd)();
      runOnJS(onReorderComplete)(positions.value);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      top: top.value,
      left: 0,
      right: 0,
      height: CARD_HEIGHT,
      zIndex: zIndex.value,
      transform: [{ scale: scale.value }],
    };
  });

  const cardStyle = useAnimatedStyle(() => {
    return {
      borderColor: isDragging.value ? theme.colors.primary : theme.colors.border,
      borderWidth: isDragging.value ? 2 : 1,
      backgroundColor: isDragging.value ? theme.colors.card : theme.colors.card,
      shadowOpacity: withSpring(isDragging.value ? 0.6 : 0.3),
      shadowRadius: withSpring(isDragging.value ? 20 : 6),
      elevation: isDragging.value ? 8 : 3,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Animated.View style={[styles.movieCard, cardStyle]}>
        <Pressable
          onPress={() => onPress(item)}
          style={({ pressed }) => [
            styles.cardContent,
            pressed && !dragMode ? { opacity: 0.7 } : null,
          ]}
          disabled={dragMode}
        >
          <ImageWithFallback
            source={{
              uri: item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : '',
            }}
            style={[styles.poster, { backgroundColor: theme.colors.card }]}
            type="poster"
          />

          <View style={styles.movieInfo}>
            <Text style={[styles.movieTitle, { color: theme.colors.text }]} numberOfLines={2}>
              {item.title || item.name}
            </Text>

            <View style={styles.movieDetails}>
              <View style={[styles.typeBadge, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
                <Text style={[styles.movieType, { color: theme.colors.primary }]}>
                  {item.media_type === 'movie' ? 'Movie' : 'TV Series'}
                </Text>
              </View>

              <Text style={[styles.movieYear, { color: theme.colors.secondary }]}>
                {item.release_date
                  ? new Date(item.release_date).getFullYear()
                  : item.first_air_date
                    ? new Date(item.first_air_date).getFullYear()
                    : 'N/A'}
              </Text>

              <View style={[styles.ratingBadge, { backgroundColor: WARNING_COLOR + '10', borderColor: WARNING_COLOR + '30' }]}>
                <Ionicons name="star" size={12} color={WARNING_COLOR} />
                <Text style={[styles.rating, { color: WARNING_COLOR }]}>
                  {item.vote_average?.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>

        <View style={styles.actions}>
          {dragMode ? (
            <GestureDetector gesture={panGesture}>
              <View style={[styles.dragHandle, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
                <Ionicons name="reorder-three" size={28} color={theme.colors.primary} />
              </View>
            </GestureDetector>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={() => onRemove(item.id, item.media_type)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Remove from watchlist"
            >
              <Ionicons name="trash-outline" size={20} color={ERROR_COLOR} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor applied inline via theme
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  dragModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  dragModeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  movieCard: {
    borderRadius: 16,
    height: CARD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 10,
  },
  movieInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  movieTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  movieDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  movieType: {
    fontSize: 12,
    fontWeight: '600',
  },
  movieYear: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
    marginLeft: 8,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  actionButton: {
    padding: 10,
    borderRadius: 8,
  },
  removeButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 12,
  },
  dragHandle: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
});
