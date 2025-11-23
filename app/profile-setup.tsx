import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';

// Avatar assets mapping
const AVATARS = [
    { id: 1, source: { uri: 'https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg' } },
    { id: 2, source: { uri: 'https://img.freepik.com/free-psd/3d-illustration-person-with-pink-hair_23-2149436186.jpg' } },
    { id: 3, source: { uri: 'https://img.freepik.com/free-psd/3d-illustration-person-with-glasses_23-2149436190.jpg' } },
    { id: 4, source: { uri: 'https://img.freepik.com/free-psd/3d-illustration-person_23-2149436192.jpg' } },
];

export default function ProfileSetupScreen() {
    const { user } = useAuth();
    const { saveUserProfile } = useUserProfile(user?.uid);
    const { theme } = useTheme();
    const router = useRouter();

    const [username, setUsername] = useState('');
    const [selectedAvatarId, setSelectedAvatarId] = useState<number>(1);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Please enter a username');
            return;
        }
        if (!user) return;

        setSaving(true);
        try {
            await saveUserProfile({
                uid: user.uid,
                email: user.email || '',
                username: username.trim(),
                avatarId: selectedAvatarId,
            });
            router.replace('/(tabs)/discover' as any);
        } catch (error) {
            Alert.alert('Error', 'Failed to save profile');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.title, { color: theme.colors.primary }]}>Setup Profile</Text>
                <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>
                    Choose a username and avatar
                </Text>

                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>Username</Text>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: theme.colors.card,
                                color: theme.colors.text,
                                borderColor: theme.colors.border
                            }
                        ]}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter username"
                        placeholderTextColor={theme.colors.secondary}
                        maxLength={20}
                    />
                </View>

                <Text style={[styles.label, { color: theme.colors.text, marginTop: 24 }]}>Choose Avatar</Text>
                <View style={styles.avatarGrid}>
                    {AVATARS.map((avatar) => (
                        <TouchableOpacity
                            key={avatar.id}
                            onPress={() => setSelectedAvatarId(avatar.id)}
                            style={[
                                styles.avatarOption,
                                selectedAvatarId === avatar.id && {
                                    borderColor: theme.colors.primary,
                                    borderWidth: 3
                                }
                            ]}
                        >
                            <Image source={avatar.source} style={styles.avatarImage} />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        { backgroundColor: theme.colors.primary },
                        saving && { opacity: 0.7 }
                    ]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={styles.saveButtonText}>
                        {saving ? 'Creating...' : 'Start Exploring'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 60,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 40,
    },
    inputContainer: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginTop: 8,
    },
    avatarOption: {
        width: 70,
        height: 70,
        borderRadius: 35,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    saveButton: {
        marginTop: 48,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
