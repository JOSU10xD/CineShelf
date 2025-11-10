// app/(tabs)/index.tsx
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { TMDBSearchResult } from '../../../types/tmdb';

export default function HomeScreen() {
  const { watchlist } = useApp();

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>CineShelf</Text>
          <Text style={styles.subtitle}>Your Movie Wishlist</Text>
        </View>
        
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{watchlist.length}</Text>
            <Text style={styles.statLabel}>Movies in Watchlist</Text>
          </View>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recently Added</Text>
          {watchlist.slice(0, 3).map((movie: TMDBSearchResult & { addedAt: string }, index: number) => (
            <View key={`${movie.id}-${movie.media_type}`} style={styles.recentItem}>
              <Text style={styles.movieTitle}>{movie.title || movie.name}</Text>
              <Text style={styles.movieType}>
                {movie.media_type === 'movie' ? 'Movie' : 'TV Show'}
              </Text>
            </View>
          ))}
          {watchlist.length === 0 && (
            <Text style={styles.emptyText}>No movies in your watchlist yet</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff4444',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 5,
  },
  stats: {
    padding: 20,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 16,
    color: '#888',
  },
  recentSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  recentItem: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  movieType: {
    fontSize: 14,
    color: '#ff4444',
    marginTop: 5,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});