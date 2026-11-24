import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, round } from './ui';
import { timeLabel } from '../lib/dates';
import { useThemeColors, typography, spacing } from '../utils/theme';

const ICON = { text: 'create-outline', image: 'camera-outline', audio: 'mic-outline' };

export default function MealRow({ meal, onDelete }) {
  const c = useThemeColors();
  return (
    <Card style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.surfaceLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm }}>
          <Ionicons name={ICON[meal.source] || 'restaurant-outline'} size={20} color={c.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...typography.h3, fontSize: 17, color: c.text }} numberOfLines={2}>{meal.food_name}</Text>
          <Text style={{ ...typography.bodySecondary, color: c.textSecondary }}>
            {timeLabel(meal.logged_at)} · P {round(meal.protein)}g · C {round(meal.carbs)}g · F {round(meal.fat)}g
          </Text>
          {meal.notes ? <Text style={{ ...typography.bodySecondary, color: c.textSecondary, marginTop: 4 }}>{meal.notes}</Text> : null}
        </View>
        <View style={{ alignItems: 'flex-end', marginLeft: spacing.sm }}>
          <Text style={{ ...typography.h3, color: c.text }}>{round(meal.calories)}</Text>
          <Text style={{ ...typography.caption, color: c.textSecondary }}>kcal</Text>
          {onDelete ? (
            <TouchableOpacity onPress={() => onDelete(meal)} accessibilityRole="button" accessibilityLabel={`Delete ${meal.food_name}`} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ marginTop: 8 }}>
              <Ionicons name="trash-outline" size={18} color={c.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
