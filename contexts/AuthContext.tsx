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
    const [loading, setLoading] = useState(true);

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: '683253241088-cjr7ahqm70ltt8hgrn1hmjb3iedeohpf.apps.googleusercontent.com',
        iosClientId: '683253241088-cjr7ahqm70ltt8hgrn1hmjb3iedeohpf.apps.googleusercontent.com',
        androidClientId: '683253241088-i51hgd7rtdnnk0irib8vqno7bs5pdj2v.apps.googleusercontent.com',
        redirectUri: makeRedirectUri({
            scheme: 'cineshelf'
        }),
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
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
                        // Watchlist will be a subcollection, so no need to init here
                    });
                }

                // If firebase user exists, clear guest user
                setGuestUser(null);
            }
            setUser(currentUser);
            setLoading(false);
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
        setGuestUser(guest);
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setGuestUser(null);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

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
