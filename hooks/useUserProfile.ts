import { useProfile } from '../contexts/ProfileContext';

export function useUserProfile(uid?: string) {
    // We ignore the uid argument because the context already handles it based on the authenticated user.
    // This maintains backward compatibility with the existing hook signature.
    return useProfile();
}
