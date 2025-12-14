import axios from 'axios';
import { getAuth } from 'firebase/auth';

import { Platform } from 'react-native';

const LOCALHOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || `http://${LOCALHOST}:8080/api/v1`;

const getHeaders = async () => {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

export const recommendationApi = {
    interpretTaste: async (text: string) => {
        const headers = await getHeaders();
        const response = await axios.post(`${API_URL}/interpret-taste`, { text }, { headers });
        return response.data;
    },

    recommend: async (mode: 'ai' | 'manual', forceRefresh = false, preferences?: any) => {
        const headers = await getHeaders();
        const response = await axios.post(`${API_URL}/recommend`, {
            mode,
            randomize: forceRefresh,
            forceRefresh,
            preferences
        }, { headers });
        return response.data;
    },

    getRecommendations: async () => {
        const headers = await getHeaders();
        const response = await axios.get(`${API_URL}/recommend`, { headers });
        return response.data;
    }
};
