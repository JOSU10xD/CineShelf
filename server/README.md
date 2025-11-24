# CineShelf Recommendation Server

This server handles taste interpretation (via LLM) and recommendation generation (via TMDb) for the CineShelf app.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Copy `.env.example` to `.env` and fill in the values.
    - `FIREBASE_SERVICE_ACCOUNT_PATH`: Path to your Firebase Admin service account JSON.
    - `FIREBASE_SERVICE_ACCOUNT_BASE64`: (Optional) Base64 encoded service account JSON (for deployment).
    - `TMDB_API_KEY`: Your TMDb API key.
    - `OPENROUTER_API_KEY`: Your OpenRouter API key (if using OpenRouter).
    - `RECOMM_CACHE_TTL_HOURS`: Cache duration in hours (default: 12).

3.  **Run Server**:
    ```bash
    npm run dev
    ```

## Deployment

This server is configured for deployment on **Render**.

1.  **Push to GitHub**: Push the code to the `deploy/server-free-host` branch.
2.  **Connect to Render**: Create a new Web Service on Render and connect your repository.
3.  **Configure Environment**: Set the environment variables in the Render Dashboard.
    - See `DEPLOY_RUNBOOK.md` for detailed instructions on generating `FIREBASE_SERVICE_ACCOUNT_BASE64`.

## Endpoints

-   `POST /api/v1/interpret-taste`: Parse free-text taste into structured constraints.
-   `POST /api/v1/recommend`: Generate recommendations based on AI constraints or manual preferences.
-   `GET /api/v1/recommend`: Get cached recommendations.
-   `GET /health`: Health check (returns uptime).
-   `GET /ready`: Readiness check (verifies Firestore/TMDb connectivity).

## Provider Swapping

To swap the AI provider, change `TASTE_PROVIDER` in `.env`.
Currently supported: `openrouter`.

## Testing

Run tests with:
```bash
npm test
```

Run smoke tests (requires running server):
```bash
./tests/smoke.sh http://localhost:8080
```
