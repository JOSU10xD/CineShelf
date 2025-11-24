import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { apiRoutes } from './routes/api';
import { initializeFirebase } from './services/firebaseService';
import { tmdbService } from './services/tmdbService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Initialize Services
initializeFirebase();
tmdbService.initialize();

// Routes
app.use('/api/v1', apiRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/ready', async (req, res) => {
    try {
        // Check Firestore
        await import('./services/firebaseService').then(m => m.db.listCollections());
        // Check TMDb
        const tmdbHealthy = await tmdbService.healthCheck();
        if (!tmdbHealthy) throw new Error('TMDb unreachable');
        res.json({ status: 'ready' });
    } catch (error) {
        res.status(503).json({ status: 'not ready', error: String(error) });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
