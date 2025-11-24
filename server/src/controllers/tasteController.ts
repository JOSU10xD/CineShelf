import { Request, Response } from 'express';
import { auth } from '../services/firebaseService';
import { checkModeration } from '../services/moderationService';
import { OpenRouterAdapter } from '../services/taste/openRouterAdapter';

const provider = new OpenRouterAdapter(); // Could be dynamic based on env

export const interpretTaste = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        await auth.verifyIdToken(token);

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
    } catch (error) {
        console.error('Interpret taste error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
