import { OpenRouterAdapter } from '../src/services/taste/openRouterAdapter';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const provider = new OpenRouterAdapter();

async function run() {
    const prompt = process.argv[2] || 'malayalam classics';
    console.log(`Parsing taste for: "${prompt}"`);
    try {
        const constraints = await provider.parseTaste(prompt);
        console.log('Parsed Constraints:', JSON.stringify(constraints, null, 2));
    } catch (e: any) {
        console.error('Error during parsing:', e.message);
    }
}

run();
