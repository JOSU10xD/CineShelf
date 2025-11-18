import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TMDBSearchResult } from '../../../../types/tmdb';
import { ImageWithFallback } from '../../../components/ImageWithFallback';
import { useApp } from '../../../contexts/AppContext';
import { tmdbService } from '../../../services/tmdb';

export default function HomeScreen() {
  const router = useRouter();
  const { watchlist } = useApp();
  const [trending, setTrending] = useState<TMDBSearchResult[]>([]);
  const [popular, setPopular] = useState<TMDBSearchResult[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);

  useEffect(() => {
    loadTrending();
    loadPopularAllTime();
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

  const openFromHome = (item: TMDBSearchResult) => {
    router.push({
      pathname: './movie-details',
      params: { id: String(item.id), type: item.media_type }
    } as any);
  };

  const renderTile = ({ item }: { item: TMDBSearchResult }) => (
    <TouchableOpacity style={styles.tile} onPress={() => openFromHome(item)} activeOpacity={0.85}>
      <ImageWithFallback
        source={{ uri: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '' }}
        style={styles.tileImage}
        type="poster"
      />
      <Text style={styles.tileTitle} numberOfLines={2}>{item.title || item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleCine}>Cine</Text>
            <Text style={styles.titleShelf}>Shelf</Text>
          </View>
          <Text style={styles.subtitle}>Your Movie Wishlist</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Now</Text>
          {loadingTrending ? (
            <ActivityIndicator color="#00D4FF" size="large" />
          ) : (
            <FlatList
              data={trending}
              renderItem={renderTile}
              keyExtractor={(item) => `${item.id}-${item.media_type}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Time Popular</Text>
          {loadingPopular ? (
            <ActivityIndicator color="#00D4FF" size="large" />
          ) : (
            <FlatList
              data={popular}
              renderItem={renderTile}
              keyExtractor={(item) => `${item.id}-${item.media_type}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
            />
          )}
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{watchlist.length}</Text>
            <Text style={styles.statLabel}>Movies in Watchlist</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  titleCine: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00D4FF',
    fontFamily: 'System',
  },
  titleShelf: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    fontFamily: 'System',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    paddingLeft: 16,
    fontFamily: 'System',
  },
  tile: {
    width: 140,
    marginRight: 12,
    alignItems: 'center',
  },
  tileImage: {
    width: 120,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
  },
  tileTitle: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'System',
    paddingHorizontal: 4,
  },
  stats: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  statItem: { alignItems: 'center' },
  statNumber: { 
    fontSize: 48, 
    fontWeight: 'bold', 
    color: '#00D4FF',
    fontFamily: 'System',
  },
  statLabel: { 
    fontSize: 16, 
    color: '#888',
    fontFamily: 'System',
    fontWeight: '600',
  },
});