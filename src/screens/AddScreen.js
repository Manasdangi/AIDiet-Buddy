import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import useStore from '../store/useStore';
import { analyzeMeal, saveMeal } from '../services/meals';
import { Button, round } from '../components/ui';
import { useThemeColors, typography, spacing, borderRadius } from '../utils/theme';

// Voice input uses on-device speech recognition. It needs a development/production build (not Expo Go).
let SpeechModule = null;
try {
  SpeechModule = require('expo-speech-recognition').ExpoSpeechRecognitionModule;
} catch {
  SpeechModule = null;
}

const WELCOME = { id: 'welcome', role: 'assistant', type: 'text', content: 'What did you eat? Type it, say it, or send a photo of your plate. I will estimate the calories and macros.' };
let counter = 0;
const nextId = () => `m${Date.now()}-${counter++}`;

export default function AddScreen() {
  const c = useThemeColors();
  const addTodayMeal = useStore((s) => s.addTodayMeal);
  const listRef = useRef(null);
  const [messages, setMessages] = useState([WELCOME]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [usedVoice, setUsedVoice] = useState(false);
  const [hindi, setHindi] = useState(false);

  const scroll = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  const push = (m) => { const id = nextId(); setMessages((p) => [...p, { id, ...m }]); scroll(); return id; };
  const patch = (id, changes) => setMessages((p) => p.map((m) => (m.id === id ? { ...m, ...changes } : m)));

  useEffect(() => {
    if (!SpeechModule) return undefined;
    const subs = [
      SpeechModule.addListener('result', (e) => { const t = e.results?.[0]?.transcript; if (t) setText(t); }),
      SpeechModule.addListener('end', () => setListening(false)),
      SpeechModule.addListener('error', (e) => {
        setListening(false);
        if (e?.error !== 'aborted' && e?.error !== 'no-speech') Alert.alert('Voice input', 'Could not hear that. Please try again or type instead.');
      }),
    ];
    return () => { subs.forEach((s) => s.remove()); try { SpeechModule.abort(); } catch { /* not listening */ } };
  }, []);

  const analyze = async ({ source, input, imageBase64, mimeType }) => {
    setBusy(true);
    const loadingId = push({ role: 'assistant', type: 'loading' });
    try {
      const result = await analyzeMeal({ source, text: input, imageBase64, mimeType });
      setMessages((p) => p.filter((m) => m.id !== loadingId));
      push({ role: 'assistant', type: 'result', result, source, transcript: source === 'image' ? '' : input, status: 'pending' });
    } catch (e) {
      setMessages((p) => p.filter((m) => m.id !== loadingId));
      push({ role: 'assistant', type: 'error', content: e.message || 'Something went wrong. Please try again.' });
      if (source !== 'image') setText(input);
    } finally {
      setBusy(false);
    }
  };

  const sendText = () => {
    const input = text.trim();
    if (input.length < 2 || busy) return;
    const source = usedVoice ? 'audio' : 'text';
    setText('');
    setUsedVoice(false);
    push({ role: 'user', type: 'text', content: input, voice: source === 'audio' });
    analyze({ source, input });
  };

  const sendPhoto = async (picked) => {
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    push({ role: 'user', type: 'image', uri: asset.uri });
    try {
      const img = await ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 1024 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true });
      await analyze({ source: 'image', imageBase64: img.base64, mimeType: 'image/jpeg' });
    } catch {
      push({ role: 'assistant', type: 'error', content: 'Could not read that photo. Please try another one.' });
    }
  };

  const pickPhoto = () => {
    if (busy) return;
    Alert.alert('Add a photo', undefined, [
      { text: 'Take photo', onPress: async () => {
        const p = await ImagePicker.requestCameraPermissionsAsync();
        if (!p.granted) return Alert.alert('Camera access needed', 'Allow camera access in Settings to photograph meals.');
        sendPhoto(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 }));
      } },
      { text: 'Choose from library', onPress: async () => {
        const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!p.granted) return Alert.alert('Photo access needed', 'Allow photo access in Settings to pick a meal photo.');
        sendPhoto(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 }));
      } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const toggleVoice = async () => {
    if (!SpeechModule) return Alert.alert('Voice input', 'Voice input is available in the installed app, not in Expo Go. You can type instead.');
    if (listening) { SpeechModule.stop(); return; }
    try {
      const perm = await SpeechModule.requestPermissionsAsync();
      if (!perm.granted) return Alert.alert('Microphone access needed', 'Allow microphone and speech recognition in Settings to use voice.');
      setText('');
      setUsedVoice(true);
      setListening(true);
      SpeechModule.start({ lang: hindi ? 'hi-IN' : 'en-IN', interimResults: true, continuous: false });
    } catch {
      setListening(false);
      Alert.alert('Voice input', 'Could not start voice input. Please type instead.');
    }
  };

  const save = async (msg) => {
    patch(msg.id, { status: 'saving' });
    try {
      const meal = await saveMeal({ source: msg.source, transcript: msg.transcript, result: msg.result });
      addTodayMeal(meal);
      patch(msg.id, { status: 'saved' });
    } catch {
      patch(msg.id, { status: 'pending' });
      Alert.alert('Could not save', 'Check your internet and try again.');
    }
  };

  const Avatar = () => (
    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
      <Ionicons name="sparkles" size={14} color="#FFF" />
    </View>
  );

  const renderItem = ({ item }) => {
    const user = item.role === 'user';
    const bubble = { maxWidth: '80%', padding: spacing.sm + 2, borderRadius: borderRadius.md, backgroundColor: user ? c.primary : c.surface, borderWidth: user ? 0 : 1, borderColor: c.border };
    return (
      <View style={{ flexDirection: 'row', justifyContent: user ? 'flex-end' : 'flex-start', marginBottom: spacing.sm, alignItems: 'flex-end' }}>
        {!user && <Avatar />}
        <View style={bubble}>
          {item.type === 'loading' && <ActivityIndicator color={c.primary} />}
          {item.type === 'text' && <Text style={{ ...typography.body, color: user ? '#FFF' : c.text }}>{item.voice ? '🎙 ' : ''}{item.content}</Text>}
          {item.type === 'error' && <Text style={{ ...typography.body, color: c.error }}>{item.content}</Text>}
          {item.type === 'image' && <Image source={{ uri: item.uri }} style={{ width: 200, height: 200, borderRadius: borderRadius.sm }} />}
          {item.type === 'result' && (
            <View style={{ minWidth: 220 }}>
              <Text style={{ ...typography.h3, color: c.text }}>{item.result.foodName}</Text>
              <Text style={{ ...typography.h2, color: c.primary, marginVertical: 4 }}>{round(item.result.calories)} kcal</Text>
              <Text style={{ ...typography.bodySecondary, color: c.textSecondary }}>
                Protein {round(item.result.protein)}g · Carbs {round(item.result.carbs)}g · Fat {round(item.result.fat)}g
              </Text>
              <Text style={{ ...typography.bodySecondary, color: c.textSecondary, marginTop: 4 }}>
                Confidence: {item.result.confidence}. {item.result.notes}
              </Text>
              {item.status === 'saved' ? (
                <Text style={{ ...typography.bodySecondary, color: c.tertiary, marginTop: 8 }}>✓ Added to today</Text>
              ) : item.status === 'discarded' ? (
                <Text style={{ ...typography.bodySecondary, color: c.textSecondary, marginTop: 8 }}>Discarded</Text>
              ) : (
                <View style={{ flexDirection: 'row', marginTop: spacing.sm }}>
                  <Button title="Add" onPress={() => save(item)} loading={item.status === 'saving'} style={{ flex: 1, paddingVertical: 10, marginRight: 8 }} />
                  <Button title="Discard" variant="ghost" onPress={() => patch(item.id, { status: 'discarded' })} disabled={item.status === 'saving'} style={{ flex: 1, paddingVertical: 10 }} />
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
        <Text style={{ ...typography.h2, color: c.text }}>Log a meal</Text>
      </View>
      <FlatList ref={listRef} data={messages} keyExtractor={(m) => m.id} renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }} keyboardShouldPersistTaps="handled"
        onContentSizeChange={scroll} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: 110, backgroundColor: c.background }}>
          <TouchableOpacity onPress={pickPhoto} disabled={busy} accessibilityRole="button" accessibilityLabel="Add photo" style={{ padding: 8, opacity: busy ? 0.4 : 1 }}>
            <Ionicons name="camera-outline" size={26} color={c.textSecondary} />
          </TouchableOpacity>
          <TextInput value={text} onChangeText={(t) => { setText(t); if (!t) setUsedVoice(false); }} multiline maxLength={500} editable={!busy}
            placeholder={listening ? 'Listening…' : 'e.g. 2 rotis, dal and a bowl of rice'} placeholderTextColor={c.textSecondary}
            accessibilityLabel="Meal description"
            style={{ flex: 1, ...typography.body, color: c.text, backgroundColor: c.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: c.border, paddingHorizontal: spacing.md, paddingTop: 10, paddingBottom: 10, maxHeight: 110, marginHorizontal: 4 }} />
          {text.trim().length >= 2 ? (
            <TouchableOpacity onPress={sendText} disabled={busy} accessibilityRole="button" accessibilityLabel="Send" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.5 : 1 }}>
              <Ionicons name="arrow-up" size={22} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={toggleVoice} disabled={busy} accessibilityRole="button" accessibilityLabel={listening ? 'Stop listening' : 'Voice input'} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: listening ? c.error : c.surfaceLight, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={listening ? 'stop' : 'mic-outline'} size={22} color={listening ? '#FFF' : c.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {SpeechModule ? (
          <TouchableOpacity onPress={() => setHindi(!hindi)} accessibilityRole="button" style={{ position: 'absolute', right: spacing.lg, bottom: 96 }}>
            <Text style={{ ...typography.caption, color: c.textSecondary }}>Voice: {hindi ? 'हिन्दी' : 'English'} (tap to switch)</Text>
          </TouchableOpacity>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
