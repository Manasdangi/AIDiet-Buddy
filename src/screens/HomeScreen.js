import React, { useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import useStore from '../store/useStore';
import { sumMeals } from '../services/meals';
import { Button, Card, ErrorNote, ProgressBar, round } from '../components/ui';
import MealRow from '../components/MealRow';
import { useThemeColors, typography, spacing } from '../utils/theme';

export default function HomeScreen({ navigation }) {
  const c = useThemeColors();
  const profile = useStore((s) => s.profile);
  const today = useStore((s) => s.today);
  const loadToday = useStore((s) => s.loadToday);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const theme = useStore((s) => s.theme);

  useFocusEffect(useCallback(() => { loadToday(); }, [loadToday]));

  const total = sumMeals(today.meals);
  const left = profile.calories - total.calories;
  const over = left < 0;
  const goalLabel = { bulking: 'BULKING', cutting: 'CUTTING', maintain: 'MAINTAIN' }[profile.goal];

  const macro = (label, value, target, color) => (
    <Card style={{ flex: 1, marginHorizontal: 4 }}>
      <Text style={{ ...typography.caption, color: c.textSecondary }}>{label}</Text>
      <Text style={{ ...typography.h2, color, marginVertical: 4 }}>{round(value)}g</Text>
      <ProgressBar value={value} max={target} color={color} />
      <Text style={{ ...typography.bodySecondary, color: c.textSecondary, marginTop: 6 }}>of {target}g</Text>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
        <View>
          <Text style={{ ...typography.h2, color: c.text }}>Diet<Text style={{ color: c.primary }}>Buddy</Text></Text>
          <Text style={{ ...typography.caption, color: c.primary }}>{goalLabel}</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} accessibilityRole="button" accessibilityLabel="Switch theme" style={{ padding: 8 }}>
          <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={22} color={c.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg - 4, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={today.loading} onRefresh={loadToday} tintColor={c.primary} />}>
        <View style={{ paddingHorizontal: 4 }}>
          <ErrorNote message={today.error} onRetry={loadToday} />
          <Card style={{ marginBottom: spacing.sm }}>
            <Text style={{ ...typography.caption, color: c.textSecondary }}>TODAY</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginVertical: 4 }}>
              <Text style={{ ...typography.h1, fontSize: 44, color: c.text }}>{round(total.calories)}</Text>
              <Text style={{ ...typography.h3, color: c.textSecondary }}> / {profile.calories} kcal</Text>
            </View>
            <ProgressBar value={total.calories} max={profile.calories} color={over ? c.error : c.primary} />
            <Text style={{ ...typography.bodySecondary, color: over ? c.error : c.textSecondary, marginTop: 8 }}>
              {over ? `${round(-left)} kcal over your target` : `${round(left)} kcal left`}
            </Text>
          </Card>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: spacing.sm }}>
          {macro('PROTEIN', total.protein, profile.protein, c.tertiary)}
          {macro('CARBS', total.carbs, profile.carbs, c.secondary)}
          {macro('FAT', total.fat, profile.fat, '#F59E0B')}
        </View>

        <View style={{ paddingHorizontal: 4 }}>
          <Text style={{ ...typography.h3, color: c.text, marginVertical: spacing.sm }}>Today&apos;s meals</Text>
          {today.meals.length === 0 && !today.loading ? (
            <Card style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
              <Ionicons name="restaurant-outline" size={32} color={c.textSecondary} />
              <Text style={{ ...typography.body, color: c.textSecondary, textAlign: 'center', marginVertical: spacing.sm }}>
                Nothing logged yet. Type, speak or snap your first meal.
              </Text>
              <Button title="Log a meal" onPress={() => navigation.navigate('Add')} style={{ paddingHorizontal: spacing.xl }} />
            </Card>
          ) : (
            today.meals.slice(0, 3).map((m) => <MealRow key={m.id} meal={m} />)
          )}
          {today.meals.length > 3 ? (
            <TouchableOpacity onPress={() => navigation.navigate('Log')} accessibilityRole="button" style={{ alignItems: 'center', padding: spacing.sm }}>
              <Text style={{ ...typography.bodySecondary, color: c.primary }}>See all {today.meals.length} meals</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
