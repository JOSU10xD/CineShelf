import React, { createContext, useCallback, useContext, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWatchlist, WatchlistItem } from '../hooks/useWatchlist';
import { TMDBSearchResult } from '../types/tmdb';

interface AppContextType {
  watchlist: WatchlistItem[];
  addToWatchlist: (movie: TMDBSearchResult) => void;
  removeFromWatchlist: (id: number, mediaType: string) => void;
  reorderWatchlist: (newOrder: WatchlistItem[]) => void;
  searchState: {
    query: string;
    results: TMDBSearchResult[];
    selectedMovie: TMDBSearchResult | null;
  };
  updateSearchState: (updates: Partial<AppContextType['searchState']>) => void;
  loading: boolean;
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
  const { user } = useAuth();
  const { watchlist, loading, addMovieToWatchlist, removeMovieFromWatchlist, updateWatchlistOrder } = useWatchlist(user?.uid);

  const [searchState, setSearchState] = useState<AppContextType['searchState']>({
    query: '',
    results: [],
    selectedMovie: null
  });

  const addToWatchlist = useCallback((movie: TMDBSearchResult) => {
    // Map TMDBSearchResult to the format expected by addMovieToWatchlist
    addMovieToWatchlist({
      id: movie.id,
      title: movie.title || movie.name || 'Unknown Title',
      poster_path: movie.poster_path || '',
      media_type: movie.media_type,
      release_date: movie.release_date,
      first_air_date: movie.first_air_date,
      vote_average: movie.vote_average
    });
  }, [addMovieToWatchlist]);

  const removeFromWatchlist = useCallback((id: number, mediaType: string) => {
    removeMovieFromWatchlist(id);
  }, [removeMovieFromWatchlist]);

  const reorderWatchlist = useCallback((newOrder: WatchlistItem[]) => {
    updateWatchlistOrder(newOrder);
  }, [updateWatchlistOrder]);

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
      updateSearchState,
      loading
    }}>
      {children}
    </AppContext.Provider>
  );
};
