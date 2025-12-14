import axios from 'axios';

const TMDB_API_URL = 'https://api.themoviedb.org/3';

export const tmdbDiscoverService = {
    discover: async (params: {
        genre_ids?: number[],
        period?: { start: string, end: string },
        page?: number
    }) => {
        const queryParams: any = {
            api_key: process.env.TMDB_API_KEY,
            include_adult: false,
            include_video: false,
            language: 'en-US',
            sort_by: 'popularity.desc',
            page: params.page || 1,
            with_genres: params.genre_ids?.join(',')
        };

        if (params.period) {
            queryParams['primary_release_date.gte'] = params.period.start;
            queryParams['primary_release_date.lte'] = params.period.end;
        }

        try {
            const client = axios.create({
                baseURL: TMDB_API_URL,
                timeout: 10000
            });
            const response = await client.get('/discover/movie', { params: queryParams });
            return response.data;
        } catch (error: any) {
            console.error("TMDB Discover Error:", error.message);
            if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
                // Simple retry once
                try {
                    console.log("Retrying TMDB Discover...");
                    const response = await axios.get(`${TMDB_API_URL}/discover/movie`, {
                        params: queryParams,
                        timeout: 10000
                    });
                    return response.data;
                } catch (retryError) {
                    console.error("Retry failed:", retryError);
                }
            }
            throw new Error("Failed to fetch from TMDB");
        }
    }
};
