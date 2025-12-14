import React from 'react';
import ProfileSetupScreen from './profile-setup';

export default function AiRecommendRoute() {
    // AI Recommend is also the "taste" step, but maybe we pre-set mode to 'ai'?
    // ProfileSetup defaults tasteMode to 'manual'.
    // We can add a prop for that too if needed, but for now just opening the taste screen is sufficient.
    // The user can toggle to AI.
    return <ProfileSetupScreen initialStep="taste" initialMode="ai" />;
}
