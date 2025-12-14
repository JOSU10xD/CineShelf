import { classifierService } from '../src/services/classifier';
import { tmdbDiscoverService } from '../src/services/tmdbDiscover';

async function verify() {
    console.log("Starting Verification...");

    // Test 1: Classification Logic
    const input = {
        title: "The Matrix",
        overview: "A computer hacker learns from mysterious rebels about the true nature of his reality.",
        release_date: "1999-03-31",
        user_text: "I want an action sci-fi movie"
    };

    console.log("\nTesting Classification with input:", input);
    const classification = await classifierService.classify(input);
    console.log("Classification Result:", JSON.stringify(classification, null, 2));

    if (classification.period?.start !== '1990-01-01' || !classification.genres.includes('Science Fiction')) {
        console.error("FAIL: Classification logic incorrect.");
    } else {
        console.log("PASS: Classification logic looks good.");
    }

    // Test 2: TMDB Discovery (Mocked call if no key, but logic check)
    if (!process.env.TMDB_API_KEY) {
        console.log("\nWARNING: TMDB_API_KEY not set. Skipping live TMDB call.");
        console.log("To run live test, set TMDB_API_KEY in environment.");
    } else {
        console.log("\nTesting TMDB Discovery...");
        try {
            const results = await tmdbDiscoverService.discover({
                genre_ids: classification.genre_ids,
                period: classification.period
            });
            console.log(`PASS: TMDB returned ${results.results?.length} results.`);
        } catch (error) {
            console.error("FAIL: TMDB call failed", error);
        }
    }
}

verify().catch(console.error);
