import { Request, Response } from 'express';
import { auth } from '../services/firebaseService';
import { checkModeration } from '../services/moderationService';
import { OpenRouterAdapter } from '../services/taste/openRouterAdapter';

const provider = new OpenRouterAdapter(); // Could be dynamic based on env

export const interpretTaste = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (token && token !== 'undefined') {
            try {
                await auth.verifyIdToken(token);
            } catch (e) {
                // If token is invalid (e.g. expired guest token?), we might want to fail or just continue?
                // For interpret-taste (stateless), we can continue.
            }
        }
        // Proceed even if no token (Guest AI use is allowed)

        const { text } = req.body;
        if (!text) {
            res.status(400).json({ error: 'Text is required' });
            return;
        }

        // Moderation check
        const moderation = await checkModeration(text);
        if (moderation.flagged) {
            res.json({
                needsConfirmation: true,
                sanitizedSuggestion: moderation.sanitized,
                explain: moderation.reason
            });
            return;
        }

        const constraints = await provider.parseTaste(text);
        res.json(constraints);
    } catch (error: any) {
        console.error('Interpret taste error:', error);

        // Handle Firebase Auth errors (nested or top-level)
        const errorCode = error.code || error.errorInfo?.code;
        const errorMessage = error.message || '';

        if (errorCode?.startsWith('auth/') || errorMessage.includes('Decoding Firebase ID token failed')) {
            res.status(401).json({ error: 'Unauthorized', details: 'Invalid or expired token' });
            return;
        }

        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};
