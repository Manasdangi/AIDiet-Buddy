import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { fetchProfile, saveProfile } from '../services/profile';
import { fetchDay } from '../services/meals';

const useStore = create((set, get) => ({
  theme: 'dark',
  booting: true,
  session: null,
  profile: null, // row from public.profiles, null until onboarding is done
  profileError: null,
  today: { meals: [], loading: false, error: null },

  setTheme: (theme) => {
    set({ theme });
    AsyncStorage.setItem('theme', theme).catch(() => {});
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),

  // Called once on launch: restores the saved theme and the Supabase session, then loads the profile.
  init: async () => {
    try {
      const saved = await AsyncStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') set({ theme: saved });
    } catch {
      /* default theme */
    }
    const { data } = await supabase.auth.getSession();
    set({ session: data.session });
    if (data.session) await get().loadProfile();
    set({ booting: false });
    supabase.auth.onAuthStateChange((event, session) => {
      const prev = get().session;
      set({ session });
      if (!session) set({ profile: null, today: { meals: [], loading: false, error: null } });
      else if (!prev || prev.user.id !== session.user.id) get().loadProfile();
    });
  },

  loadProfile: async () => {
    const s = get().session;
    if (!s) return;
    try {
      const profile = await fetchProfile(s.user.id);
      set({ profile, profileError: null });
    } catch {
      set({ profileError: 'Could not load your profile. Check your internet and try again.' });
    }
  },

  saveProfile: async (p) => {
    const s = get().session;
    const profile = await saveProfile(s.user.id, p);
    set({ profile, profileError: null });
  },

  loadToday: async () => {
    set((st) => ({ today: { ...st.today, loading: true, error: null } }));
    try {
      const meals = await fetchDay(new Date());
      set({ today: { meals, loading: false, error: null } });
    } catch {
      set((st) => ({ today: { ...st.today, loading: false, error: 'Could not load your meals.' } }));
    }
  },

  addTodayMeal: (meal) => set((st) => ({ today: { ...st.today, meals: [meal, ...st.today.meals] } })),
  removeTodayMeal: (id) => set((st) => ({ today: { ...st.today, meals: st.today.meals.filter((m) => m.id !== id) } })),

  signOut: async () => {
    await supabase.auth.signOut();
  },
}));

export default useStore;
