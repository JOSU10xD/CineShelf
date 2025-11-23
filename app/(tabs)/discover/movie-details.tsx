// app/(tabs)/index/movie-details.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { MovieDetailsScreen } from '../../../components/MovieDetailsScreen';

export default function HomeMovieDetailsWrapper() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const type = Array.isArray(params.type) ? params.type[0] : params.type || 'movie';

  return (
    <MovieDetailsScreen
      movieId={id as string}
      mediaType={type as string}
      onBack={() => router.back()}
    />
  );
}
