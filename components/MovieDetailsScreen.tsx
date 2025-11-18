import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { tmdbService } from '../services/tmdb';
import { TMDBMovie, TMDBSearchResult } from '../types/tmdb';
import { ImageWithFallback } from './ImageWithFallback';

const { width } = Dimensions.get('window');

interface Props {
  movieId: string;
  mediaType?: string;
  onBack?: () => void;
}

const MovieDetailsScreenComponent: React.FC<Props> = ({ movieId, mediaType = 'movie', onBack }) => {
  const [movie, setMovie] = useState<TMDBMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToWatchlist, removeFromWatchlist, watchlist } = useApp();
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const loadMovieDetails = useCallback(async () => {
    try {
      setLoading(true);
      const details = await tmdbService.getMovieDetails(movieId, mediaType);
      setMovie(details as TMDBMovie);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error loading movie details:', error);
    } finally {
      setLoading(false);
    }
  }, [movieId, mediaType]);

  useEffect(() => {
    loadMovieDetails();
  }, [loadMovieDetails]);

  useEffect(() => {
    if (movie) {
      setIsInWatchlist(
        watchlist.some(item => item.id === movie.id && item.media_type === (movie.media_type || mediaType))
      );
    }
  }, [watchlist, movie, mediaType]);

  const handleWatchlistToggle = useCallback(() => {
    if (!movie) return;

    const movieData: TMDBSearchResult = {
      id: movie.id,
      title: movie.title || movie.name || '',
      name: movie.name,
      poster_path: movie.poster_path,
      media_type: movie.media_type || (mediaType as 'movie' | 'tv'),
      release_date: movie.release_date || movie.first_air_date,
      vote_average: movie.vote_average,
    };

    if (isInWatchlist) {
      removeFromWatchlist(movie.id, movieData.media_type);
    } else {
      addToWatchlist(movieData);
    }
  }, [movie, isInWatchlist, removeFromWatchlist, addToWatchlist, mediaType]);

  const CastMember = memo(({ item }: { item: any }) => (
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
  ));

  const GenreItem = memo(({ genre }: { genre: any }) => (
    <View style={styles.genre}>
      <Text style={styles.genreText}>{genre.name}</Text>
    </View>
  ));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D4FF" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Movie not found</Text>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.backText}>Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {onBack && (
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
            activeOpacity={0.8}
          >
            <Ionicons
              name={isInWatchlist ? "bookmark" : "bookmark-outline"}
              size={20}
              color="#fff"
            />
            <Text style={styles.watchlistText}>
              {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.overview}>{movie.overview}</Text>

          {movie.genres && movie.genres.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Genres</Text>
              <View style={styles.genres}>
                {movie.genres.map((genre) => (
                  <GenreItem key={genre.id} genre={genre} />
                ))}
              </View>
            </View>
          )}

          {movie.credits?.cast && movie.credits.cast.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cast</Text>
              <FlatList
                horizontal
                data={movie.credits.cast.slice(0, 12)}
                renderItem={({ item }) => <CastMember item={item} />}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                initialNumToRender={6}
                maxToRenderPerBatch={8}
                windowSize={5}
              />
            </View>
          )}

          {movie.images?.backdrops && movie.images.backdrops.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gallery</Text>
              <FlatList
                horizontal
                data={movie.images.backdrops.slice(0, 6)}
                renderItem={({ item }) => (
                  <ImageWithFallback
                    source={{ uri: `https://image.tmdb.org/t/p/w500${item.file_path}` }}
                    style={styles.backdropImage}
                    type="backdrop"
                  />
                )}
                keyExtractor={(item, index) => index.toString()}
                showsHorizontalScrollIndicator={false}
                initialNumToRender={3}
                maxToRenderPerBatch={4}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export const MovieDetailsScreen = memo(MovieDetailsScreenComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
    fontFamily: 'System',
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
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
    fontFamily: 'System',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  posterContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  poster: {
    width: width * 0.55,
    height: width * 0.82,
    borderRadius: 16,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    padding: 24,
    paddingTop: 0,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'System',
    lineHeight: 38,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  year: {
    color: '#00D4FF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  dot: {
    color: '#666',
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  runtime: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
  },
  rating: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  watchlistButton: {
    flexDirection: 'row',
    backgroundColor: '#00D4FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    alignSelf: 'stretch',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  inWatchlist: {
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#00D4FF',
  },
  watchlistText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
    fontFamily: 'System',
  },
  overview: {
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
    fontFamily: 'System',
    fontWeight: '400',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    fontFamily: 'System',
  },
  genres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  genre: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  genreText: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  castMember: {
    marginRight: 16,
    alignItems: 'center',
    width: 80,
  },
  castImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
    backgroundColor: '#1A1A1A',
  },
  castName: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'System',
  },
  castCharacter: {
    color: '#888',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    fontFamily: 'System',
    fontWeight: '400',
  },
  backdropImage: {
    width: 280,
    height: 160,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#1A1A1A',
  },
});