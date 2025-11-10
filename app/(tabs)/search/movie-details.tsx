import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { TMDBMovie, TMDBSearchResult } from '../../../../types/tmdb';
import { ImageWithFallback } from '../../../components/ImageWithFallback';
import { useApp } from '../../../contexts/AppContext';
import { tmdbService } from '../../../services/tmdb';

const { width } = Dimensions.get('window');

export default function MovieDetails() {
  const { id, type } = useLocalSearchParams();
  const router = useRouter();
  const [movie, setMovie] = useState<TMDBMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToWatchlist, removeFromWatchlist, watchlist } = useApp();

  useEffect(() => {
    loadMovieDetails();
  }, [id, type]);

  const loadMovieDetails = async () => {
    try {
      setLoading(true);
      const movieId = Array.isArray(id) ? id[0] : id;
      const mediaType = Array.isArray(type) ? type[0] : type || 'movie';
      const details = await tmdbService.getMovieDetails(movieId, mediaType);
      setMovie(details as TMDBMovie);
    } catch (error) {
      console.error('Error loading movie details:', error);
    } finally {
      setLoading(false);
    }
  };

  const isInWatchlist = movie ? watchlist.some(
    item => item.id === movie.id && item.media_type === (movie.media_type || 'movie')
  ) : false;

  const handleWatchlistToggle = () => {
    if (!movie) return;
    
    const movieData: TMDBSearchResult = {
      id: movie.id,
      title: movie.title || movie.name || '',
      poster_path: movie.poster_path,
      media_type: movie.media_type || 'movie',
      release_date: movie.release_date || movie.first_air_date,
      vote_average: movie.vote_average,
    };

    if (isInWatchlist) {
      removeFromWatchlist(movie.id, movie.media_type || 'movie');
    } else {
      addToWatchlist(movieData);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff4444" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Movie not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.posterContainer}>
          <ImageWithFallback
            source={{ uri: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '' }}
            style={styles.poster}
            type="poster"
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{movie.title || movie.name}</Text>
          
          <View style={styles.metaInfo}>
            <Text style={styles.year}>
              {movie.release_date ? new Date(movie.release_date).getFullYear() : 
               movie.first_air_date ? new Date(movie.first_air_date).getFullYear() : 'N/A'}
            </Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.runtime}>
              {movie.runtime ? `${movie.runtime} min` : 
               movie.episode_run_time?.[0] ? `${movie.episode_run_time[0]} min` : 'N/A'}
            </Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.rating}>
              ⭐ {movie.vote_average?.toFixed(1)}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.watchlistButton, isInWatchlist && styles.inWatchlist]}
            onPress={handleWatchlistToggle}
          >
            <Ionicons
              name={isInWatchlist ? "bookmark" : "bookmark-outline"}
              size={20}
              color="#fff"
            />
            <Text style={styles.watchlistText}>
              {isInWatchlist ? 'Added to Watchlist' : 'Add to Watchlist'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.overview}>{movie.overview}</Text>

          {movie.genres && movie.genres.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Genres</Text>
              <View style={styles.genres}>
                {movie.genres.map((genre) => (
                  <View key={genre.id} style={styles.genre}>
                    <Text style={styles.genreText}>{genre.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {movie.credits?.cast && movie.credits.cast.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cast</Text>
              <FlatList
                horizontal
                data={movie.credits.cast.slice(0, 10)}
                renderItem={({ item }) => (
                  <View style={styles.castMember}>
                    <ImageWithFallback
                      source={{ uri: item.profile_path ? `https://image.tmdb.org/t/p/w200${item.profile_path}` : '' }}
                      style={styles.castImage}
                      type="cast"
                    />
                    <Text style={styles.castName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.castCharacter} numberOfLines={1}>
                      {item.character}
                    </Text>
                  </View>
                )}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          {movie.images?.backdrops && movie.images.backdrops.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Images</Text>
              <FlatList
                horizontal
                data={movie.images.backdrops.slice(0, 5)}
                renderItem={({ item }) => (
                  <ImageWithFallback
                    source={{ uri: `https://image.tmdb.org/t/p/w500${item.file_path}` }}
                    style={styles.backdropImage}
                    type="backdrop"
                  />
                )}
                keyExtractor={(item, index) => index.toString()}
                showsHorizontalScrollIndicator={false}
              />
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  posterContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  poster: {
    width: width * 0.6,
    height: width * 0.9,
    borderRadius: 12,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  year: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
  },
  dot: {
    color: '#888',
    marginHorizontal: 8,
  },
  runtime: {
    color: '#888',
    fontSize: 16,
  },
  rating: {
    color: '#ffd700',
    fontSize: 16,
    fontWeight: '600',
  },
  watchlistButton: {
    flexDirection: 'row',
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  inWatchlist: {
    backgroundColor: '#333',
  },
  watchlistText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  overview: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 25,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  genres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  genre: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  genreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  castMember: {
    marginRight: 16,
    alignItems: 'center',
    width: 80,
  },
  castImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  castName: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  castCharacter: {
    color: '#888',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  backdropImage: {
    width: 280,
    height: 160,
    borderRadius: 8,
    marginRight: 12,
  },
});