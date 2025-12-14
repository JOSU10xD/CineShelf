import { Request, Response } from 'express';
import { auth, db } from '../services/firebaseService';
import { ParsedConstraints } from '../services/taste/types';
import { tmdbService } from '../services/tmdbService';

export const recommend = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        let uid = 'guest';

        if (token) {
            try {
                const decodedToken = await auth.verifyIdToken(token);
                uid = decodedToken.uid;
            } catch (e) {
                console.log("Token verification failed (continuing as guest/manual if prefs exist)");
            }
        }

        // Block if no token AND no preferences (meaning we need DB access)
        if (uid === 'guest' && !req.body.preferences) {
            res.status(401).json({ error: 'Unauthorized', details: 'No token and no preferences provided.' });
            return;
        }

        const { mode, forceRefresh, preferences } = req.body;
        console.log("Recommend Request Body:", JSON.stringify({
            mode,
            forceRefresh,
            hasPreferences: !!preferences,
            prefsKeys: preferences ? Object.keys(preferences) : []
        }, null, 2));

        if (mode === 'ai') {
            console.log("AI Mode Constraints Input:", JSON.stringify(preferences?.lastParsedConstraints, null, 2));
        }

        let constraints: ParsedConstraints | null = null;

        if (mode === 'ai') {
            // Use provided constraints if available (Client-side flow), or fetch from DB
            if (preferences?.lastParsedConstraints) {
                constraints = preferences.lastParsedConstraints;
            } else {
                // Fetch latest constraints from prefs
                const prefsDoc = await db.collection('users').doc(uid).collection('prefs').doc('main').get();
                if (prefsDoc.exists && prefsDoc.data()?.lastParsedConstraints) {
                    constraints = prefsDoc.data()?.lastParsedConstraints;
                }
            }

            if (!constraints) {
                // If no constraints, we can't generate AI recs without text input. 
                // Client should have called interpret-taste first.
                res.status(400).json({ error: 'No AI constraints found. Please update taste.' });
                return;
            }
        } else if (mode === 'manual') {
            // Use provided manual prefs if available
            let data = preferences;

            if (!data?.manualGenres) {
                // Fetch manual prefs
                const prefsDoc = await db.collection('users').doc(uid).collection('prefs').doc('main').get();
                data = prefsDoc.data();
            }

            if (data?.manualGenres) {
                // Construct synthetic constraints for manual mode
                constraints = {
                    input: 'manual',
                    languages: [],
                    genres: data.manualGenres.map((id: number) => ({ name: '', id, confidence: 1 })), // We need to handle IDs
                    yearRange: { from: 1900, to: 2025 },
                    moods: data.manualMoods || [],
                    keywords: [],
                    confidence: 1,
                    explain: 'Based on your manual preferences',
                    // Pass randomization flag if manual prefs are passed directly?
                };
            }
        }

        if (constraints) {
            // Pass randomization flag
            // @ts-ignore
            constraints.randomize = !!(req.body.randomize || req.body.forceRefresh);
        }

        if (!constraints) {
            res.status(400).json({ error: 'Could not determine constraints' });
            return;
        }

        console.log("Constraints being used:", JSON.stringify(constraints, null, 2));

        // Check cache first if not forced and not guest
        if (!forceRefresh && uid !== 'guest') {
            const cachedRef = db.collection('users').doc(uid).collection('recommendations').doc('latest');
            const cachedDoc = await cachedRef.get();
            if (cachedDoc.exists) {
                const data = cachedDoc.data();
                const cacheTime = new Date(data?.createdAt).getTime();
                const ttl = (parseInt(process.env.RECOMM_CACHE_TTL_HOURS || '12') * 60 * 60 * 1000);

                // Check if cache is fresh in time AND constraints match
                // We compare the sensitive parts of constraints: genres, moods, input, yearRange
                const cachedConstraints = data?.constraints;

                // Helper to compare constraints
                // We use a simple JSON stringify comparison for now, assuming structure consistency
                // But we should focus on the 'meaningful' parts.
                const isSame = JSON.stringify(cachedConstraints?.genres) === JSON.stringify(constraints?.genres) &&
                    JSON.stringify(cachedConstraints?.moods) === JSON.stringify(constraints?.moods) &&
                    JSON.stringify(cachedConstraints?.yearRange) === JSON.stringify(constraints?.yearRange) &&
                    cachedConstraints?.input === constraints?.input;

                if (Date.now() - cacheTime < ttl && isSame) {
                    console.log("Serving from cache (Constraints match)");
                    // Shuffle cached results too if randomize is requested implicitly via refresh? 
                    // But if forceRefresh is false, we don't need to shuffle cache unless explicit randomize?
                    // The user said "when i refresh movies ... should be randomly listed".
                    // But here forceRefresh is false. 
                    // However, we can shuffle the cached items before returning!
                    const items = data?.items || [];
                    const shuffled = items.sort(() => 0.5 - Math.random());

                    res.json({ ...data, items: shuffled });
                    return;
                } else {
                    console.log("Cache miss or constraints mismatch. Generating new.");
                }
            }
        }

        // Generate Recommendations with Fallback Strategy
        let results = await generateRecommendations(constraints);

        // If strict search failed, try relaxing constraints
        if (!results || results.length === 0) {
            console.log("Strict search returned 0 results. Attempting fallback 1: Remove Year...");
            if (constraints.yearRange) {
                const relaxed1 = { ...constraints, yearRange: undefined };
                results = await generateRecommendations(relaxed1);
            }
        }

        if (!results || results.length === 0) {
            console.log("Fallback 1 returned 0 results. Attempting fallback 2: Remove Keywords/Genres (keep language)...");
            // Keep language, remove genre/keywords
            const relaxed2 = {
                ...constraints,
                yearRange: undefined,
                genres: [],
                keywords: [],
                explain: "Showing popular movies in this language (no exact match found)"
            };
            results = await generateRecommendations(relaxed2);
        }

        if (!results || results.length === 0) {
            console.log("Fallback 2 failed. Returning global popular movies.");
            const fallbackConstraints = {
                input: 'fallback',
                languages: [],
                genres: [],
                moods: [],
                keywords: [],
                confidence: 0,
                explain: "We couldn't find exact matches, but here are some popular movies you might like.",
                randomize: true
            };
            results = await generateRecommendations(fallbackConstraints);
        }

        // Store in Firestore only if not guest
        if (uid !== 'guest') {
            const recData = {
                createdAt: new Date().toISOString(),
                mode,
                constraints,
                items: results,
            };
            try {
                await db.collection('users').doc(uid).collection('recommendations').doc('latest').set(recData);
            } catch (dbError) {
                console.error("Failed to save recommendations to DB (non-fatal):", dbError);
                // Continue to return results even if save fails
            }

            // Return with full data
            res.json(recData);
        } else {
            // Just return results for guest
            res.json({
                createdAt: new Date().toISOString(),
                mode,
                constraints,
                items: results,
            });
        }

    } catch (error: any) {
        console.error('Recommend error:', error);
        // Handle Firebase Auth errors
        if (error.code?.startsWith('auth/') || error.message?.includes('Decoding Firebase ID token failed')) {
            res.status(401).json({ error: 'Unauthorized', details: 'Invalid or expired token' });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getRecommendations = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const decodedToken = await auth.verifyIdToken(token);
        const uid = decodedToken.uid;

        const cachedRef = db.collection('users').doc(uid).collection('recommendations').doc('latest');
        const cachedDoc = await cachedRef.get();

        if (cachedDoc.exists) {
            res.json(cachedDoc.data());
        } else {
            res.status(404).json({ error: 'No recommendations found' });
        }
    } catch (error: any) {
        console.error('Get recommendations error:', error);
        // Handle Firebase Auth errors
        if (error.code?.startsWith('auth/') || error.message?.includes('Decoding Firebase ID token failed')) {
            // Treat as guest / no history found, instead of fatal auth error
            console.log("Auth failed for history fetch, returning empty");
            res.status(200).json({ items: [] });
            return;
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

async function generateRecommendations(constraints: ParsedConstraints) {
    // Map constraints to TMDb discover params
    const params: any = {
        'vote_count.gte': 5, // Lowered from 100 to allow niche results
    };

    if (constraints.genres && constraints.genres.length > 0) {
        // If we have IDs (manual) use them, else map names
        const genreIds = constraints.genres.map(g => {
            // @ts-ignore
            if (g.id) return g.id;
            return tmdbService.getGenreId(g.name);
        }).filter(id => id !== undefined);

        if (genreIds.length > 0) {
            params.with_genres = genreIds.join(','); // AND logic? or OR? pipe for OR
        }
    }

    if (constraints.yearRange) {
        params['primary_release_date.gte'] = `${constraints.yearRange.from}-01-01`;
        params['primary_release_date.lte'] = `${constraints.yearRange.to}-12-31`;
    }

    if (constraints.languages && constraints.languages.length > 0) {
        // TMDb allows one language usually or with_original_language
        // We'll pick the first one for now
        params.with_original_language = constraints.languages[0];
    }

    // Fetch
    if (constraints.randomize) {
        // Increase range to 20 to get more variety, especially for broader queries
        params.page = Math.floor(Math.random() * 20) + 1;
    }

    console.log("TMDB Params:", JSON.stringify(params, null, 2));
    let data = await tmdbService.discoverMovies(params);

    // Smart Randomization Logic: If random deep page (e.g. 15) returns nothing, check total_pages
    if (params.page && params.page > 1) {
        const totalPages = data.total_pages || 0;

        // If we overshot (results empty but total_pages might be > 0, or we just want to ensure validity)
        // Actually, we only need to retry if results are empty.
        if ((!data.results || data.results.length === 0) && totalPages > 0) {
            // Pick a new random page within the actual limit (capped at 50 for performance)
            const maxPage = Math.min(totalPages, 50);
            const newPage = Math.floor(Math.random() * maxPage) + 1;
            console.log(`Page ${params.page} yielded 0 results. Total available: ${totalPages}. Retrying with Page ${newPage}...`);

            params.page = newPage;
            data = await tmdbService.discoverMovies(params);
        } else if ((!data.results || data.results.length === 0) && totalPages === 0) {
            // Genuine empty result (no movies at all for this query) - let fallback handling take over below
            console.log(`Page ${params.page} returned 0 results and total_pages is 0. Moving to constraint relaxation.`);
        }
    }

    console.log(`TMDB Results: ${data.results?.length} items`);
    if (data.results?.length > 0) {
        console.log("First Result:", data.results[0].title);
    }

    // Shuffle results to ensure freshness even if page is same
    const resultsArray = data.results || [];
    const shuffled = resultsArray.sort(() => 0.5 - Math.random());

    // Map to client format
    return shuffled.map((m: any) => ({
        id: m.id,
        title: m.title,
        poster_path: m.poster_path,
        reason: constraints.explain // Simple reason for now
    }));
}
