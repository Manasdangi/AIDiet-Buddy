import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Button, ErrorNote, Field } from '../components/ui';
import { signInWithGoogle } from '../services/auth';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, typography, spacing } from '../utils/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen() {
  const c = useThemeColors();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);

  const submit = async () => {
    setError('');
    setInfo('');
    const e = email.trim().toLowerCase();
    if (!EMAIL_RE.test(e)) return setError('Enter a valid email address.');
    if (mode === 'signup' && password.length < 8) return setError('Use a password with at least 8 characters.');
    if (!password) return setError('Enter your password.');
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email: e, password });
        if (err) throw err;
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email: e, password });
        if (err) throw err;
        if (!data.session) {
          setInfo('Check your email and confirm your address, then sign in.');
          setMode('signin');
        }
      }
    } catch (err) {
      const m = String(err?.message || '');
      if (/invalid login/i.test(m)) setError('Wrong email or password.');
      else if (/email not confirmed/i.test(m)) setError('Please confirm your email first. Check your inbox.');
      else if (/already registered|already been registered/i.test(m)) setError('This email already has an account. Try signing in.');
      else if (/rate limit|too many/i.test(m)) setError('Too many attempts. Please wait a few minutes.');
      else if (/network|fetch/i.test(m)) setError('No internet connection.');
      else setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError('');
    setInfo('');
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const m = String(err?.message || '');
      if (/provider is not enabled|unsupported provider/i.test(m)) setError('Google sign-in is not set up yet. Use email for now.');
      else if (/network|fetch/i.test(m)) setError('No internet connection.');
      else setError('Google sign-in did not finish. Please try again.');
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <Text style={{ ...typography.h1, fontSize: 44, color: c.text, textAlign: 'center' }}>Diet<Text style={{ color: c.primary }}>Buddy</Text></Text>
          <Text style={{ ...typography.bodySecondary, color: c.textSecondary, textAlign: 'center', marginBottom: spacing.xl, marginTop: 4 }}>
            Track calories by typing, talking or snapping a photo.
          </Text>
          <Field label="EMAIL" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" placeholder="you@example.com" />
          <Field label="PASSWORD" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" textContentType={mode === 'signup' ? 'newPassword' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} onSubmitEditing={submit} />
          <ErrorNote message={error} />
          {info ? <Text style={{ ...typography.bodySecondary, color: c.tertiary, marginBottom: spacing.md }}>{info}</Text> : null}
          <Button title={mode === 'signin' ? 'Sign in' : 'Create account'} onPress={submit} loading={busy} disabled={googleBusy} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg }}>
            <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
            <Text style={{ ...typography.bodySecondary, color: c.textSecondary, marginHorizontal: spacing.sm }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
          </View>
          <Button title="Continue with Google" variant="ghost" onPress={google} loading={googleBusy} disabled={busy}
            icon={<Ionicons name="logo-google" size={18} color={c.text} style={{ marginRight: 10 }} />} />
          <TouchableOpacity onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo(''); }} style={{ marginTop: spacing.lg, alignItems: 'center' }} accessibilityRole="button">
            <Text style={{ ...typography.bodySecondary, color: c.textSecondary }}>
              {mode === 'signin' ? "New here? " : 'Already have an account? '}
              <Text style={{ color: c.primary, fontFamily: 'Outfit_600SemiBold' }}>{mode === 'signin' ? 'Create an account' : 'Sign in'}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
