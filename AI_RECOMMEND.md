# AI Recommendation Pipeline

This module provides a robust movie recommendation system based on content classification and TMDB discovery.

## Features
- **Classification**: Extracts genres and time periods (decades/years) from movie metadata (title, overview, release date) or user input.
- **Discovery**: Uses extracted tags to query TMDB's advanced discovery API for highly relevant recommendations.
- **Deterministic Fallback**: Uses keyword matching against standard TMDB genres if no robust AI model is connected.

## API Endpoint
`POST /api/v1/classify-and-recommend`

### Request Body
```json
{
  "title": "Inception",
  "overview": "A thief who steals corporate secrets through the use of dream-sharing technology...",
  "release_date": "2010-07-16",
  "user_text": "I like mind-bending sci-fi",
  "page": 1
}
```

### Response
```json
{
  "classification": {
    "genres": ["Science Fiction", "Action", "Adventure"],
    "genre_ids": [878, 28, 12],
    "period": { "start": "2010-01-01", "end": "2019-12-31" },
    "confidence": 0.85
  },
  "recommendations": {
    "page": 1,
    "results": [ ... ],
    "total_pages": ...
  }
}
```

## Setup & Testing

### Environment Variables
Ensure `TMDB_API_KEY` is set in `server/.env`.
```
TMDB_API_KEY=your_tmdb_api_key_here
```

### Testing with cURL
```bash
curl -X POST http://localhost:8080/api/v1/classify-and-recommend \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Matrix",
    "overview": "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
    "release_date": "1999-03-30"
  }'
```

### Local Model (Optional)
To use a local LLM (e.g., Llama 2 via llama.cpp), you can modify `server/src/services/classifier.ts` to call a local inference server.
1. Run llama.cpp server: `./server -m models/llama-2-7b-chat.gguf -c 2048 --port 8081`
2. Update `classifier.ts` to POST to `http://localhost:8081/completion`.

## Deployment
For Vercel or other serverless platforms, ensure the `TMDB_API_KEY` is added to the project's environment variables.
