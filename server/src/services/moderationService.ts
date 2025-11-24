export const checkModeration = async (text: string) => {
    // Simple keyword based moderation for demo purposes
    // In production, use OpenAI Moderation API or similar
    const badWords = ['hate', 'kill', 'slur']; // Add actual slurs here
    const lower = text.toLowerCase();

    for (const word of badWords) {
        if (lower.includes(word)) {
            return {
                flagged: true,
                reason: 'Content contains inappropriate language.',
                sanitized: text.replace(new RegExp(word, 'gi'), '*'.repeat(word.length))
            };
        }
    }
    return { flagged: false };
};
