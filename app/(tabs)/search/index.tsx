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
import { Toast } from '../../../components/Toast';
import { useApp } from '../../../contexts/AppContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { tmdbService } from '../../../services/tmdb';
import { TMDBSearchResult } from '../../../types/tmdb';

export default function SearchScreen() {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<TMDBSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const { searchState, updateSearchState, addToWatchlist, removeFromWatchlist, watchlist } = useApp();
    const { theme } = useTheme();
    const router = useRouter();

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (message: string) => {
        setToastMessage(message);
        setToastVisible(true);
    };

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
            pathname: `/movie/${item.id}`,
            params: { type: item.media_type }
        } as any);
    };

    const handleMovieSelect = (movie: TMDBSearchResult) => {
        updateSearchState({ selectedMovie: movie });
        router.push({
            pathname: `/movie/${movie.id}`,
            params: { type: movie.media_type }
        } as any);
    };

    const isInWatchlist = (movie: TMDBSearchResult) => {
        return watchlist.some(item => item.movieId === String(movie.id) && (item.media_type || 'movie') === (movie.media_type || 'movie'));
    };

    const handleWatchlistToggle = (item: TMDBSearchResult) => {
        if (isInWatchlist(item)) {
            removeFromWatchlist(item.id, item.media_type || 'movie');
            showToast('Removed from Watchlist');
        } else {
            addToWatchlist(item);
            showToast('Added to Watchlist');
        }
    };

    const renderSuggestion = ({ item }: { item: TMDBSearchResult }) => (
        <TouchableOpacity
            style={[styles.suggestionItem, { borderBottomColor: theme.colors.border }]}
            onPress={() => handleSuggestionSelect(item)}
        >
            <Text style={[styles.suggestionText, { color: theme.colors.text }]}>{item.title || item.name}</Text>
            <Text style={[styles.suggestionType, { color: theme.colors.primary }]}>
                {item.media_type === 'movie' ? 'Movie' : 'TV'}
            </Text>
        </TouchableOpacity>
    );

    const renderMovie = ({ item }: { item: TMDBSearchResult }) => {
        const inList = isInWatchlist(item);
        return (
            <TouchableOpacity
                style={[styles.movieCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => handleMovieSelect(item)}
                activeOpacity={0.85}
            >
                <ImageWithFallback
                    source={{ uri: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '' }}
                    style={styles.poster}
                    type="poster"
                />
                <View style={styles.movieInfo}>
                    <Text style={[styles.movieTitle, { color: theme.colors.text }]}>{item.title || item.name}</Text>
                    <Text style={[styles.movieYear, { color: theme.colors.secondary }]}>
                        {item.release_date ? new Date(item.release_date).getFullYear() :
                            item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'}
                    </Text>
                    <Text style={[styles.movieType, { color: theme.colors.primary }]}>
                        {item.media_type === 'movie' ? 'Movie' : 'TV Series'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[
                        styles.watchlistButton,
                        inList && { backgroundColor: theme.colors.primary, borderRadius: 12, padding: 8 }
                    ]}
                    onPress={() => handleWatchlistToggle(item)}
                >
                    <Ionicons
                        name={inList ? "bookmark" : "bookmark-outline"}
                        size={24}
                        color={inList ? "#fff" : theme.colors.text}
                    />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={[
                        styles.searchInput,
                        {
                            backgroundColor: theme.colors.card,
                            color: theme.colors.text,
                            borderColor: theme.colors.border
                        }
                    ]}
                    placeholder="Search movies or TV shows..."
                    placeholderTextColor={theme.colors.secondary}
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                <TouchableOpacity
                    style={[styles.searchButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleSearch}
                >
                    <Ionicons name="search" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {suggestions.length > 0 && (
                <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
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
                    <ActivityIndicator size="large" color={theme.colors.primary} />
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
                    <Ionicons name="film-outline" size={64} color={theme.colors.border} />
                    <Text style={[styles.placeholderText, { color: theme.colors.secondary }]}>
                        Search for movies and TV shows to add to your watchlist
                    </Text>
                </View>
            )}

            <Toast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        paddingTop: 60,
    },
    searchContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        padding: 12,
        borderRadius: 16,
        marginRight: 12,
        fontSize: 16,
        borderWidth: 1,
        fontFamily: 'System',
    },
    searchButton: {
        padding: 12,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    suggestionsContainer: {
        borderRadius: 16,
        maxHeight: 200,
        marginBottom: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    suggestionsList: {
        flex: 1,
    },
    suggestionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    suggestionText: {
        fontSize: 16,
        fontFamily: 'System',
    },
    suggestionType: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'System',
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
        borderRadius: 16,
        marginBottom: 16,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    poster: {
        width: 60,
        height: 90,
        borderRadius: 12,
    },
    movieInfo: {
        flex: 1,
        marginLeft: 16,
    },
    movieTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        fontFamily: 'System',
    },
    movieYear: {
        fontSize: 14,
        marginBottom: 4,
        fontFamily: 'System',
    },
    movieType: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'System',
    },
    watchlistButton: {
        padding: 8,
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    placeholderText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        fontFamily: 'System',
        lineHeight: 24,
    },
});
