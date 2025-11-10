import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { useApp } from '../../contexts/AppContext';
import { TMDBSearchResult } from '../../types/tmdb';

interface DraggableItem {
  item: TMDBSearchResult & { addedAt: string };
  drag: () => void;
  isActive: boolean;
}

export default function WatchlistScreen() {
  const { watchlist, removeFromWatchlist, reorderWatchlist } = useApp();
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);

  const handleRemove = (id: number, mediaType: string, title: string) => {
    Alert.alert(
      'Remove from Watchlist',
      `Are you sure you want to remove "${title}" from your watchlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removeFromWatchlist(id, mediaType)
        },
      ]
    );
  };

  const handleMoviePress = (movie: TMDBSearchResult) => {
    if (isDragging) return; // Don't navigate if we're dragging
    
    // Navigate to movie details within the watchlist tab
    router.push(`/search/movie-details?id=${movie.id}&type=${movie.media_type}`);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = ({ data }: { data: (TMDBSearchResult & { addedAt: string })[] }) => {
    setIsDragging(false);
    
    // Update the watchlist with the new order
    reorderWatchlist(data);
  };

  const renderMovie = ({ item, drag, isActive }: DraggableItem) => (
    <TouchableOpacity
      style={[styles.movieCard, isActive && styles.dragging]}
      onLongPress={drag}
      onPress={() => handleMoviePress(item)}
      delayLongPress={200}
    >
      <ImageWithFallback
        source={{ uri: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '' }}
        style={styles.poster}
        type="poster"
      />
      
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle}>{item.title || item.name}</Text>
        <Text style={styles.movieType}>
          {item.media_type === 'movie' ? 'Movie' : 'TV Series'}
        </Text>
        <Text style={styles.movieYear}>
          {item.release_date ? new Date(item.release_date).getFullYear() : 
           item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'}
        </Text>
        <Text style={styles.rating}>⭐ {item.vote_average?.toFixed(1)}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemove(item.id, item.media_type, item.title || item.name || '')}
        >
          <Ionicons name="trash-outline" size={20} color="#ff4444" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.dragHandle} 
          onPressIn={drag}
        >
          <Ionicons name="reorder-three-outline" size={24} color="#888" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (watchlist.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bookmark-outline" size={64} color="#333" />
        <Text style={styles.emptyTitle}>Your Watchlist is Empty</Text>
        <Text style={styles.emptyText}>
          Search for movies and TV shows to add them to your watchlist
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Watchlist</Text>
        <Text style={styles.subtitle}>
          {watchlist.length} {watchlist.length === 1 ? 'item' : 'items'}
        </Text>
        <Text style={styles.dragHint}>
          Long press and drag to reorder
        </Text>
      </View>

      <DraggableFlatList
        data={watchlist}
        renderItem={renderMovie}
        keyExtractor={(item) => `${item.id}-${item.media_type}`}
        onDragBegin={handleDragStart}
        onDragEnd={handleDragEnd}
        activationDistance={10}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  dragHint: {
    fontSize: 14,
    color: '#ff4444',
    marginTop: 8,
    fontStyle: 'italic',
  },
  listContent: {
    padding: 16,
  },
  movieCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
  },
  dragging: {
    backgroundColor: '#252525',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    transform: [{ scale: 1.02 }],
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 6,
  },
  movieInfo: {
    flex: 1,
    marginLeft: 12,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  movieType: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 2,
  },
  movieYear: {
    color: '#888',
    fontSize: 14,
    marginBottom: 2,
  },
  rating: {
    color: '#ffd700',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    padding: 8,
  },
  dragHandle: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 32,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});