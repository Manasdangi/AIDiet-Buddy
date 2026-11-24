import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Button, Card, ErrorNote, Field, Segmented } from './ui';
import { useThemeColors, typography, spacing } from '../utils/theme';
import { ACTIVITY, GOALS, computeTargets, validateBody } from '../lib/targets';

// Shared by onboarding and the profile screen: body details in, personal daily targets out.
export default function BodyForm({ initial, submitLabel, onSubmit }) {
  const c = useThemeColors();
  const [goal, setGoal] = useState(initial?.goal || 'cutting');
  const [sex, setSex] = useState(initial?.sex || 'male');
  const [activity, setActivity] = useState(initial?.activity || 'light');
  const [age, setAge] = useState(initial ? String(initial.age) : '');
  const [height, setHeight] = useState(initial ? String(Number(initial.height_cm)) : '');
  const [weight, setWeight] = useState(initial ? String(Number(initial.weight_kg)) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const body = { age: parseInt(age, 10), heightCm: parseFloat(height), weightKg: parseFloat(weight) };
  const problem = validateBody(body);
  const targets = problem ? null : computeTargets({ goal, sex, activity, ...body });

  const submit = async () => {
    if (problem || !targets) return setError(problem || 'Check your details.');
    setBusy(true);
    setError('');
    try {
      await onSubmit({ goal, sex, activity, ...body, ...targets });
    } catch {
      setError('Could not save. Check your internet and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <Segmented label="GOAL" value={goal} onChange={setGoal} options={Object.entries(GOALS).map(([value, g]) => ({ value, label: g.label }))} />
      <Text style={{ ...typography.bodySecondary, color: c.textSecondary, marginTop: -8, marginBottom: spacing.md }}>{GOALS[goal].desc}</Text>
      <Segmented label="SEX (FOR CALORIE MATH)" value={sex} onChange={setSex} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
      <View style={{ flexDirection: 'row' }}>
        <Field label="AGE" value={age} onChangeText={setAge} keyboardType="number-pad" maxLength={3} placeholder="25" style={{ flex: 1, marginRight: spacing.sm }} />
        <Field label="HEIGHT (CM)" value={height} onChangeText={setHeight} keyboardType="decimal-pad" maxLength={5} placeholder="172" style={{ flex: 1, marginRight: spacing.sm }} />
        <Field label="WEIGHT (KG)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" maxLength={5} placeholder="70" style={{ flex: 1 }} />
      </View>
      <Segmented label="ACTIVITY" value={activity} onChange={setActivity}
        options={[{ value: 'sedentary', label: 'Low' }, { value: 'light', label: 'Light' }, { value: 'moderate', label: 'Medium' }, { value: 'active', label: 'High' }]} />
      <Text style={{ ...typography.bodySecondary, color: c.textSecondary, marginTop: -8, marginBottom: spacing.md }}>{ACTIVITY[activity].label}</Text>

      {targets ? (
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={{ ...typography.caption, color: c.textSecondary }}>YOUR DAILY TARGET</Text>
          <Text style={{ ...typography.h2, color: c.text, marginVertical: 4 }}>{targets.calories} kcal</Text>
          <Text style={{ ...typography.bodySecondary, color: c.textSecondary }}>
            Protein {targets.protein}g · Carbs {targets.carbs}g · Fat {targets.fat}g
          </Text>
          <Text style={{ ...typography.bodySecondary, color: c.textSecondary, marginTop: 8 }}>An estimate to start from, not medical advice.</Text>
        </Card>
      ) : null}
      <ErrorNote message={error} />
      <Button title={submitLabel} onPress={submit} loading={busy} disabled={!!problem} />
    </View>
  );
}
