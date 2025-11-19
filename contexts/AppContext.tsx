import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { TMDBSearchResult } from '../types/tmdb';

interface AppContextType {
  watchlist: (TMDBSearchResult & { addedAt: string })[];
  addToWatchlist: (movie: TMDBSearchResult) => void;
  removeFromWatchlist: (id: number, mediaType: string) => void;
  reorderWatchlist: (newOrder: (TMDBSearchResult & { addedAt: string })[]) => void;
  searchState: {
    query: string;
    results: TMDBSearchResult[];
    selectedMovie: TMDBSearchResult | null;
  };
  updateSearchState: (updates: Partial<AppContextType['searchState']>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<(TMDBSearchResult & { addedAt: string })[]>([]);
  const [searchState, setSearchState] = useState<AppContextType['searchState']>({
    query: '',
    results: [],
    selectedMovie: null
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load watchlist from storage on app start
  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const storedWatchlist = await AsyncStorage.getItem('@cineshelf_watchlist');
        if (storedWatchlist) {
          setWatchlist(JSON.parse(storedWatchlist));
        }
      } catch (error) {
        console.error('Failed to load watchlist', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadWatchlist();
  }, []);

  // Save watchlist to storage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;

    const saveWatchlist = async () => {
      try {
        await AsyncStorage.setItem('@cineshelf_watchlist', JSON.stringify(watchlist));
      } catch (error) {
        console.error('Failed to save watchlist', error);
      }
    };
    saveWatchlist();
  }, [watchlist, isLoaded]);

  const addToWatchlist = useCallback((movie: TMDBSearchResult) => {
    setWatchlist(prev => {
      const exists = prev.find(item => item.id === movie.id && item.media_type === movie.media_type);
      if (exists) return prev;
      const newWatchlist = [...prev, { ...movie, addedAt: new Date().toISOString() }];
      return newWatchlist;
    });
  }, []);

  const removeFromWatchlist = useCallback((id: number, mediaType: string) => {
    setWatchlist(prev => prev.filter(item => !(item.id === id && item.media_type === mediaType)));
  }, []);

  const reorderWatchlist = useCallback((newOrder: (TMDBSearchResult & { addedAt: string })[]) => {
    setWatchlist(newOrder);
  }, []);

  const updateSearchState = useCallback((updates: Partial<AppContextType['searchState']>) => {
    setSearchState(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <AppContext.Provider value={{
      watchlist,
      addToWatchlist,
      removeFromWatchlist,
      reorderWatchlist,
      searchState,
      updateSearchState
    }}>
      {children}
    </AppContext.Provider>
  );
};
