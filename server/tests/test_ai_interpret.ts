
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/v1/interpret-taste';

async function testInterpret() {
    try {
        console.log('Testing Interpret Taste (AI)...');
        const response = await axios.post(API_URL, {
            text: "I like action movies from the 90s"
        });
        console.log('Success!', response.status);
        console.log('Result:', JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        console.error('Interpret Failed:', error.response?.status);
        console.error('Error Details:', JSON.stringify(error.response?.data, null, 2));
    }
}

testInterpret();
