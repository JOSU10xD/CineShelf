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
import { useTheme } from '../contexts/ThemeContext';
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
  const { theme } = useTheme();
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
        watchlist.some(item => item.movieId === String(movie.id) && (item.media_type || 'movie') === (movie.media_type || mediaType))
      );
    }
  }, [watchlist, movie, mediaType]);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastOpacity = useState(new Animated.Value(0))[0];

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastVisible(false));
  }, [toastOpacity]);

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
      showToast('Removed from Watchlist');
    } else {
      addToWatchlist(movieData);
      showToast('Added to Watchlist');
    }
  }, [movie, isInWatchlist, removeFromWatchlist, addToWatchlist, mediaType, showToast]);

  const CastMember = memo(({ item }: { item: any }) => (
    <View style={styles.castMember}>
      <ImageWithFallback
        source={{ uri: item.profile_path ? `https://image.tmdb.org/t/p/w200${item.profile_path}` : '' }}
        style={[styles.castImage, { backgroundColor: theme.colors.card }]}
        type="cast"
      />
      <Text style={[styles.castName, { color: theme.colors.text }]} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={[styles.castCharacter, { color: theme.colors.secondary }]} numberOfLines={1}>
        {item.character}
      </Text>
    </View>
  ));

  const GenreItem = memo(({ genre }: { genre: any }) => (
    <View style={[styles.genre, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Text style={[styles.genreText, { color: theme.colors.primary }]}>{genre.name}</Text>
    </View>
  ));

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.text }]}>Movie not found</Text>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            <Text style={[styles.backText, { color: theme.colors.text }]}>Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, backgroundColor: theme.colors.background }]}>
      {onBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
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
            style={[styles.poster, { backgroundColor: theme.colors.card }]}
            type="poster"
          />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{movie.title || movie.name}</Text>

          <View style={styles.metaInfo}>
            <Text style={[styles.year, { color: theme.colors.primary }]}>
              {movie.release_date ? new Date(movie.release_date).getFullYear() :
                movie.first_air_date ? new Date(movie.first_air_date).getFullYear() : 'N/A'}
            </Text>
            <Text style={[styles.dot, { color: theme.colors.border }]}>•</Text>
            <Text style={[styles.runtime, { color: theme.colors.secondary }]}>
              {movie.runtime ? `${movie.runtime} min` :
                movie.episode_run_time?.[0] ? `${movie.episode_run_time[0]} min` : 'N/A'}
            </Text>
            <Text style={[styles.dot, { color: theme.colors.border }]}>•</Text>
            <Text style={styles.rating}>
              ⭐ {movie.vote_average?.toFixed(1)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.watchlistButton,
              { backgroundColor: isInWatchlist ? theme.colors.card : theme.colors.primary },
              isInWatchlist && { borderWidth: 2, borderColor: theme.colors.primary }
            ]}
            onPress={handleWatchlistToggle}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isInWatchlist ? "checkmark-circle" : "add-circle-outline"}
              size={24}
              color={isInWatchlist ? theme.colors.primary : "#fff"}
            />
            <Text style={[
              styles.watchlistText,
              { color: isInWatchlist ? theme.colors.primary : '#fff' }
            ]}>
              {isInWatchlist ? 'Already Added' : 'Add to Watchlist'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.overview, { color: theme.colors.secondary }]}>{movie.overview}</Text>

          {movie.genres && movie.genres.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Genres</Text>
              <View style={styles.genres}>
                {movie.genres.map((genre) => (
                  <GenreItem key={genre.id} genre={genre} />
                ))}
              </View>
            </View>
          )}

          {movie.credits?.cast && movie.credits.cast.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Cast</Text>
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
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Gallery</Text>
              <FlatList
                horizontal
                data={movie.images.backdrops.slice(0, 6)}
                renderItem={({ item }) => (
                  <ImageWithFallback
                    source={{ uri: `https://image.tmdb.org/t/p/w500${item.file_path}` }}
                    style={[styles.backdropImage, { backgroundColor: theme.colors.card }]}
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

      {/* Toast Notification */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastOpacity,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border
            }
          ]}
          pointerEvents="none"
        >
          <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
          <Text style={[styles.toastText, { color: theme.colors.text }]}>{toastMessage}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

export const MovieDetailsScreen = memo(MovieDetailsScreenComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
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
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  dot: {
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  runtime: {
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
  watchlistText: {
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
    fontFamily: 'System',
  },
  overview: {
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
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  genreText: {
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
  },
  castName: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'System',
  },
  castCharacter: {
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
  },
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
  },
  toastText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
});