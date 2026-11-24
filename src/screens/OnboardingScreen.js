import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useStore from '../store/useStore';
import BodyForm from '../components/BodyForm';
import { useThemeColors, typography, spacing } from '../utils/theme';

export default function OnboardingScreen() {
  const c = useThemeColors();
  const saveProfile = useStore((s) => s.saveProfile);
  const signOut = useStore((s) => s.signOut);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text style={{ ...typography.h1, color: c.text }}>Let&apos;s set your target</Text>
        <Text style={{ ...typography.bodySecondary, color: c.textSecondary, marginTop: 4, marginBottom: spacing.lg }}>
          Tell us a little about you and we&apos;ll work out a daily calorie and macro goal.
        </Text>
        <BodyForm submitLabel="Start tracking" onSubmit={saveProfile} />
        <TouchableOpacity onPress={signOut} style={{ alignItems: 'center', marginTop: spacing.lg }} accessibilityRole="button">
          <Text style={{ ...typography.bodySecondary, color: c.textSecondary }}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
