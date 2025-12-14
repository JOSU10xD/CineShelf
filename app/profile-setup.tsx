import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
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
import { recommendationApi } from '../services/recommendationApi';
import { tmdbService } from '../services/tmdb';

// Avatar assets mapping
const AVATARS = [
    { id: 1, source: { uri: 'https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg' } },
    { id: 2, source: { uri: 'https://img.freepik.com/free-psd/3d-illustration-person-with-pink-hair_23-2149436186.jpg' } },
    { id: 3, source: { uri: 'https://img.freepik.com/free-psd/3d-illustration-person-with-glasses_23-2149436190.jpg' } },
    { id: 4, source: { uri: 'https://img.freepik.com/free-psd/3d-illustration-person_23-2149436192.jpg' } },
];

const MOODS = ['Uplifting', 'Melancholic', 'Nostalgic', 'Action-packed', 'Romantic', 'Dark', 'Thought-provoking', 'Relaxing'];

export default function ProfileSetupScreen({ initialStep, initialMode }: { initialStep?: 'profile' | 'taste', initialMode?: 'manual' | 'ai' }) {
    const { user } = useAuth();
    const { saveUserProfile } = useUserProfile(user?.uid);
    const { theme } = useTheme();
    const router = useRouter();

    const params = useLocalSearchParams();
    const [step, setStep] = useState<'profile' | 'taste'>(initialStep || (params.initialStep as 'profile' | 'taste') || 'profile');

    // Profile State
    const [username, setUsername] = useState('');
    const [selectedAvatarId, setSelectedAvatarId] = useState<number>(1);
    const [saving, setSaving] = useState(false);

    // Taste State
    const [tasteMode, setTasteMode] = useState<'manual' | 'ai'>(initialMode || 'manual');
    const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
    const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
    const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
    const [tasteText, setTasteText] = useState('');
    const [parsedConstraints, setParsedConstraints] = useState<any>(null);
    const [parsing, setParsing] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (step === 'taste') {
            loadGenres();
        }
    }, [step]);

    const loadGenres = async () => {
        const g = await tmdbService.getGenres();
        setGenres(g);
    };

    const handleSaveProfile = async () => {
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
            setStep('taste');
        } catch (error) {
            Alert.alert('Error', 'Failed to save profile');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const toggleGenre = (id: number) => {
        if (selectedGenres.includes(id)) {
            setSelectedGenres(selectedGenres.filter(g => g !== id));
        } else {
            setSelectedGenres([...selectedGenres, id]);
        }
    };

    const toggleMood = (mood: string) => {
        if (selectedMoods.includes(mood)) {
            setSelectedMoods(selectedMoods.filter(m => m !== mood));
        } else {
            setSelectedMoods([...selectedMoods, mood]);
        }
    };

    const handleParseTaste = async () => {
        if (!tasteText.trim()) return;
        setParsing(true);
        try {
            const result = await recommendationApi.interpretTaste(tasteText);
            setParsedConstraints(result);
        } catch (error) {
            Alert.alert('Error', 'Failed to interpret taste');
        } finally {
            setParsing(false);
        }
    };

    const handleFinish = async () => {
        if (!user) return;
        setGenerating(true);
        try {
            const db = getFirestore();
            const prefsRef = doc(db, 'users', user.uid, 'prefs', 'main');

            if (tasteMode === 'manual') {
                const manualPrefs = {
                    manualGenres: selectedGenres,
                    manualMoods: selectedMoods,
                };

                // Try to save, but ignore permissions error
                try {
                    await setDoc(prefsRef, {
                        ...manualPrefs,
                        tasteText: null,
                        lastParsedConstraints: null
                    }, { merge: true });
                } catch (e) { console.log("Skipping DB save (guest/perm issues)"); }

                // Save to ProfileContext (handles local storage for Guest)
                await saveUserProfile({
                    uid: user.uid,
                    preferences: {
                        mode: 'manual',
                        manualGenres: selectedGenres,
                        manualMoods: selectedMoods
                    }
                });

                // Pass prefs directly to bypass DB read on server
                await recommendationApi.recommend('manual', true, manualPrefs);

            } else {
                if (!tasteText.trim()) {
                    Alert.alert('Details Needed', 'Please describe what you want to watch.');
                    setGenerating(false);
                    return;
                }

                // Parse first
                let constraints = parsedConstraints;
                if (!constraints) {
                    try {
                        constraints = await recommendationApi.interpretTaste(tasteText);
                        setParsedConstraints(constraints);
                    } catch (err) {
                        console.error(err);
                        Alert.alert('Error', 'Failed to interpret your request.');
                        setGenerating(false);
                        return;
                    }
                }

                // Try to save
                try {
                    await setDoc(prefsRef, {
                        tasteText: tasteText,
                        lastParsedConstraints: constraints,
                        manualGenres: [],
                        manualMoods: []
                    }, { merge: true });
                } catch (e) { console.log("Skipping DB save (guest/perm issues)"); }

                // Save to ProfileContext
                await saveUserProfile({
                    uid: user.uid,
                    preferences: {
                        mode: 'ai',
                        lastParsedConstraints: constraints,
                        tasteText: tasteText
                    }
                });

                // Pass constraints directly
                await recommendationApi.recommend('ai', true, { lastParsedConstraints: constraints });
            }
            router.replace('/(tabs)/discover' as any);
        } catch (error) {
            console.error('Finish error:', error);
            Alert.alert('Error', 'Failed to get recommendations');
        } finally {
            setGenerating(false);
        }
    };

    const handleSkip = () => {
        router.replace('/(tabs)/discover' as any);
    };

    if (step === 'profile') {
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
                        onPress={handleSaveProfile}
                        disabled={saving}
                    >
                        <Text style={styles.saveButtonText}>
                            {saving ? 'Saving...' : 'Next: Taste Preferences'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.title, { color: theme.colors.primary }]}>Your Taste</Text>
                <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>
                    Help us recommend movies you'll love
                </Text>

                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, tasteMode === 'manual' && { backgroundColor: theme.colors.primary }]}
                        onPress={() => setTasteMode('manual')}
                    >
                        <Text style={[styles.toggleText, tasteMode === 'manual' && { color: '#fff' }]}>Manual</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, tasteMode === 'ai' && { backgroundColor: theme.colors.primary }]}
                        onPress={() => setTasteMode('ai')}
                    >
                        <Text style={[styles.toggleText, tasteMode === 'ai' && { color: '#fff' }]}>AI Magic</Text>
                    </TouchableOpacity>
                </View>

                {tasteMode === 'manual' ? (
                    <>
                        <Text style={[styles.label, { color: theme.colors.text, marginTop: 20 }]}>Favorite Genres</Text>
                        <View style={styles.chipContainer}>
                            {genres.map((g) => (
                                <TouchableOpacity
                                    key={g.id}
                                    style={[
                                        styles.chip,
                                        { borderColor: theme.colors.border },
                                        selectedGenres.includes(g.id) && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                                    ]}
                                    onPress={() => toggleGenre(g.id)}
                                >
                                    <Text style={[styles.chipText, { color: selectedGenres.includes(g.id) ? '#fff' : theme.colors.text }]}>
                                        {g.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.label, { color: theme.colors.text, marginTop: 20 }]}>Current Mood</Text>
                        <View style={styles.chipContainer}>
                            {MOODS.map((m) => (
                                <TouchableOpacity
                                    key={m}
                                    style={[
                                        styles.chip,
                                        { borderColor: theme.colors.border },
                                        selectedMoods.includes(m) && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                                    ]}
                                    onPress={() => toggleMood(m)}
                                >
                                    <Text style={[styles.chipText, { color: selectedMoods.includes(m) ? '#fff' : theme.colors.text }]}>
                                        {m}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                ) : (
                    <>
                        <Text style={[styles.label, { color: theme.colors.text, marginTop: 20 }]}>Describe what you're looking for</Text>
                        <TextInput
                            style={[
                                styles.textArea,
                                {
                                    backgroundColor: theme.colors.card,
                                    color: theme.colors.text,
                                    borderColor: theme.colors.border
                                }
                            ]}
                            value={tasteText}
                            onChangeText={setTasteText}
                            placeholder="e.g., 80s sci-fi with synthwave vibes, or sad romantic movies"
                            placeholderTextColor={theme.colors.secondary}
                            multiline
                            numberOfLines={4}
                        />
                    </>
                )}

                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        { backgroundColor: theme.colors.primary },
                        generating && { opacity: 0.7 }
                    ]}
                    onPress={handleFinish}
                    disabled={generating}
                >
                    <Text style={styles.saveButtonText}>
                        {generating ? 'Finding Movies...' : 'Show Recommendations'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSkip} style={{ marginTop: 16, alignItems: 'center' }}>
                    <Text style={{ color: theme.colors.secondary }}>Skip for now</Text>
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
        marginBottom: 30,
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
    textArea: {
        height: 100,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        textAlignVertical: 'top',
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
        marginTop: 40,
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
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#e0e0e0', // Fallback
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    toggleText: {
        fontWeight: '600',
        color: '#666',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    smallButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    smallButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    previewBox: {
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    previewTitle: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
});
