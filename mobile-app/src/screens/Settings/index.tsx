import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { PickerField } from '../../components/PickerField';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { LANGUAGES, TIMEZONES } from '../../data/locales';
import { useProfileStore } from '../../store/profile';
import { useStyles, useTheme, useThemeStore } from '../../theme';

const THEMES: Array<{ value: 'dark' | 'light'; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { value: 'light', label: 'Light Mode', icon: 'sunny-outline' },
  { value: 'dark', label: 'Full Night', icon: 'moon-outline' },
];

/** Settings tab: language, timezone and theme — reached from the More menu. */
export default function SettingsScreen() {
  const { colors } = useTheme();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const profile = useProfileStore();

  const styles = useStyles((t) => ({
    section: { ...t.typography.subheading, color: t.colors.text, marginBottom: t.spacing.xs },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      height: 54,
      paddingHorizontal: t.spacing.lg,
      borderRadius: t.radius.pill,
      borderWidth: 1.5,
      borderColor: t.colors.border,
    },
    rowOn: { borderColor: t.colors.accent },
    rowText: { ...t.typography.body, color: t.colors.text, flex: 1, fontWeight: '600' },
    dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    dotFill: { width: 10, height: 10, borderRadius: 5 },
  }));

  return (
    <Screen topInset={false}>
      <ScreenHeader title="Settings" />

      <Card style={{ gap: 12 }}>
        <PickerField label="Language" icon="globe-outline" value={profile.language} placeholder="Select" options={LANGUAGES} onChange={(v) => profile.update({ language: v })} />
        <PickerField label="Timezone" value={profile.timezone} placeholder="Select" options={TIMEZONES} onChange={(v) => profile.update({ timezone: v })} />
      </Card>

      <Card style={{ gap: 10 }}>
        <Text style={styles.section}>Theme</Text>
        {THEMES.map((th) => {
          const on = mode === th.value;
          return (
            <Pressable key={th.value} style={[styles.row, on && styles.rowOn]} onPress={() => setMode(th.value)} accessibilityRole="button">
              <Ionicons name={th.icon} size={20} color={on ? colors.accent : colors.muted} />
              <Text style={styles.rowText}>{th.label}</Text>
              <View style={[styles.dot, { borderColor: on ? colors.accent : colors.border }]}>
                {on && <View style={[styles.dotFill, { backgroundColor: colors.accent }]} />}
              </View>
            </Pressable>
          );
        })}
      </Card>
    </Screen>
  );
}
