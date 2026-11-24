import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useThemeColors, typography, spacing, borderRadius } from '../utils/theme';

export function Card({ children, style }) {
  const c = useThemeColors();
  return <View style={[{ backgroundColor: c.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: c.border, padding: spacing.md }, style]}>{children}</View>;
}

export function Button({ title, onPress, loading, disabled, variant = 'primary', style, icon }) {
  const c = useThemeColors();
  const off = disabled || loading;
  const bg = variant === 'primary' ? c.primary : variant === 'danger' ? c.error : 'transparent';
  const color = variant === 'ghost' ? c.text : '#FFF';
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      activeOpacity={0.8}
      disabled={off}
      onPress={onPress}
      style={[{ backgroundColor: bg, borderRadius: borderRadius.pill, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', opacity: off ? 0.55 : 1, borderWidth: variant === 'ghost' ? 1 : 0, borderColor: c.border }, style]}
    >
      {loading ? <ActivityIndicator color={color} /> : <>{icon}<Text style={{ ...typography.h3, fontSize: 16, color }}>{title}</Text></>}
    </TouchableOpacity>
  );
}

export function Field({ label, error, style, ...props }) {
  const c = useThemeColors();
  return (
    <View style={[{ marginBottom: spacing.md }, style]}>
      {label ? <Text style={{ ...typography.caption, color: c.textSecondary, marginBottom: 6 }}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={c.textSecondary}
        accessibilityLabel={label}
        {...props}
        style={{ ...typography.body, color: c.text, backgroundColor: c.surfaceLight, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: 12, borderWidth: 1, borderColor: error ? c.error : c.border }}
      />
      {error ? <Text style={{ ...typography.bodySecondary, color: c.error, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}

export function Segmented({ options, value, onChange, label }) {
  const c = useThemeColors();
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text style={{ ...typography.caption, color: c.textSecondary, marginBottom: 6 }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', backgroundColor: c.surfaceLight, borderRadius: borderRadius.pill, padding: 4 }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <TouchableOpacity key={o.value} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)}
              style={{ flex: 1, paddingVertical: 10, borderRadius: borderRadius.pill, alignItems: 'center', backgroundColor: on ? c.primary : 'transparent' }}>
              <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: on ? '#FFF' : c.textSecondary }}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function ProgressBar({ value, max, color }) {
  const c = useThemeColors();
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: c.surfaceLight, overflow: 'hidden' }}>
      <View style={{ height: '100%', width: `${pct}%`, backgroundColor: color || c.primary, borderRadius: 4 }} />
    </View>
  );
}

export function ErrorNote({ message, onRetry }) {
  const c = useThemeColors();
  if (!message) return null;
  return (
    <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: borderRadius.sm, padding: spacing.sm, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ ...typography.bodySecondary, color: c.error, flex: 1 }}>{message}</Text>
      {onRetry ? <TouchableOpacity onPress={onRetry} accessibilityRole="button"><Text style={{ fontFamily: 'Outfit_600SemiBold', color: c.error, marginLeft: spacing.sm }}>Retry</Text></TouchableOpacity> : null}
    </View>
  );
}

export const round = (n) => Math.round(Number(n) || 0);
