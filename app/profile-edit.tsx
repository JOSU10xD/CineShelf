import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { db } from '../services/firebase';

// Avatar assets mapping (same as Drawer)
const AVATARS: Record<string, any> = {
    '1': { uri: 'https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg' },
    '2': { uri: 'https://img.freepik.com/free-psd/3d-illustration-person-with-pink-hair_23-2149436186.jpg' },
    '3': { uri: 'https://img.freepik.com/free-psd/3d-illustration-person-with-glasses_23-2149436190.jpg' },
    '4': { uri: 'https://img.freepik.com/free-psd/3d-illustration-person_23-2149436192.jpg' },
};

export default function ProfileEditScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { user } = useAuth();
    const { profile } = useUserProfile(user?.uid);

    const [username, setUsername] = useState(profile?.username || '');
    const [selectedAvatar, setSelectedAvatar] = useState(String(profile?.avatarId || '1'));
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!user) return;
        if (!username.trim()) {
            Alert.alert('Error', 'Username cannot be empty');
            return;
        }

        setSaving(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                username: username.trim(),
                avatarId: parseInt(selectedAvatar),
                updatedAt: serverTimestamp()
            });
            router.back();
        } catch (error) {
            console.error("Error updating profile:", error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Edit Profile</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={[styles.saveButton, { opacity: saving ? 0.7 : 1 }]}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                        <Text style={[styles.saveText, { color: theme.colors.primary }]}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.colors.secondary }]}>Choose Avatar</Text>
                    <View style={styles.avatarGrid}>
                        {Object.keys(AVATARS).map((id) => (
                            <Pressable
                                key={id}
                                onPress={() => setSelectedAvatar(id)}
                                style={[
                                    styles.avatarOption,
                                    selectedAvatar === id && { borderColor: theme.colors.primary, borderWidth: 3 }
                                ]}
                            >
                                <Image source={AVATARS[id]} style={styles.avatarImage} />
                                {selectedAvatar === id && (
                                    <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
                                        <Ionicons name="checkmark" size={12} color="#fff" />
                                    </View>
                                )}
                            </Pressable>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.colors.secondary }]}>Username</Text>
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
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 60,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    saveButton: {
        padding: 8,
        minWidth: 60,
        alignItems: 'center',
    },
    saveText: {
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        padding: 24,
    },
    section: {
        marginBottom: 32,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'center',
    },
    avatarOption: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'transparent',
        position: 'relative',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    checkmark: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    input: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
    },
});
