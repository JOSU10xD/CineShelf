import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { memo, useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ImageWithFallback } from '../../../components/ImageWithFallback';
import { useApp } from '../../../contexts/AppContext';
import { useProfile } from '../../../contexts/ProfileContext';
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
  const { profile } = useProfile();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = useCallback(async (force = false) => {
    try {
      setError(null);
      if (force) {
        setRefreshing(true);

        // Use local profile preferences if available (Reliable for Guest & synced users)
        let modeToUse = profile?.preferences?.mode || 'ai';
        let prefsToPass = undefined;

        console.log('[Discover] Loading with profile prefs:', JSON.stringify(profile?.preferences, null, 2));

        if (profile?.preferences) {
          if (modeToUse === 'manual') {
            prefsToPass = {
              manualGenres: profile.preferences.manualGenres,
              manualMoods: profile.preferences.manualMoods
            };
          } else {
            prefsToPass = {
              lastParsedConstraints: profile.preferences.lastParsedConstraints
            };
          }
        } else {
          // Fallback: Try to get from server via getRecommendations (Old logic)
          try {
            const current = await recommendationApi.getRecommendations();
            if (current && current.mode) {
              modeToUse = current.mode;
              if (current.constraints) {
                if (current.mode === 'manual') {
                  prefsToPass = {
                    manualGenres: current.constraints.genres?.map((g: any) => g.id),
                    manualMoods: current.constraints.moods
                  };
                } else {
                  prefsToPass = { lastParsedConstraints: current.constraints };
                }
              }
            }
          } catch (e) {
            console.log("Fallback fetch failed", e);
          }
        }

        const newRecs = await recommendationApi.recommend(modeToUse as any, true, prefsToPass);
        console.log('[Discover] Received recommendations:', newRecs ? `Count: ${newRecs.items?.length}` : 'null');
        if (newRecs && newRecs.items) {
          setRecommendations(newRecs.items);
        } else {
          console.warn('[Discover] No items in response:', newRecs);
          setRecommendations([]);
        }
      } else {
        setLoading(true);

        // Initial load: Prefer POST if we have local prefs (ensures Guest works)
        if (profile?.preferences) {
          const mode = profile.preferences.mode || 'ai';
          let prefs = undefined;
          console.log('[Discover] Initial load with prefs:', mode);

          if (mode === 'manual') {
            prefs = {
              manualMoods: profile.preferences.manualMoods || []
            };
          } else {
            prefs = { lastParsedConstraints: profile.preferences.lastParsedConstraints };
          }
          // We use POST here to ensure we get results based on current local prefs
          const newRecs = await recommendationApi.recommend(mode, false, prefs);
          console.log('[Discover] Initial load received:', newRecs ? `Count: ${newRecs.items?.length}` : 'null');
          if (newRecs && newRecs.items && newRecs.items.length > 0) {
            setRecommendations(newRecs.items);
          } else {
            console.warn('[Discover] Initial load returned empty items.');
            setError('No movies matched your criteria. We are trying to find alternatives...');
            // In reality, server now handles fallbacks, so this shouldn't happen often.
            setRecommendations([]);
          }
        } else {
          // Fallback to GET
          const data = await recommendationApi.getRecommendations();
          console.log('[Discover] Fallback GET received:', data ? `Count: ${data.items?.length}` : 'null');
          if (data && data.items && data.items.length > 0) {
            setRecommendations(data.items);
          } else {
            setRecommendations([]);
            // Don't set error here, just show empty or let the user try again
          }
        }
      }
    } catch (err) {
      console.error('Load recs error details:', err);
      // Check for network error specifically if possible
      // @ts-ignore
      if (err.message === 'Network Error' || err.code === 'ECONNABORTED' || err.message?.includes('Network request failed')) {
        setError('Network error: Unable to connect to server. Check your internet.');
      } else {
        setError('No recommendations found at the moment.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      // When screen comes into focus, if we have recommendations, maybe checking if they match current prefs?
      // OR just checking if we need to reload. 
      // For now, let's trigger a load if recommendations are empty OR if profile changed?
      // Actually, just relying on useCallback dependency [profile] in loadRecommendations might be tricky with FocusEffect.

      // Simple approach: trigger loadRecommendations() which checks cached data vs force.
      // But we want to auto-refresh if prefs changed.
      // Since loadRecommendations depends on [profile], if profile changed, the function changed.

      console.log('[Discover] Focus Effect Triggered');
      loadRecommendations();

      return () => {
        // cleanup
      };
    }, [loadRecommendations])
  );

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