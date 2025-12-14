
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/v1/recommend';

async function testRecommend() {
    try {
        console.log('Testing Recommend Endpoint (Guest Mode, AI Mode)...');
        const response = await axios.post(API_URL, {
            mode: 'ai',
            forceRefresh: true,
            preferences: {
                // Mock constraints simulating what Client sends
                lastParsedConstraints: {
                    input: 'test',
                    genres: [{ name: 'Action', confidence: 1 }],
                    yearRange: { from: 2000, to: 2020 },
                    languages: ['en'],
                    explain: 'Test explanation'
                }
            }
        });
        console.log('Success!', response.status);
        console.log('Example Item:', response.data.items?.[0]?.title);
    } catch (error: any) {
        console.error('Recommend Failed:', error.response?.status);
        console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    }
}

testRecommend();
