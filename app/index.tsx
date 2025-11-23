import { Redirect } from 'expo-router';
import React from 'react';

// This file handles the root route (/) and redirects to the auth screen.
// The _layout.tsx will intercept this and redirect based on auth state,
// but having this file prevents 404 errors on web.
export default function Index() {
    return <Redirect href="/auth" />;
}
