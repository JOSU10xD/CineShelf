import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, InteractionManager, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ImageWithFallback } from '../../../components/ImageWithFallback';
import { useApp } from '../../../contexts/AppContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { recommendationApi } from '../../../services/recommendationApi';

// Memoized Tile Component
const MovieTile = memo(({ item, onPress, theme }: { item: any, onPress: (item: any) => void, theme: any }) => (
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
    {item.reason && (
      <Text style={[styles.reasonText, { color: theme.colors.secondary }]} numberOfLines={2}>
        {item.reason}
      </Text>
    )}
  </TouchableOpacity>
));

export default function HomeScreen() {
  const router = useRouter();
  const { watchlist } = useApp();
  const { theme } = useTheme();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = useCallback(async (force = false) => {
    try {
      setError(null);
      if (force) {
        setRefreshing(true);
        // We don't know the mode here easily without storing it in local state or fetching prefs.
        // But the server recommend endpoint needs a mode.
        // Actually, the plan says "Add Refresh recommendations button in UI to request POST /api/v1/recommend with forceRefresh=true".
        // But we need to know if it's 'ai' or 'manual'.
        // For now, let's assume 'ai' or try to fetch existing to see mode?
        // The server GET returns the mode in the response.
        // So we can GET first, see mode, then POST with that mode.

        // Quick fix: Try to get current recs to find mode, if fail, default to 'ai' (or ask user).
        // If we are refreshing, we likely have recs.
        const current = await recommendationApi.getRecommendations();
        if (current && current.mode) {
          const newRecs = await recommendationApi.recommend(current.mode, true);
          setRecommendations(newRecs.items);
        } else {
          // Fallback or re-onboard
          const newRecs = await recommendationApi.recommend('ai', true); // Defaulting to AI
          setRecommendations(newRecs.items);
        }
      } else {
        setLoading(true);
        const data = await recommendationApi.getRecommendations();
        setRecommendations(data.items || []);
      }
    } catch (err) {
      console.error('Load recs error:', err);
      setError('Failed to load recommendations. Please check your connection or update your taste.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      loadRecommendations();
    });
  }, [loadRecommendations]);

  const openFromHome = useCallback((item: any) => {
    router.push({
      pathname: `/movie/${item.id}`,
      params: { type: 'movie' } // Recommendations are currently movies
    } as any);
  }, [router]);

  const renderTile = useCallback(({ item }: { item: any }) => (
    <MovieTile item={item} onPress={openFromHome} theme={theme} />
  ), [openFromHome, theme]);

  const keyExtractor = useCallback((item: any) => `${item.id}`, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadRecommendations(true)} tintColor={theme.colors.primary} />
        }
      >

        <View style={styles.header}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recommended for You</Text>
          <TouchableOpacity onPress={() => loadRecommendations(true)} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.colors.primary} size="large" style={{ marginTop: 50 }} />
        ) : error ? (
          <View style={styles.center}>
            <Text style={{ color: theme.colors.error, marginBottom: 16 }}>{error}</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/profile-setup', params: { initialStep: 'taste' } } as any)} style={[styles.button, { backgroundColor: theme.colors.primary }]}>
              <Text style={{ color: '#fff' }}>Update Taste</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {recommendations.map(item => (
              <View key={item.id} style={{ marginBottom: 24 }}>
                <MovieTile item={item} onPress={openFromHome} theme={theme} />
              </View>
            ))}
          </View>
        )}

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    paddingRight: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    paddingLeft: 20,
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  refreshButton: {
    padding: 8,
  },
  tile: {
    width: 160,
    alignItems: 'center',
  },
  imageContainer: {
    width: 160,
    height: 240,
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
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'System',
    paddingHorizontal: 4,
  },
  reasonText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
    fontStyle: 'italic'
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    paddingHorizontal: 10,
  },
  center: {
    alignItems: 'center',
    marginTop: 50,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  }
});