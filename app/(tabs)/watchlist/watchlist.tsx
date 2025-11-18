import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ImageWithFallback } from '../../../components/ImageWithFallback';
import { useApp } from '../../../contexts/AppContext';
import { TMDBSearchResult } from '../../../types/tmdb';

type WatchlistItem = TMDBSearchResult & { addedAt: string };

export default function WatchlistScreen() {
  const { watchlist, removeFromWatchlist, reorderWatchlist } = useApp();
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);

  const handleRemove = useCallback((id: number, mediaType: string, title: string) => {
    Alert.alert(
      'Remove from Watchlist',
      `Remove "${title}" from your watchlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeFromWatchlist(id, mediaType);
            Alert.alert('Success', `"${title}" has been removed from your watchlist.`, [
              { text: 'OK' }
            ]);
          }
        },
      ]
    );
  }, [removeFromWatchlist]);

  const handleMoviePress = useCallback((movie: WatchlistItem) => {
    if (isDragging) return;

    router.push({
      pathname: '/watchlist/movie-details',
      params: { id: String(movie.id), type: movie.media_type }
    } as any);
  }, [isDragging, router]);

  const handleDragBegin = useCallback(() => {
    setIsDragging(true);

    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.log('Haptics not available');
      }
    }
  }, []);

  const handleDragEnd = useCallback(({ data }: { data: WatchlistItem[] }) => {
    setIsDragging(false);
    reorderWatchlist(data);

    // Success haptic feedback
    if (Platform.OS === 'ios') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.notificationAsync(
          require('expo-haptics').NotificationFeedbackType.Success
        );
      } catch (error) {
        console.log('Haptics not available');
      }
    }
  }, [reorderWatchlist]);

  const renderMovie = useCallback(({ item, drag, isActive }: RenderItemParams<WatchlistItem>) => {
    return (
      <ScaleDecorator>
        <View
          style={[
            styles.movieCard,
            isActive && styles.dragging,
          ]}
        >
          <TouchableOpacity
            style={styles.cardContent}
            onPress={() => !isActive && handleMoviePress(item)}
            activeOpacity={0.7}
            disabled={isActive}
          >
            <ImageWithFallback
              source={{ uri: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '' }}
              style={styles.poster}
              type="poster"
            />

            <View style={styles.movieInfo}>
              <Text style={styles.movieTitle} numberOfLines={2}>
                {item.title || item.name}
              </Text>
              <View style={styles.movieDetails}>
                <View style={styles.typeBadge}>
                  <Text style={styles.movieType}>
                    {item.media_type === 'movie' ? 'Movie' : 'TV Series'}
                  </Text>
                </View>
                <Text style={styles.movieYear}>
                  {item.release_date ? new Date(item.release_date).getFullYear() :
                    item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'}
                </Text>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.rating}>{item.vote_average?.toFixed(1)}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={() => handleRemove(item.id, item.media_type, item.title || item.name || '')}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              disabled={isActive}
            >
              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.dragHandle, isActive && styles.dragHandleActive]}
              onLongPress={drag}
              delayLongPress={100}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="reorder-three" 
                size={26} 
                color={isActive ? "#FFFFFF" : "#00D4FF"} 
              />
            </TouchableOpacity>
          </View>

          {isActive && (
            <View style={styles.dragOverlay}>
              <View style={styles.dragIndicatorTop} />
              <View style={styles.dragIndicatorBottom} />
            </View>
          )}
        </View>
      </ScaleDecorator>
    );
  }, [handleMoviePress, handleRemove]);

  const keyExtractor = useCallback((item: WatchlistItem) =>
    `${item.id}-${item.media_type}-${item.addedAt}`, []
  );

  if (watchlist.length === 0) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={80} color="#333" />
          <Text style={styles.emptyTitle}>Your Watchlist is Empty</Text>
          <Text style={styles.emptyText}>
            Search for movies and TV shows to add them to your watchlist
          </Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Watchlist</Text>
        <Text style={styles.subtitle}>
          {watchlist.length} {watchlist.length === 1 ? 'item' : 'items'}
        </Text>
        {!isDragging && (
          <View style={styles.hintContainer}>
            <Ionicons name="hand-left-outline" size={14} color="#00D4FF" />
            <Text style={styles.hint}>Long press the grip icon to reorder</Text>
          </View>
        )}
        {isDragging && (
          <View style={styles.draggingIndicator}>
            <View style={styles.draggingDot} />
            <Text style={styles.draggingText}>Reordering...</Text>
          </View>
        )}
      </View>

      <DraggableFlatList
        data={watchlist}
        renderItem={renderMovie}
        keyExtractor={keyExtractor}
        onDragBegin={handleDragBegin}
        onDragEnd={handleDragEnd}
        activationDistance={5}
        containerStyle={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        autoscrollThreshold={100}
        autoscrollSpeed={150}
        dragHitSlop={{ top: -10, bottom: -10, left: -10, right: -10 }}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#00D4FF',
    fontWeight: '600',
    marginBottom: 8,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  draggingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  draggingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D4FF',
  },
  draggingText: {
    fontSize: 14,
    color: '#00D4FF',
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  movieCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#252525',
    overflow: 'hidden',
  },
  dragging: {
    backgroundColor: '#252525',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 20,
    borderColor: '#00D4FF',
    borderWidth: 2,
    opacity: 0.98,
  },
  dragOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  dragIndicatorTop: {
    height: 3,
    backgroundColor: '#00D4FF',
    width: '100%',
  },
  dragIndicatorBottom: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: '#00D4FF',
    width: '100%',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    flex: 1,
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#252525',
  },
  movieInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  movieTitle: {
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  movieType: {
    color: '#00D4FF',
    fontSize: 12,
    fontWeight: '600',
  },
  movieYear: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    gap: 4,
  },
  rating: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 16,
  },
  actionButton: {
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  dragHandle: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    paddingHorizontal: 8,
  },
  dragHandleActive: {
    backgroundColor: '#00D4FF',
    borderColor: '#00D4FF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    padding: 40,
    paddingBottom: 100,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
});