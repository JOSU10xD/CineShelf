# Deployment Runbook

## Overview
The CineShelf server is deployed on **Render** as a Web Service.
URL: `[Pending Deployment]` (e.g., `https://cineshelf-server.onrender.com`)

## Deployment
Deployment is automated via GitHub Actions on the `deploy/server-free-host` branch.
1.  Push changes to `deploy/server-free-host`.
2.  GitHub Action runs tests.
3.  Render auto-deploys (if connected) or you can trigger it manually via Render Dashboard.

## Environment Variables
Set these in the Render Dashboard (Environment > Environment Variables):

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Server port | `8080` |
| `NODE_ENV` | Environment | `production` |
| `TMDB_API_KEY` | TMDb API Key | `...` |
| `OPENROUTER_API_KEY` | OpenRouter API Key | `...` |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Base64 encoded service account JSON | `ew...` |
| `RECOMM_CACHE_TTL_HOURS` | Cache duration | `12` |

### How to Generate `FIREBASE_SERVICE_ACCOUNT_BASE64`
Run this in your local terminal:
```bash
# Linux/Mac
base64 -i path/to/service-account.json | tr -d '\n'

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("path/to/service-account.json"))
```

## Monitoring
-   **Logs**: View logs in the Render Dashboard. Look for `OpenRouter 429` (rate limits) or `TMDb discover error`.
-   **Health Check**: `GET /health` returns `{"status":"ok", "uptime":...}`.
-   **Readiness**: `GET /ready` checks Firestore and TMDb connectivity.

## Troubleshooting
-   **Rate Limits**: If OpenRouter returns 429s, the server will retry with backoff. If it persists, consider upgrading the plan or switching providers.
-   **Cold Starts**: Free tier spins down after inactivity. First request might take 50s+.
