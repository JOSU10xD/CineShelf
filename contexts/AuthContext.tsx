import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    User
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../services/firebase';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInAsGuest: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [guestUser, setGuestUser] = useState<User | null>(null);
    const [authLoaded, setAuthLoaded] = useState(false);
    const [guestLoaded, setGuestLoaded] = useState(false);

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: '683253241088-cjr7ahqm70ltt8hgrn1hmjb3iedeohpf.apps.googleusercontent.com',
        iosClientId: '683253241088-cjr7ahqm70ltt8hgrn1hmjb3iedeohpf.apps.googleusercontent.com',
        androidClientId: '683253241088-i51hgd7rtdnnk0irib8vqno7bs5pdj2v.apps.googleusercontent.com',
        redirectUri: makeRedirectUri({
            scheme: 'cineshelf'
        }),
    });

    useEffect(() => {
        const loadGuest = async () => {
            try {
                const storedGuest = await AsyncStorage.getItem('guest_user');
                if (storedGuest) {
                    setGuestUser(JSON.parse(storedGuest));
                }
            } catch (e) {
                console.error("Error loading guest session", e);
            } finally {
                setGuestLoaded(true);
            }
        };
        loadGuest();

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                if (currentUser) {
                    // Check if user doc exists, if not create it
                    const userRef = doc(db, 'users', currentUser.uid);
                    const userSnap = await getDoc(userRef);

                    if (!userSnap.exists()) {
                        await setDoc(userRef, {
                            uid: currentUser.uid,
                            email: currentUser.email,
                            username: currentUser.displayName || 'User',
                            avatarId: 1, // Default avatar
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                        });
                    }

                    // If firebase user exists, clear guest user
                    setGuestUser(null);
                    await AsyncStorage.removeItem('guest_user');
                }
                setUser(currentUser);
            } catch (error) {
                console.error("Auth state change processing error:", error);
            } finally {
                setAuthLoaded(true);
            }
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            signInWithCredential(auth, credential);
        }
    }, [response]);

    const signInWithGoogle = async () => {
        try {
            await promptAsync();
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    const signInAsGuest = async () => {
        const guestId = `guest_${Date.now()}`;
        const guest: any = {
            uid: guestId,
            email: null,
            isAnonymous: true,
            displayName: 'Guest',
            photoURL: null,
        };
        try {
            await AsyncStorage.setItem('guest_user', JSON.stringify(guest));
            setGuestUser(guest);
        } catch (error) {
            console.error("Error saving guest user to storage", error);
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setGuestUser(null);
            await AsyncStorage.removeItem('guest_user');
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    const loading = !authLoaded || !guestLoaded;

    const value = {
        user: user || guestUser,
        loading,
        signInWithGoogle,
        signInAsGuest,
        signOut
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
