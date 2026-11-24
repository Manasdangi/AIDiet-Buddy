import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import useStore from '../store/useStore';
import { fetchMeals, sumMeals } from '../services/meals';
import { addDays, dayKey, startOfDay } from '../lib/dates';
import { Card, ErrorNote, round } from '../components/ui';
import { useThemeColors, typography, spacing } from '../utils/theme';

const DAYS = 14;

export default function HistoryScreen({ navigation }) {
  const c = useThemeColors();
  const target = useStore((s) => s.profile.calories);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const today = startOfDay();
      const from = addDays(today, -(DAYS - 1));
      const meals = await fetchMeals(from, addDays(today, 1));
      const byDay = {};
      meals.forEach((m) => { (byDay[dayKey(new Date(m.logged_at))] ||= []).push(m); });
      setDays(Array.from({ length: DAYS }, (_, i) => {
        const d = addDays(from, i);
        return { date: d, count: (byDay[dayKey(d)] || []).length, ...sumMeals(byDay[dayKey(d)] || []) };
      }));
    } catch {
      setError('Could not load your history. Check your internet.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const logged = days.filter((d) => d.count > 0);
  const avg = logged.length ? logged.reduce((s, d) => s + d.calories, 0) / logged.length : 0;
  const scale = Math.max(target * 1.3, ...days.map((d) => d.calories), 1);
  const H = 120;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={c.primary} />}>
        <Text style={{ ...typography.h2, color: c.text, marginBottom: spacing.md }}>History</Text>
        <ErrorNote message={error} onRetry={load} />
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={{ ...typography.caption, color: c.textSecondary }}>DAILY AVERAGE · LAST {DAYS} DAYS</Text>
          <Text style={{ ...typography.h1, color: c.text }}>{logged.length ? round(avg) : '–'}<Text style={{ ...typography.bodySecondary, color: c.textSecondary }}> kcal</Text></Text>
          <Text style={{ ...typography.bodySecondary, color: c.textSecondary }}>Target {target} kcal · logged on {logged.length} of {DAYS} days</Text>
          <View style={{ height: H, flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.md }}>
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: (target / scale) * H, borderTopWidth: 1, borderStyle: 'dashed', borderColor: c.textSecondary }} />
            {days.map((d) => (
              <View key={dayKey(d.date)} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: H }}>
                <View style={{ width: '60%', height: Math.max((d.calories / scale) * H, d.count ? 3 : 0), borderRadius: 4, backgroundColor: d.calories > target ? c.error : c.primary }} />
              </View>
            ))}
          </View>
        </Card>
        {[...days].reverse().map((d) => (
          <TouchableOpacity key={dayKey(d.date)} activeOpacity={0.7} accessibilityRole="button" onPress={() => navigation.navigate('Log', { date: d.date.toISOString() })}>
            <Card style={{ marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ ...typography.h3, fontSize: 16, color: c.text }}>{d.date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
                <Text style={{ ...typography.bodySecondary, color: c.textSecondary }}>{d.count ? `${d.count} meal${d.count > 1 ? 's' : ''} · P ${round(d.protein)}g · C ${round(d.carbs)}g · F ${round(d.fat)}g` : 'No meals logged'}</Text>
              </View>
              <Text style={{ ...typography.h3, color: d.count ? (d.calories > target ? c.error : c.text) : c.textSecondary }}>{d.count ? round(d.calories) : '–'}</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
