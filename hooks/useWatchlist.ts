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
    posterUrl: string;
    addedAt: Timestamp;
    order: number;
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
        const q = query(collection(db, 'users', uid, 'watchlist'), orderBy('order', 'asc'));
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

    const addMovieToWatchlist = async (movie: { id: string | number, title: string, poster_path: string }) => {
        if (!uid) return;

        const lastOrder = watchlist.length > 0 ? watchlist[watchlist.length - 1].order : 0;
        const newOrder = lastOrder + 1;
        const movieIdStr = String(movie.id);

        if (uid.startsWith('guest_')) {
            // Guest: Add to local state and save
            const newItem: WatchlistItem = {
                movieId: movieIdStr,
                title: movie.title,
                posterUrl: movie.poster_path,
                addedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as Timestamp, // Mock Timestamp
                order: newOrder
            };
            // Check if already exists
            if (!watchlist.some(i => i.movieId === movieIdStr)) {
                await saveGuestWatchlist([...watchlist, newItem]);
            }
            return;
        }

        // Firebase: Add to Firestore
        const ref = doc(db, 'users', uid, 'watchlist', movieIdStr);
        await setDoc(ref, {
            movieId: movieIdStr,
            title: movie.title,
            posterUrl: movie.poster_path,
            addedAt: serverTimestamp(),
            order: newOrder
        });
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
        await deleteDoc(doc(db, 'users', uid, 'watchlist', movieIdStr));
    };

    const updateWatchlistOrder = async (orderedMovies: WatchlistItem[]) => {
        if (!uid) return;

        if (uid.startsWith('guest_')) {
            // Guest: Update local
            const updated = orderedMovies.map((item, index) => ({ ...item, order: index }));
            await saveGuestWatchlist(updated);
            return;
        }

        // Firebase: Batch update
        const batch = writeBatch(db);
        orderedMovies.forEach((movie, index) => {
            const ref = doc(db, 'users', uid, 'watchlist', movie.movieId);
            batch.update(ref, { order: index });
        });
        await batch.commit();
    };

    return {
        watchlist,
        loading,
        addMovieToWatchlist,
        removeMovieFromWatchlist,
        updateWatchlistOrder
    };
}
