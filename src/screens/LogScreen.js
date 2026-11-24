import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import useStore from '../store/useStore';
import { deleteMeal, fetchDay, sumMeals } from '../services/meals';
import { addDays, dayLabel, isSameDay, startOfDay } from '../lib/dates';
import { Card, ErrorNote, round } from '../components/ui';
import MealRow from '../components/MealRow';
import { useThemeColors, typography, spacing } from '../utils/theme';

export default function LogScreen({ route }) {
  const c = useThemeColors();
  const profile = useStore((s) => s.profile);
  const loadToday = useStore((s) => s.loadToday);
  const [day, setDay] = useState(startOfDay());
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // History taps pass a date to open.
  useEffect(() => {
    const d = route?.params?.date;
    if (d) setDay(startOfDay(new Date(d)));
  }, [route?.params?.date]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setMeals(await fetchDay(day));
    } catch {
      setError('Could not load meals. Check your internet.');
    } finally {
      setLoading(false);
    }
  }, [day]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = (meal) =>
    Alert.alert('Delete this entry?', `${meal.food_name} (${round(meal.calories)} kcal)`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteMeal(meal.id);
            setMeals((m) => m.filter((x) => x.id !== meal.id));
            loadToday();
          } catch {
            Alert.alert('Could not delete', 'Please try again.');
          }
        },
      },
    ]);

  const total = sumMeals(meals);
  const isToday = isSameDay(day, new Date());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
        <TouchableOpacity onPress={() => setDay(addDays(day, -1))} accessibilityRole="button" accessibilityLabel="Previous day" style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={{ ...typography.h2, color: c.text }}>{dayLabel(day)}</Text>
        <TouchableOpacity onPress={() => setDay(addDays(day, 1))} disabled={isToday} accessibilityRole="button" accessibilityLabel="Next day" style={{ padding: 8, opacity: isToday ? 0.3 : 1 }}>
          <Ionicons name="chevron-forward" size={24} color={c.text} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={meals}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={c.primary} />}
        ListHeaderComponent={
          <View>
            <ErrorNote message={error} onRetry={load} />
            <Card style={{ marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between' }}>
              {[['KCAL', total.calories, `/${profile.calories}`], ['PROTEIN', total.protein, 'g'], ['CARBS', total.carbs, 'g'], ['FAT', total.fat, 'g']].map(([l, v, u]) => (
                <View key={l} style={{ alignItems: 'center' }}>
                  <Text style={{ ...typography.caption, color: c.textSecondary }}>{l}</Text>
                  <Text style={{ ...typography.h3, color: c.text }}>{round(v)}<Text style={{ ...typography.bodySecondary, color: c.textSecondary }}>{u}</Text></Text>
                </View>
              ))}
            </Card>
          </View>
        }
        ListEmptyComponent={!loading && !error ? <Text style={{ ...typography.body, color: c.textSecondary, textAlign: 'center', marginTop: spacing.xl }}>No meals logged {isToday ? 'yet today' : 'this day'}.</Text> : null}
        renderItem={({ item }) => <MealRow meal={item} onDelete={remove} />}
      />
    </SafeAreaView>
  );
}
