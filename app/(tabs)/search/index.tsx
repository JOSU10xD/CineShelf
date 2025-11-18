import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ImageWithFallback } from '../../../components/ImageWithFallback';
import { useApp } from '../../../contexts/AppContext';
import { tmdbService } from '../../../services/tmdb';
import { TMDBSearchResult } from '../../../types/tmdb';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<TMDBSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const { searchState, updateSearchState, addToWatchlist, watchlist } = useApp();
  const router = useRouter();

  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (searchState.query) {
      setQuery(searchState.query);
    }
  }, [searchState.query]);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (query.length > 2) {
      timeoutRef.current = setTimeout(async () => {
        const results = await tmdbService.getSuggestions(query);
        setSuggestions(results as TMDBSearchResult[]);
      }, 300) as unknown as number;
    } else {
      setSuggestions([]);
    }

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearching(true);
    Keyboard.dismiss();

    const results = await tmdbService.searchMovies(query);
    setSuggestions([]);
    updateSearchState({ results, query });
    setLoading(false);
  };

  const handleSuggestionSelect = (item: TMDBSearchResult) => {
    setQuery(item.title || item.name || '');
    setSuggestions([]);
    router.push({
      pathname: '/search/movie-details',
      params: { id: String(item.id), type: item.media_type }
    } as any);
  };

  const handleMovieSelect = (movie: TMDBSearchResult) => {
    updateSearchState({ selectedMovie: movie });
    router.push({
      pathname: '/search/movie-details',
      params: { id: String(movie.id), type: movie.media_type }
    } as any);
  };

  const isInWatchlist = (movie: TMDBSearchResult) => {
    return watchlist.some(item => item.id === movie.id && item.media_type === movie.media_type);
  };

  const renderSuggestion = ({ item }: { item: TMDBSearchResult }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(item)}
    >
      <Text style={styles.suggestionText}>{item.title || item.name}</Text>
      <Text style={styles.suggestionType}>
        {item.media_type === 'movie' ? 'Movie' : 'TV'}
      </Text>
    </TouchableOpacity>
  );

  const renderMovie = ({ item }: { item: TMDBSearchResult }) => (
    <TouchableOpacity
      style={styles.movieCard}
      onPress={() => handleMovieSelect(item)}
      activeOpacity={0.85}
    >
      <ImageWithFallback
        source={{ uri: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '' }}
        style={styles.poster}
        type="poster"
      />
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle}>{item.title || item.name}</Text>
        <Text style={styles.movieYear}>
          {item.release_date ? new Date(item.release_date).getFullYear() : 
           item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'}
        </Text>
        <Text style={styles.movieType}>
          {item.media_type === 'movie' ? 'Movie' : 'TV Series'}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.watchlistButton}
        onPress={() => addToWatchlist(item)}
      >
        <Ionicons
          name={isInWatchlist(item) ? "bookmark" : "bookmark-outline"}
          size={24}
          color={isInWatchlist(item) ? "#00D4FF" : "#FFFFFF"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search movies or TV shows..."
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => `${item.id}-${item.media_type}`}
            style={styles.suggestionsList}
          />
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D4FF" />
        </View>
      )}

      {searching && !loading && (
        <FlatList
          data={searchState.results}
          renderItem={renderMovie}
          keyExtractor={(item) => `${item.id}-${item.media_type}`}
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsContent}
        />
      )}

      {!searching && (
        <View style={styles.placeholder}>
          <Ionicons name="film-outline" size={64} color="#333" />
          <Text style={styles.placeholderText}>
            Search for movies and TV shows to add to your watchlist
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    padding: 16,
    paddingTop: 60,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    color: '#fff',
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchButton: {
    backgroundColor: '#00D4FF',
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  suggestionsContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    maxHeight: 200,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  suggestionText: {
    color: '#fff',
    fontSize: 16,
  },
  suggestionType: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingBottom: 16,
  },
  movieCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 8,
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
  movieYear: {
    color: '#888',
    fontSize: 14,
    marginBottom: 2,
  },
  movieType: {
    color: '#00D4FF',
    fontSize: 12,
    fontWeight: '600',
  },
  watchlistButton: {
    padding: 8,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});