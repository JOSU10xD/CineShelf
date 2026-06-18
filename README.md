# 🎬 CineShelf 

[![Expo](https://img.shields.io/badge/Expo-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

CineShelf is a premium, state-of-the-art mobile application that transforms how users discover, organize, and experience movies and television series. Built with **React Native (Expo)**, **Firebase**, and **Node.js**, CineShelf couples modern glassmorphic aesthetics with a hybrid AI-powered recommendations engine to deliver a high-fidelity cinematic tracking space.

---

## ✨ Core Features & Characteristics

### 🧠 Hybrid AI & Manual Recommendations Engine
Discover movies through natural language or precise category matching:
* **Natural Language Processing**: Express what you want in simple text (e.g., *"crime thriller mohanlal movies"*, *"movie of a man who challenges death and sees a woman as manifestation of death"*). The backend leverages LLMs (via OpenRouter) to extract semantic constraints, genres, moods, and time periods.
* **TMDb Integration**: Leverages the official The Movie Database (TMDb) API to dynamically build candidate pools, providing matching titles and similar recommendations.
* **Smart Refresh & Variety Rotation**: Core matches stay stable at the top of your feed while surrounding recommendations cycle on refresh to keep discovery fresh and alive.
* **Manual Setup**: Filter movies directly by selecting favorite genres, moods, and languages.

### 🖖 Interactive & Responsive UI
* **Drag-and-Drop Watchlist**: Reorder your watchlist dynamically with smooth, native-like gesture responses powered by `React Native Reanimated` and `Gesture Handler`.
* **Zero-Flicker Navigation**: Tailored transitions with native window background configurations, eliminating transition white flashes and providing a continuous dark-mode atmosphere.
* **Startup Sequence**: A sleek startup branding animation that fades in seamlessly on boot and transitions instantly to your personalized feed.

### 🔐 Multi-Channel Authentication & Profile Customization
* **Google Sign-In & Guest Sessions**: Seamless onboarding. Users can browse immediately as a guest or sign in securely with Google to enable database sync.
* **Onboarding & Taste Flow**: Tailors the app on first launch via a fast genres selection interface, skipping setup automatically on subsequent sessions for returning users.
* **State Persistence**: AI prompts, manual configuration, and current recommendation results are cached globally to ensure zero-latency tab switching.

---

## 💼 Business & Monetization Ready

CineShelf is architected from the ground up to be scalable, production-ready, and optimized for business models:
* **Strategic Ad Spaces**: The layout contains designated layout containers designed for banner placements, interstitial video ads, and sponsored recommendation cards.
* **Analytics Integration**: Custom user profile documents in Firestore are ready to be integrated with analytic pipelines (e.g., Firebase Analytics, Mixpanel) to build detailed user segmentation models.
* **Server-Secured Secrets**: Core API keys (OpenRouter, TMDb, Firebase Admin SDK) are kept strictly backend-side, protecting your project from API key theft and ensuring compliance with secure development standards.

---

## 🛠️ Technology Stack & Architecture

CineShelf is divided into a client-side mobile app and a lightweight, stateless recommendation server:

### Client (Mobile)
* **Framework**: React Native with Expo SDK 54 & Expo Router (File-based navigation).
* **State & Performance**: Shared context hooks (`AppContext`), Reanimated UI-thread layout loops.
* **Database Client**: Firebase Client SDK (Firestore, Auth).

### Backend (Server)
* **Runtime**: Node.js with TypeScript & Express.
* **Services**: Firebase Admin SDK (token verification, prefs), TMDb API integrations, LLM prompt parser.
* **Safety**: Input validators, request body size limits, and security middleware.

---

## 🚀 Get Started

### Client Setup
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Configure your environment variables in a root `.env` file:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   EXPO_PUBLIC_API_BASE_URL=https://your-server.com/api/v1
   EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_key
   EXPO_PUBLIC_TMDB_ACCESS_TOKEN=your_tmdb_token
   ```
3. Start the bundler:
   ```bash
   npx expo start
   ```

### Backend Setup
1. Navigate to the server folder and install dependencies:
   ```bash
   cd server
   npm install
   ```
2. Add your server configurations in `server/.env`:
   ```env
   PORT=8080
   FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_account_json
   TMDB_API_KEY=your_tmdb_key
   TASTE_PROVIDER=openrouter
   OPENROUTER_API_KEY=your_openrouter_key
   ```
3. Compile and launch:
   ```bash
   npm run build
   npm start
   ```
