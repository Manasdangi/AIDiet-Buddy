import { supabase } from '../lib/supabase';

export async function fetchProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveProfile(userId, p) {
  const row = {
    user_id: userId,
    goal: p.goal,
    sex: p.sex,
    age: p.age,
    height_cm: p.heightCm,
    weight_kg: p.weightKg,
    activity: p.activity,
    calories: p.calories,
    protein: p.protein,
    carbs: p.carbs,
    fat: p.fat,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('profiles').upsert(row).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteAccount() {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  await supabase.auth.signOut({ scope: 'local' });
}
