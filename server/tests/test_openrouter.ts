import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENROUTER_API_KEY || '';
const url = 'https://openrouter.ai/api/v1/chat/completions';

async function run() {
    try {
        const response = await axios.post(
            url,
            {
                model: 'openrouter/free',
                messages: [
                    {
                        role: 'user',
                        content: 'Say hello in one word'
                    }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Response content:', response.data.choices[0].message.content);
    } catch (error: any) {
        console.error('Error status:', error.response?.status);
        console.error('Error data:', error.response?.data);
        console.error('Error message:', error.message);
    }
}

run();
