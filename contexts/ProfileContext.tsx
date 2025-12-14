import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, onSnapshot, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';

export interface UserProfile {
    uid: string;
    email: string;
    username: string;
    avatarId: number | string;
    createdAt?: Timestamp | string;
    updatedAt?: Timestamp | string;
    preferences?: {
        mode: 'manual' | 'ai';
        manualGenres?: number[];
        manualMoods?: string[];
        lastParsedConstraints?: any;
        tasteText?: string;
    };
}

interface ProfileContextType {
    profile: UserProfile | null;
    loading: boolean;
    saveUserProfile: (data: Partial<UserProfile> & { uid: string }) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({} as ProfileContextType);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) {
            setProfile(null);
            setLoading(false);
            return;
        }

        const uid = user.uid;

        if (uid.startsWith('guest_')) {
            // Handle guest user locally
            const loadGuestProfile = async () => {
                try {
                    const storedProfile = await AsyncStorage.getItem(`guest_profile_${uid}`);
                    if (storedProfile) {
                        setProfile(JSON.parse(storedProfile));
                    } else {
                        setProfile(null);
                    }
                } catch (e) {
                    console.error("Error loading guest profile", e);
                } finally {
                    setLoading(false);
                }
            };
            loadGuestProfile();
            return;
        }

        // Handle Firebase user
        const userRef = doc(db, 'users', uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                setProfile(docSnap.data() as UserProfile);
            } else {
                setProfile(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const saveUserProfile = async (data: Partial<UserProfile> & { uid: string }) => {
        if (!data.uid) return;

        if (data.uid.startsWith('guest_')) {
            // Save guest profile locally
            try {
                const payload = {
                    ...profile, // merge with existing
                    ...data,
                    updatedAt: new Date().toISOString(),
                    createdAt: profile?.createdAt || new Date().toISOString(),
                };
                await AsyncStorage.setItem(`guest_profile_${data.uid}`, JSON.stringify(payload));
                setProfile(payload as UserProfile); // Update local state immediately
            } catch (e) {
                console.error("Error saving guest profile", e);
            }
            return;
        }

        const userRef = doc(db, 'users', data.uid);
        const payload = {
            ...data,
            updatedAt: serverTimestamp(),
        };

        if (!profile) {
            (payload as any).createdAt = serverTimestamp();
        }

        // Optimistic update for logged-in users to ensure instant UI consistency
        // verification: This payload has serverTimestamp() which is an object, not a Date.
        // We might need to handle that for local state if UI expects Date.
        // However, typescript might complain if we put serverTimestamp() in UserProfile if it expects Timestamp.
        // UserProfile allows "Timestamp | string". serverTimestamp() is FieldValue.
        // For local state, let's use current date string, but for DB use serverTimestamp().

        const localPayload = {
            ...profile,
            ...data, // This has the preferences
            updatedAt: new Date().toISOString()
        };
        setProfile(localPayload as UserProfile);

        await setDoc(userRef, payload, { merge: true });
    };

    const value = {
        profile,
        loading,
        saveUserProfile
    };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
}

export const useProfile = () => useContext(ProfileContext);
