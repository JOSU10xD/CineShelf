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
                    let shuffled = [];
                    const hasExact = constraints.exactMatchTitle || (items[0] && items[0].reason && items[0].reason.startsWith('Exact match'));
                    if (hasExact && items.length > 0) {
                        const exact = items[0];
                        const similar = items.slice(1).sort(() => 0.5 - Math.random());
                        shuffled = [exact, ...similar];
                    } else {
                        shuffled = items.sort(() => 0.5 - Math.random());
                    }

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

async function runDiscover(constraints: ParsedConstraints, randomize: boolean) {
    const mediaTypeToDiscover = constraints.mediaType || 'movie';
    const discoverParams: any = {
        'vote_count.gte': 5,
    };

    if (constraints.genres && constraints.genres.length > 0) {
        const genreIds = constraints.genres.map(g => {
            // @ts-ignore
            if (g.id) return g.id;
            return tmdbService.getGenreId(g.name);
        }).filter(id => id !== undefined);

        if (genreIds.length > 0) {
            discoverParams.with_genres = genreIds.join(',');
        }
    }

    if (constraints.yearRange) {
        if (mediaTypeToDiscover === 'tv') {
            discoverParams['first_air_date.gte'] = `${constraints.yearRange.from}-01-01`;
            discoverParams['first_air_date.lte'] = `${constraints.yearRange.to}-12-31`;
        } else {
            discoverParams['primary_release_date.gte'] = `${constraints.yearRange.from}-01-01`;
            discoverParams['primary_release_date.lte'] = `${constraints.yearRange.to}-12-31`;
        }
    }

    if (constraints.languages && constraints.languages.length > 0) {
        discoverParams.with_original_language = constraints.languages[0];
    }

    if (randomize) {
        discoverParams.page = Math.floor(Math.random() * 10) + 1;
    }

    let moviesResults: any[] = [];
    let tvResults: any[] = [];

    // Query Movies
    if (mediaTypeToDiscover === 'movie' || mediaTypeToDiscover === 'both') {
        try {
            const data = await tmdbService.discoverMovies(discoverParams);
            if (data?.results?.length > 0) {
                moviesResults = data.results.map((m: any) => ({
                    id: m.id,
                    title: m.title,
                    poster_path: m.poster_path,
                    media_type: 'movie',
                    original_language: m.original_language,
                    reason: constraints.explain
                }));
            }
        } catch (err) {
            console.error("Discover movies error:", err);
        }
    }

    // Query TV Series
    if (mediaTypeToDiscover === 'tv' || mediaTypeToDiscover === 'both') {
        try {
            const data = await tmdbService.discoverTv(discoverParams);
            if (data?.results?.length > 0) {
                tvResults = data.results.map((m: any) => ({
                    id: m.id,
                    title: m.name,
                    poster_path: m.poster_path,
                    media_type: 'tv',
                    original_language: m.original_language,
                    reason: constraints.explain
                }));
            }
        } catch (err) {
            console.error("Discover TV error:", err);
        }
    }

    let combinedResults = [...moviesResults, ...tvResults];

    if (randomize) {
        combinedResults = combinedResults.sort(() => 0.5 - Math.random());
    }

    return combinedResults;
}

async function generateRecommendations(constraints: ParsedConstraints) {
    // Keep track of all seen IDs to prevent duplicates
    const seenIds = new Set<number>();

    // Helper for matching languages
    const reqLangs = constraints.languages && constraints.languages.length > 0
        ? constraints.languages.map(l => l.toLowerCase().trim())
        : null;

    // Helper to find the best item in search results based on language constraint
    const selectBestSearchItem = (results: any[]) => {
        if (!results || results.length === 0) return null;
        if (reqLangs) {
            const match = results.find((m: any) => m.original_language && reqLangs.includes(m.original_language.toLowerCase()));
            if (match) return match;
        }
        return results[0];
    };

    // Helper to filter similar results by language constraint
    const filterByLanguage = (items: any[]) => {
        if (!reqLangs) return items;
        return items.filter((m: any) => !m.original_language || reqLangs.includes(m.original_language.toLowerCase()));
    };

    // 1. EXACT MATCH LOCK FLOW
    if (constraints.exactMatchTitle && constraints.exactMatchTitle.title) {
        const exact = constraints.exactMatchTitle;
        console.log(`Processing exact match request: "${exact.title}" (${exact.type})`);
        
        try {
            let exactItem: any = null;
            let similarResults: any[] = [];
            
            // Search for exact movie/show
            if (exact.type === 'tv') {
                const searchData = await tmdbService.searchTv(exact.title);
                exactItem = selectBestSearchItem(searchData?.results);
                if (exactItem) exactItem.media_type = 'tv';
            } else {
                const searchData = await tmdbService.searchMovie(exact.title);
                exactItem = selectBestSearchItem(searchData?.results);
                if (exactItem) exactItem.media_type = 'movie';
            }
            
            if (exactItem) {
                seenIds.add(exactItem.id);

                // Fetch recommendations/similar items
                let similarData;
                if (exactItem.media_type === 'tv') {
                    similarData = await tmdbService.getSimilarTv(exactItem.id);
                } else {
                    similarData = await tmdbService.getSimilarMovies(exactItem.id);
                }
                
                if (similarData?.results?.length > 0) {
                    similarResults = similarData.results.map((m: any) => ({
                        id: m.id,
                        title: m.title || m.name,
                        poster_path: m.poster_path,
                        media_type: exactItem.media_type,
                        original_language: m.original_language,
                        reason: `Similar to "${exactItem.title || exactItem.name}" (${constraints.explain})`
                    }));
                }
                
                // Enforce original language filtering on similar items
                similarResults = filterByLanguage(similarResults);
                
                // Shuffle similar results on refresh (randomize = true)
                if (constraints.randomize) {
                    similarResults = similarResults.sort(() => 0.5 - Math.random());
                }
                
                let finalResults = [
                    {
                        id: exactItem.id,
                        title: exactItem.title || exactItem.name,
                        poster_path: exactItem.poster_path,
                        media_type: exactItem.media_type,
                        original_language: exactItem.original_language,
                        reason: `Exact match for: "${exact.title}"`
                    },
                    ...similarResults
                ];

                // Backfill if we have fewer than 15 results
                if (finalResults.length < 15) {
                    similarResults.forEach(m => seenIds.add(m.id));
                    const discoverResults = await runDiscover(constraints, !!constraints.randomize);
                    for (const item of discoverResults) {
                        if (!seenIds.has(item.id)) {
                            seenIds.add(item.id);
                            finalResults.push(item);
                        }
                    }
                }
                
                console.log(`Exact match flow complete. Returning exact match plus ${finalResults.length - 1} items.`);
                return finalResults;
            }
        } catch (err) {
            console.error(`Error in exact match flow for "${exact.title}":`, err);
        }
    }

    // 2. AI SUGGESTED TITLES FLOW (When there is no single exact match, but AI suggested multiple titles)
    if (constraints.suggestedTitles && constraints.suggestedTitles.length > 0) {
        console.log("Processing AI suggested list:", constraints.suggestedTitles);
        const exactMatches: any[] = [];
        const similarMovies: any[] = [];

        for (const item of constraints.suggestedTitles) {
            try {
                let matchedItem: any = null;
                if (item.type === 'tv') {
                    const searchData = await tmdbService.searchTv(item.title);
                    matchedItem = selectBestSearchItem(searchData?.results);
                    if (matchedItem) {
                        matchedItem.media_type = 'tv';
                    } else {
                        // Fallback to movie search if TV returns nothing
                        const searchMovieData = await tmdbService.searchMovie(item.title);
                        matchedItem = selectBestSearchItem(searchMovieData?.results);
                        if (matchedItem) matchedItem.media_type = 'movie';
                    }
                } else {
                    const searchData = await tmdbService.searchMovie(item.title);
                    matchedItem = selectBestSearchItem(searchData?.results);
                    if (matchedItem) {
                        matchedItem.media_type = 'movie';
                    } else {
                        // Fallback to TV search if movie returns nothing
                        const searchTvData = await tmdbService.searchTv(item.title);
                        matchedItem = selectBestSearchItem(searchTvData?.results);
                        if (matchedItem) matchedItem.media_type = 'tv';
                    }
                }

                if (matchedItem && !seenIds.has(matchedItem.id)) {
                    seenIds.add(matchedItem.id);
                    exactMatches.push({
                        id: matchedItem.id,
                        title: matchedItem.title || matchedItem.name,
                        poster_path: matchedItem.poster_path,
                        media_type: matchedItem.media_type,
                        original_language: matchedItem.original_language,
                        reason: `AI Recommendation: "${item.title}"`
                    });

                    // Fetch recommendations for this seed title
                    let similarData;
                    if (matchedItem.media_type === 'tv') {
                        similarData = await tmdbService.getSimilarTv(matchedItem.id);
                    } else {
                        similarData = await tmdbService.getSimilarMovies(matchedItem.id);
                    }

                    if (similarData?.results?.length > 0) {
                        const slice = similarData.results.slice(0, 15);
                        for (const sim of slice) {
                            if (!seenIds.has(sim.id)) {
                                seenIds.add(sim.id);
                                similarMovies.push({
                                    id: sim.id,
                                    title: sim.title || sim.name,
                                    poster_path: sim.poster_path,
                                    media_type: matchedItem.media_type,
                                    original_language: sim.original_language,
                                    reason: `Similar to "${matchedItem.title || matchedItem.name}" (${constraints.explain})`
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(`Error processing suggested title "${item.title}":`, err);
            }
        }

        let combined = [...exactMatches, ...similarMovies];

        // Filter out unrelated languages from suggestions and similar items
        combined = filterByLanguage(combined);

        if (constraints.randomize) {
            combined = combined.sort(() => 0.5 - Math.random());
        }

        // Backfill with standard discover if results are sparse
        if (combined.length < 15) {
            console.log(`Suggested titles returned only ${combined.length} items. Backfilling with standard discover.`);
            const discoverResults = await runDiscover(constraints, !!constraints.randomize);
            for (const item of discoverResults) {
                if (!seenIds.has(item.id)) {
                    seenIds.add(item.id);
                    combined.push(item);
                }
            }
        }

        if (combined.length > 0) {
            console.log(`Suggested titles flow returned ${combined.length} items.`);
            return combined;
        }
    }

    // 3. STANDARD DISCOVER FLOW (Rule-based / Category Discovery)
    console.log(`Standard Discover Flow`);
    return await runDiscover(constraints, !!constraints.randomize);
}
