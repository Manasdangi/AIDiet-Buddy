// Daily calorie and macro targets from body details (Mifflin-St Jeor + activity factor).
export const ACTIVITY = {
  sedentary: { label: 'Mostly sitting', factor: 1.2 },
  light: { label: 'Light (1-3 workouts/week)', factor: 1.375 },
  moderate: { label: 'Moderate (3-5 workouts/week)', factor: 1.55 },
  active: { label: 'Very active (6-7 workouts/week)', factor: 1.725 },
};

export const GOALS = {
  cutting: { label: 'Cutting', desc: 'Lose fat with a calorie deficit.', delta: -0.2, proteinPerKg: 2.0 },
  maintain: { label: 'Maintain', desc: 'Stay at your current weight.', delta: 0, proteinPerKg: 1.6 },
  bulking: { label: 'Bulking', desc: 'Build muscle with a calorie surplus.', delta: 0.12, proteinPerKg: 1.8 },
};

export function computeTargets({ goal, sex, age, heightCm, weightKg, activity }) {
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
  const tdee = bmr * ACTIVITY[activity].factor;
  const g = GOALS[goal];
  const floor = sex === 'male' ? 1500 : 1200; // never suggest a crash-diet level
  const calories = Math.round(Math.max(tdee * (1 + g.delta), floor) / 10) * 10;
  const protein = Math.round(g.proteinPerKg * weightKg);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calories, protein, carbs, fat };
}

export function validateBody({ age, heightCm, weightKg }) {
  if (!(age >= 13 && age <= 100)) return 'Enter an age between 13 and 100.';
  if (!(heightCm >= 100 && heightCm <= 250)) return 'Enter a height between 100 and 250 cm.';
  if (!(weightKg >= 30 && weightKg <= 300)) return 'Enter a weight between 30 and 300 kg.';
  return null;
}
