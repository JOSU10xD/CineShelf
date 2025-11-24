import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../services/firebase';

export interface WatchlistItem {
    movieId: string;
    title: string;
    posterPath: string;
    addedAt: Timestamp;
    position: number;
    source: string;
    notes?: string;
    media_type?: string;
    release_date?: string;
    first_air_date?: string;
    vote_average?: number;
}

import AsyncStorage from '@react-native-async-storage/async-storage';

export function useWatchlist(uid: string | undefined) {
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Load watchlist
    useEffect(() => {
        if (!uid) {
            setWatchlist([]);
            setLoading(false);
            return;
        }

        if (uid.startsWith('guest_')) {
            // Guest user: Load from AsyncStorage
            const loadGuestWatchlist = async () => {
                try {
                    const stored = await AsyncStorage.getItem(`guest_watchlist_${uid}`);
                    if (stored) {
                        setWatchlist(JSON.parse(stored));
                    } else {
                        setWatchlist([]);
                    }
                } catch (e) {
                    console.error("Error loading guest watchlist", e);
                } finally {
                    setLoading(false);
                }
            };
            loadGuestWatchlist();
            return;
        }

        // Firebase user: Load from Firestore
        const q = query(collection(db, 'users', uid, 'watchlist'), orderBy('position', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                movieId: doc.id,
                ...doc.data()
            })) as WatchlistItem[];
            setWatchlist(items);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching watchlist:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [uid]);

    // Helper to save guest watchlist
    const saveGuestWatchlist = async (items: WatchlistItem[]) => {
        if (!uid) return;
        try {
            await AsyncStorage.setItem(`guest_watchlist_${uid}`, JSON.stringify(items));
            setWatchlist(items);
        } catch (e) {
            console.error("Error saving guest watchlist", e);
        }
    };

    const addMovieToWatchlist = async (movie: { id: string | number, title: string, poster_path: string, media_type?: string, release_date?: string, first_air_date?: string, vote_average?: number }) => {
        if (!uid) return;

        const lastPosition = watchlist.length > 0 ? Math.max(...watchlist.map(i => i.position || 0)) : -1;
        const newPosition = lastPosition + 1;
        const movieIdStr = String(movie.id);

        if (uid.startsWith('guest_')) {
            // Guest: Add to local state and save
            const newItem: WatchlistItem = {
                movieId: movieIdStr,
                title: movie.title,
                posterPath: movie.poster_path,
                addedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as Timestamp, // Mock Timestamp
                position: newPosition,
                source: 'tmdb',
                media_type: movie.media_type || 'movie',
                release_date: movie.release_date,
                first_air_date: movie.first_air_date,
                vote_average: movie.vote_average
            };
            // Check if already exists
            if (!watchlist.some(i => i.movieId === movieIdStr)) {
                await saveGuestWatchlist([...watchlist, newItem]);
            }
            return;
        }

        // Firebase: Add to Firestore
        // Check if already exists in local state to prevent unnecessary writes/timestamp updates
        if (watchlist.some(i => i.movieId === movieIdStr)) {
            console.log("Movie already in watchlist, skipping write.");
            return;
        }

        try {
            const ref = doc(db, 'users', uid, 'watchlist', movieIdStr);
            await setDoc(ref, {
                movieId: movieIdStr,
                title: movie.title,
                posterPath: movie.poster_path,
                addedAt: serverTimestamp(),
                position: newPosition,
                source: 'tmdb',
                media_type: movie.media_type || 'movie',
                release_date: movie.release_date || null,
                first_air_date: movie.first_air_date || null,
                vote_average: movie.vote_average || 0
            });
        } catch (error) {
            console.error("Error adding to watchlist:", error);
            throw error; // Re-throw to let UI handle feedback if needed
        }
    };

    const removeMovieFromWatchlist = async (movieId: string | number) => {
        if (!uid) return;
        const movieIdStr = String(movieId);

        if (uid.startsWith('guest_')) {
            // Guest: Remove from local
            const newItems = watchlist.filter(i => i.movieId !== movieIdStr);
            await saveGuestWatchlist(newItems);
            return;
        }

        // Firebase: Remove from Firestore
        try {
            await deleteDoc(doc(db, 'users', uid, 'watchlist', movieIdStr));
        } catch (error) {
            console.error("Error removing from watchlist:", error);
            throw error;
        }
    };

    const updateWatchlistOrder = async (orderedMovies: WatchlistItem[]) => {
        if (!uid) return;

        if (uid.startsWith('guest_')) {
            // Guest: Update local
            const updated = orderedMovies.map((item, index) => ({ ...item, position: index }));
            await saveGuestWatchlist(updated);
            return;
        }

        // Firebase: Batch update
        try {
            const batch = writeBatch(db);
            orderedMovies.forEach((movie, index) => {
                const ref = doc(db, 'users', uid, 'watchlist', movie.movieId);
                batch.update(ref, { position: index });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error updating watchlist order:", error);
            throw error;
        }
    };

    return {
        watchlist,
        loading,
        addMovieToWatchlist,
        removeMovieFromWatchlist,
        updateWatchlistOrder
    };
}
