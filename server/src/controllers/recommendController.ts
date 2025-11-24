import { Request, Response } from 'express';
import { auth, db } from '../services/firebaseService';
import { ParsedConstraints } from '../services/taste/types';
import { tmdbService } from '../services/tmdbService';

export const recommend = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const decodedToken = await auth.verifyIdToken(token);
        const uid = decodedToken.uid;

        const { mode, forceRefresh } = req.body;

        // Check cache first if not forced
        if (!forceRefresh) {
            const cachedRef = db.collection('users').doc(uid).collection('recommendations').doc('latest');
            const cachedDoc = await cachedRef.get();
            if (cachedDoc.exists) {
                const data = cachedDoc.data();
                const cacheTime = new Date(data?.createdAt).getTime();
                const ttl = (parseInt(process.env.RECOMM_CACHE_TTL_HOURS || '12') * 60 * 60 * 1000);

                if (Date.now() - cacheTime < ttl) {
                    res.json(data);
                    return;
                }
            }
        }

        let constraints: ParsedConstraints | null = null;

        if (mode === 'ai') {
            // Fetch latest constraints from prefs
            const prefsDoc = await db.collection('users').doc(uid).collection('prefs').doc('main').get();
            if (prefsDoc.exists && prefsDoc.data()?.lastParsedConstraints) {
                constraints = prefsDoc.data()?.lastParsedConstraints;
            } else {
                // If no constraints, we can't generate AI recs without text input. 
                // Client should have called interpret-taste first.
                res.status(400).json({ error: 'No AI constraints found. Please update taste.' });
                return;
            }
        } else if (mode === 'manual') {
            // Fetch manual prefs
            const prefsDoc = await db.collection('users').doc(uid).collection('prefs').doc('main').get();
            const data = prefsDoc.data();
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
                    explain: 'Based on your manual preferences'
                };
            }
        }

        if (!constraints) {
            res.status(400).json({ error: 'Could not determine constraints' });
            return;
        }

        // Generate Recommendations
        const results = await generateRecommendations(constraints);

        // Store in Firestore
        const recData = {
            createdAt: new Date().toISOString(),
            mode,
            constraints,
            items: results,
        };
        await db.collection('users').doc(uid).collection('recommendations').doc('latest').set(recData);

        res.json(recData);

    } catch (error) {
        console.error('Recommend error:', error);
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
    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

async function generateRecommendations(constraints: ParsedConstraints) {
    // Map constraints to TMDb discover params
    const params: any = {
        'vote_count.gte': 100,
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
    const data = await tmdbService.discoverMovies(params);

    // Map to client format
    return data.results.map((m: any) => ({
        id: m.id,
        title: m.title,
        poster_path: m.poster_path,
        reason: constraints.explain // Simple reason for now
    }));
}
