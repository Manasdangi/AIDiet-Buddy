import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useStore from '../store/useStore';
import BodyForm from '../components/BodyForm';
import { Button, Card } from '../components/ui';
import { deleteAccount } from '../services/profile';
import { GOALS } from '../lib/targets';
import { confirmDialog, notify } from '../lib/dialog';
import { useThemeColors, typography, spacing } from '../utils/theme';

const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL;
const VERSION = require('../../app.json').expo.version;

export default function ProfileScreen() {
  const c = useThemeColors();
  const { session, profile, theme, toggleTheme, saveProfile, signOut } = useStore();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = () =>
    confirmDialog('Delete your account?', 'This permanently deletes your account and all your logged meals. This cannot be undone.', 'Delete forever', async () => {
      setDeleting(true);
      try {
        await deleteAccount();
      } catch {
        notify('Could not delete', 'Check your internet and try again.');
      } finally {
        setDeleting(false);
      }
    });

  const row = (label, onPress, danger) => (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border }}>
      <Text style={{ ...typography.body, color: danger ? c.error : c.text }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <Text style={{ ...typography.h2, color: c.text, marginBottom: spacing.md }}>Profile</Text>
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={{ ...typography.bodySecondary, color: c.textSecondary }}>{session?.user?.email}</Text>
          <Text style={{ ...typography.h3, color: c.text, marginTop: 4 }}>{GOALS[profile.goal].label} · {profile.calories} kcal/day</Text>
          <Text style={{ ...typography.bodySecondary, color: c.textSecondary }}>
            Protein {profile.protein}g · Carbs {profile.carbs}g · Fat {profile.fat}g
          </Text>
          <Text style={{ ...typography.bodySecondary, color: c.textSecondary }}>{Number(profile.weight_kg)} kg · {Number(profile.height_cm)} cm · {profile.age} yrs</Text>
        </Card>

        {editing ? (
          <View style={{ marginBottom: spacing.md }}>
            <BodyForm initial={profile} submitLabel="Save changes" onSubmit={async (p) => { await saveProfile(p); setEditing(false); }} />
            <Button title="Cancel" variant="ghost" onPress={() => setEditing(false)} style={{ marginTop: spacing.sm }} />
          </View>
        ) : (
          <View>
            {row('Edit body details and targets', () => setEditing(true))}
            {row(theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme', toggleTheme)}
            {PRIVACY_URL ? row('Privacy policy', () => Linking.openURL(PRIVACY_URL)) : null}
            {row('Sign out', signOut)}
            {row(deleting ? 'Deleting…' : 'Delete account', deleting ? undefined : confirmDelete, true)}
          </View>
        )}
        <Text style={{ ...typography.bodySecondary, color: c.textSecondary, textAlign: 'center', marginTop: spacing.xl }}>DietBuddy v{VERSION}</Text>
        <Text style={{ ...typography.bodySecondary, color: c.textSecondary, textAlign: 'center', marginTop: 4 }}>Calorie values are AI estimates, not medical advice.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
