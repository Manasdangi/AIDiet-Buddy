import { supabase } from '../lib/supabase';
import { addDays, startOfDay } from '../lib/dates';

const COLS = 'id, logged_at, source, food_name, transcript, calories, protein, carbs, fat, confidence, notes';

export async function fetchMeals(fromDate, toDateExclusive) {
  const { data, error } = await supabase
    .from('meal_logs')
    .select(COLS)
    .gte('logged_at', fromDate.toISOString())
    .lt('logged_at', toDateExclusive.toISOString())
    .order('logged_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data;
}

export const fetchDay = (day) => fetchMeals(startOfDay(day), addDays(startOfDay(day), 1));

export async function saveMeal({ source, transcript, result }) {
  const { data, error } = await supabase
    .from('meal_logs')
    .insert({
      source,
      transcript: transcript || null,
      food_name: result.foodName,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      confidence: result.confidence,
      notes: result.notes || null,
    })
    .select(COLS)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMeal(id) {
  const { error } = await supabase.from('meal_logs').delete().eq('id', id);
  if (error) throw error;
}

export const sumMeals = (meals) =>
  meals.reduce(
    (t, m) => ({
      calories: t.calories + Number(m.calories || 0),
      protein: t.protein + Number(m.protein || 0),
      carbs: t.carbs + Number(m.carbs || 0),
      fat: t.fat + Number(m.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

// Sends text (typed or voice transcript) or a photo to the analyze-meal function, which calls Claude server-side.
export async function analyzeMeal({ source, text, imageBase64, mimeType }) {
  const { data, error } = await supabase.functions.invoke('analyze-meal', {
    body: { source, text, imageBase64, mimeType },
  });
  if (error) {
    let message = 'Could not reach the server. Check your internet and try again.';
    try {
      const body = await error.context?.json?.();
      if (body?.message) message = body.message;
      if (body?.error === 'ai_not_configured') message = 'AI analysis is not available yet. Please try again later.';
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  return data;
}
