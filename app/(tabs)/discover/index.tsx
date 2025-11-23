import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, InteractionManager, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TMDBSearchResult } from '../../../../types/tmdb';
import { ImageWithFallback } from '../../../components/ImageWithFallback';
import { useApp } from '../../../contexts/AppContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { tmdbService } from '../../../services/tmdb';

// Memoized Tile Component
const MovieTile = memo(({ item, onPress, theme }: { item: TMDBSearchResult, onPress: (item: TMDBSearchResult) => void, theme: any }) => (
  <TouchableOpacity
    style={styles.tile}
    onPress={() => onPress(item)}
    activeOpacity={0.85}
  >
    <View style={[styles.imageContainer, { shadowColor: theme.colors.text }]}>
      <ImageWithFallback
        source={{ uri: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '' }}
        style={styles.tileImage}
        type="poster"
      />
    </View>
    <Text style={[styles.tileTitle, { color: theme.colors.text }]} numberOfLines={2}>{item.title || item.name}</Text>
  </TouchableOpacity>
));

export default function HomeScreen() {
  const router = useRouter();
  const { watchlist } = useApp();
  const { theme } = useTheme();
  const [trending, setTrending] = useState<TMDBSearchResult[]>([]);
  const [popular, setPopular] = useState<TMDBSearchResult[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);

  useEffect(() => {
    // Use InteractionManager to delay heavy fetches until after transitions
    InteractionManager.runAfterInteractions(() => {
      loadTrending();
      loadPopularAllTime();
    });
  }, []);

  const loadTrending = async () => {
    setLoadingTrending(true);
    const t = await tmdbService.getTrendingNow();
    setTrending(t);
    setLoadingTrending(false);
  };

  const loadPopularAllTime = async () => {
    setLoadingPopular(true);
    const p = await tmdbService.getPopularAllTime();
    setPopular(p);
    setLoadingPopular(false);
  };

  const openFromHome = useCallback((item: TMDBSearchResult) => {
    router.push({
      pathname: './movie-details',
      params: { id: String(item.id), type: item.media_type }
    } as any);
  }, [router]);

  const renderTile = useCallback(({ item }: { item: TMDBSearchResult }) => (
    <MovieTile item={item} onPress={openFromHome} theme={theme} />
  ), [openFromHome, theme]);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 156, // width + marginRight
    offset: 156 * index,
    index,
  }), []);

  const keyExtractor = useCallback((item: TMDBSearchResult) => `${item.id}-${item.media_type}`, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Trending Now</Text>
          {loadingTrending ? (
            <ActivityIndicator color={theme.colors.primary} size="large" />
          ) : (
            <FlatList
              data={trending}
              renderItem={renderTile}
              keyExtractor={keyExtractor}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
              getItemLayout={getItemLayout}
              initialNumToRender={4}
              maxToRenderPerBatch={6}
              windowSize={5}
              removeClippedSubviews={true}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>All Time Popular</Text>
          {loadingPopular ? (
            <ActivityIndicator color={theme.colors.primary} size="large" />
          ) : (
            <FlatList
              data={popular}
              renderItem={renderTile}
              keyExtractor={keyExtractor}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
              getItemLayout={getItemLayout}
              initialNumToRender={4}
              maxToRenderPerBatch={6}
              windowSize={5}
              removeClippedSubviews={true}
            />
          )}
        </View>

        <View style={[styles.stats, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{watchlist.length}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.secondary }]}>Movies in Watchlist</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    paddingLeft: 20,
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  tile: {
    width: 140,
    marginRight: 16,
    alignItems: 'center',
  },
  imageContainer: {
    width: 140,
    height: 210,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 12,
  },
  tileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  tileTitle: {
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'System',
    paddingHorizontal: 4,
  },
  stats: {
    margin: 20,
    padding: 24,
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 40,
  },
  statItem: { alignItems: 'center' },
  statNumber: {
    fontSize: 48,
    fontWeight: '800',
    fontFamily: 'System',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
  },
});