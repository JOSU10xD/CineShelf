import { Request, Response } from 'express';
import { classifierService } from '../services/classifier';
import { tmdbDiscoverService } from '../services/tmdbDiscover';

export const classifyAndRecommend = async (req: Request, res: Response) => {
    try {
        const { title, overview, release_date, user_text, page, manual_genres, randomize } = req.body;

        // 1. Classify
        const classification = await classifierService.classify({
            title,
            overview,
            release_date,
            user_text
        });

        // Merge AI-detected genres with manually selected genres
        let combinedGenreIds = classification.genre_ids;
        if (Array.isArray(manual_genres) && manual_genres.length > 0) {
            // Ensure distinct and valid numbers
            const manualIds = manual_genres.map(g => Number(g)).filter(n => !isNaN(n));
            combinedGenreIds = Array.from(new Set([...classification.genre_ids, ...manualIds]));
        }

        // Determine page for randomization
        let discoverPage = page || 1;
        if (randomize) {
            // Pick a random page between 1 and 20 to show "something from below" or random
            discoverPage = Math.floor(Math.random() * 20) + 1;
        }

        // 2. Discover
        const recommendations = await tmdbDiscoverService.discover({
            genre_ids: combinedGenreIds,
            period: classification.period,
            page: discoverPage
        });

        res.json({
            classification,
            recommendations
        });

    } catch (error) {
        console.error("Classify and Recommend Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
