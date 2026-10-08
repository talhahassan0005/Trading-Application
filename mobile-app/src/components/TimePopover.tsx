import React, { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useStyles, useTheme } from '../theme';

export type TimerMode = 'timer' | 'time';

export const TIMER_PRESETS = [5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200];
export const MIN_TIMER = 5; // seconds
export const MIN_LEAD = 30_000; // Time mode: end at least 30 s ahead
const DAY = 24 * 3600;

const two = (n: number) => String(n).padStart(2, '0');
/** 90 -> "01:30", 3600 -> "01:00:00" (grid labels) */
export const fmtDuration = (s: number) => (s >= 3600 ? `${two(Math.floor(s / 3600))}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}` : `${two(Math.floor(s / 60))}:${two(s % 60)}`);
/** 60 -> "00:01:00" (field label) */
export const hms = (s: number) => `${two(Math.floor(s / 3600))}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}`;
export const clockHM = (ms: number) => {
  const d = new Date(ms);
  return `${two(d.getHours())}:${two(d.getMinutes())}`;
};

/**
 * Quick end times: the next 5 whole minutes, two 5-minute steps, then 15-minute steps,
 * then +1 h and +3 h — 12 choices. Any other minute can be entered manually.
 */
export function timeOptions(now: number): number[] {
  const MIN = 60_000;
  const first = Math.ceil((now + MIN_LEAD) / MIN) * MIN;
  const c = [0, 1, 2, 3, 4].map((k) => first + k * MIN);
  c.push(c[4] + 5 * MIN, c[4] + 10 * MIN);
  c.push(c[6] + 15 * MIN, c[6] + 30 * MIN, c[6] + 45 * MIN);
  c.push(c[9] + 60 * MIN, c[9] + 180 * MIN);
  return c;
}

/** "2", "1:30", "0:1:30" -> seconds (minutes / mm:ss / hh:mm:ss). Null when invalid. */
export function parseTimer(text: string): number | null {
  const parts = text.trim().split(':').map((x) => Number(x));
  if (parts.length === 0 || parts.length > 3 || parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
  const secs = parts.length === 1 ? parts[0] * 60 : parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0] * 3600 + parts[1] * 60 + parts[2];
  return secs >= MIN_TIMER && secs <= DAY ? Math.round(secs) : null;
}

/** "18:45" -> the next occurrence (today or tomorrow) as a timestamp. Null when invalid / too soon. */
export function parseClock(text: string, now: number): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
  const d = new Date(now);
  d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  let t = d.getTime();
  if (t - now < MIN_LEAD) t += DAY * 1000;
  return t - now >= MIN_LEAD && t - now <= DAY * 1000 ? t : null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Distance from the bottom of the screen to place the popover (just above the field). */
  bottom: number;
  now: number;
  mode: TimerMode;
  onMode: (m: TimerMode) => void;
  timerValue: number;
  onTimer: (seconds: number) => void;
  timeValue: number;
  onTime: (ms: number) => void;
}

/** Popover with a Timer / Time switch, a grid of quick choices and manual entry. */
export function TimePopover({ visible, onClose, bottom, now, mode, onMode, timerValue, onTimer, timeValue, onTime }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [manual, setManual] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const styles = useStyles((t) => ({
    backdrop: { flex: 1 },
    box: {
      position: 'absolute',
      left: 16,
      padding: t.spacing.md,
      gap: t.spacing.md,
      borderRadius: t.radius.lg,
      backgroundColor: t.colors.card,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    tabs: { flexDirection: 'row', borderRadius: t.radius.sm, backgroundColor: t.colors.surface, overflow: 'hidden' },
    tab: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' },
    tabOn: { backgroundColor: t.colors.accent },
    tabText: { ...t.typography.label, color: t.colors.muted, fontWeight: '800', letterSpacing: 0.5 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    cell: { width: '31.5%', height: 42, borderRadius: t.radius.sm, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' },
    cellText: { ...t.typography.body, color: t.colors.text, fontVariant: ['tabular-nums'] },
    wide: { height: 42, borderRadius: t.radius.sm, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' },
    input: {
      ...t.typography.subheading,
      height: 46,
      borderRadius: t.radius.sm,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingHorizontal: t.spacing.md,
      color: t.colors.text,
      backgroundColor: t.colors.surface,
    },
    hint: { ...t.typography.caption, color: t.colors.muted },
    error: { ...t.typography.label, color: t.colors.down },
    row: { flexDirection: 'row', gap: 8 },
  }));

  const close = () => {
    setManual(false);
    setText('');
    setError(null);
    onClose();
  };

  const submitManual = () => {
    if (mode === 'timer') {
      const s = parseTimer(text);
      if (s === null) return setError('Enter a duration from 0:05 up to 24 h, e.g. 2, 1:30 or 0:2:30.');
      onTimer(s);
    } else {
      const t = parseClock(text, now);
      if (t === null) return setError('Enter a time (HH:MM) at least 30 s from now and within 24 h.');
      onTime(t);
    }
    close();
  };

  const on = (active: boolean) => (active ? { backgroundColor: colors.accent } : null);
  const onText = (active: boolean) => (active ? { color: colors.onAccent, fontWeight: '800' as const } : null);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={[styles.box, { bottom, width: Math.min(width - 32, 340) }]} onPress={() => {}}>
          <View style={styles.tabs}>
            {(['timer', 'time'] as const).map((m) => (
              <Pressable
                key={m}
                style={[styles.tab, mode === m && styles.tabOn]}
                onPress={() => {
                  onMode(m);
                  setManual(false);
                  setError(null);
                }}
              >
                <Text style={[styles.tabText, mode === m && { color: colors.onAccent }]}>{m.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>

          {manual ? (
            <View style={{ gap: 8 }}>
              <TextInput
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder={mode === 'timer' ? 'Duration, e.g. 2 or 1:30' : 'End time, e.g. 18:45'}
                placeholderTextColor={colors.muted}
                keyboardType="numbers-and-punctuation"
                autoFocus
              />
              <Text style={styles.hint}>
                {mode === 'timer' ? 'Minutes, mm:ss or hh:mm:ss (5 s to 24 h).' : '24-hour clock, next occurrence within 24 h.'}
              </Text>
              {error && <Text style={styles.error}>{error}</Text>}
              <View style={styles.row}>
                <Pressable style={[styles.wide, { flex: 1 }]} onPress={() => setManual(false)}>
                  <Text style={styles.cellText}>Back</Text>
                </Pressable>
                <Pressable style={[styles.wide, { flex: 1, backgroundColor: colors.accent }]} onPress={submitManual}>
                  <Text style={[styles.cellText, { color: colors.onAccent, fontWeight: '800' }]}>Set</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.grid}>
                {mode === 'timer'
                  ? TIMER_PRESETS.map((s) => (
                      <Pressable key={s} style={[styles.cell, on(s === timerValue)]} onPress={() => { onTimer(s); close(); }}>
                        <Text style={[styles.cellText, onText(s === timerValue)]}>{fmtDuration(s)}</Text>
                      </Pressable>
                    ))
                  : timeOptions(now).map((t) => (
                      <Pressable key={t} style={[styles.cell, on(t === timeValue)]} onPress={() => { onTime(t); close(); }}>
                        <Text style={[styles.cellText, onText(t === timeValue)]}>{clockHM(t)}</Text>
                      </Pressable>
                    ))}
              </View>
              <Pressable style={styles.wide} onPress={() => setManual(true)}>
                <Text style={styles.cellText}>Set manually</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
