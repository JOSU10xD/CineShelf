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
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../services/firebase';

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
        clientId: '970685105498-id2jkq3so1lpsbl2mbvt9ditl9njlht3.apps.googleusercontent.com',
        iosClientId: '970685105498-73avu5b4c31qht439e8thrspn967up63.apps.googleusercontent.com',
        androidClientId: '970685105498-73avu5b4c31qht439e8thrspn967up63.apps.googleusercontent.com',
        redirectUri: makeRedirectUri({
            scheme: 'cineshelf'
        }),
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // If firebase user exists, clear guest user
                setGuestUser(null);
            }
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
