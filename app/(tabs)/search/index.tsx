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

  // Use `number | null` in RN (setTimeout returns a number)
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (searchState.query) {
      setQuery(searchState.query);
    }
  }, [searchState.query]);

  useEffect(() => {
    // clear existing timeout if any
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (query.length > 2) {
      // assign the numeric id returned by setTimeout
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
        timeoutRef.current = null;
      }
    };
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearching(true);
    Keyboard.dismiss();

    const results = await tmdbService.searchMovies(query);
    updateSearchState({ results, query });
    setLoading(false);
  };

  const handleSuggestionSelect = (item: TMDBSearchResult) => {
    setQuery(item.title || item.name || '');
    setSuggestions([]);
    router.push(`/search/movie-details?id=${item.id}&type=${item.media_type}`);
  };

  const handleMovieSelect = (movie: TMDBSearchResult) => {
    updateSearchState({ selectedMovie: movie });
    router.push(`/search/movie-details?id=${movie.id}&type=${movie.media_type}`);
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
        disabled={isInWatchlist(item)}
      >
        <Ionicons
          name={isInWatchlist(item) ? "bookmark" : "bookmark-outline"}
          size={24}
          color={isInWatchlist(item) ? "#ff4444" : "#fff"}
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
          <ActivityIndicator size="large" color="#ff4444" />
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
    backgroundColor: '#121212',
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    maxHeight: 200,
    marginBottom: 16,
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
    color: '#888',
    fontSize: 14,
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
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 4,
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
    color: '#ff4444',
    fontSize: 12,
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