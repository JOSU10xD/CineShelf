// services/tmdb.ts
import axios from 'axios';
import { TMDBMovie, TMDBSearchResult } from '../types/tmdb';

const API_KEY = '8aac68f105946f2a197ae70264028efe';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4YWFjNjhmMTA1OTQ2ZjJhMTk3YWU3MDI2NDAyOGVmZSIsIm5iZiI6MTc2MjU3NzY2MS40ODcsInN1YiI6IjY5MGVjY2ZkYjUwMDRmMmQ1ZWEwYmVjNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.z5fXgCREF3pq3oU7Q7aKDQRuVf3cO7-NZnDSYB9Pslo';
const BASE_URL = 'https://api.themoviedb.org/3';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    // If ACCESS_TOKEN is not set, the API_KEY will still be sent as query param below.
    Authorization: ACCESS_TOKEN ? `Bearer ${ACCESS_TOKEN}` : undefined,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const tmdbService = {
  searchMovies: async (query: string): Promise<TMDBSearchResult[]> => {
    try {
      const response = await api.get('/search/multi', {
        params: {
          api_key: API_KEY,
          query: query,
          include_adult: false,
        },
      });
      return response.data.results.filter((item: any) =>
        item.media_type === 'movie' || item.media_type === 'tv'
      );
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },

  getMovieDetails: async (id: string, type: string = 'movie'): Promise<TMDBMovie | null> => {
    try {
      const response = await api.get(`/${type}/${id}`, {
        params: {
          api_key: API_KEY,
          append_to_response: 'credits,images',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Movie details error:', error);
      return null;
    }
  },

  getSuggestions: async (query: string): Promise<TMDBSearchResult[]> => {
    if (!query || query.length < 2) return [];

    try {
      const response = await api.get('/search/multi', {
        params: {
          api_key: API_KEY,
          query: query,
          include_adult: false,
          page: 1,
        },
      });
      return response.data.results.slice(0, 5);
    } catch (error) {
      console.error('Suggestions error:', error);
      return [];
    }
  },

  // New: Trending / Popular Now (all media types)
  getTrendingNow: async (): Promise<TMDBSearchResult[]> => {
    try {
      const response = await api.get('/trending/all/week', {
        params: { api_key: API_KEY },
      });
      return response.data.results.filter((item: any) =>
        item.media_type === 'movie' || item.media_type === 'tv'
      );
    } catch (error) {
      console.error('Trending error:', error);
      return [];
    }
  },

  // New: Popular all time (we use discover movie sorted by popularity desc - can be adjusted)
  getPopularAllTime: async (): Promise<TMDBSearchResult[]> => {
    try {
      // discover/movie sorted by popularity. You can tune filters (year, vote_count, etc.)
      const response = await api.get('/discover/movie', {
        params: {
          api_key: API_KEY,
          sort_by: 'popularity.desc',
          page: 1,
        },
      });
      // Map to TMDBSearchResult shape (movies only)
      return response.data.results.map((m: any) => ({
        id: m.id,
        title: m.title,
        name: m.name,
        poster_path: m.poster_path,
        media_type: 'movie',
        release_date: m.release_date,
        vote_average: m.vote_average,
      }));
    } catch (error) {
      console.error('Popular all-time error:', error);
      return [];
    }
  },
};