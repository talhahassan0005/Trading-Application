import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStyles, useTheme } from '../theme';
import { INDICATORS, INTERVALS } from './CandleChart';
import type { ChartType, DrawTool, IndicatorKey } from './CandleChart';

export const INTERVAL_LABEL: Record<number, string> = {
  5: '5s', 10: '10s', 15: '15s', 30: '30s', 60: '1m', 120: '2m', 180: '3m', 300: '5m',
  600: '10m', 900: '15m', 1800: '30m', 3600: '1h', 14400: '4h', 86400: '1d',
};

const TYPES: Array<{ value: ChartType; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { value: 'line', label: 'Line', icon: 'trending-up-outline' },
  { value: 'area', label: 'Area', icon: 'analytics-outline' },
  { value: 'candles', label: 'Candles', icon: 'stats-chart-outline' },
  { value: 'bars', label: 'Bars', icon: 'reorder-four-outline' },
  { value: 'heikin', label: 'Heiken Ashi', icon: 'podium-outline' },
];

const DRAW_TOOLS: Array<{ value: DrawTool; label: string; icon: keyof typeof Ionicons.glyphMap; hint: string }> = [
  { value: 'hline', label: 'Horizontal line', icon: 'remove-outline', hint: 'Tap the chart to place a line.' },
  { value: 'vline', label: 'Vertical line', icon: 'code-outline', hint: 'Tap the chart to place a line.' },
  { value: 'trend', label: 'Trend line', icon: 'trending-up-outline', hint: 'Drag on the chart to draw a line.' },
  { value: 'ray', label: 'Ray', icon: 'arrow-forward-outline', hint: 'Drag on the chart — it keeps going to the right edge.' },
  { value: 'rect', label: 'Rectangle', icon: 'square-outline', hint: 'Drag on the chart to mark a zone.' },
  { value: 'fib', label: 'Fibonacci retracement', icon: 'git-commit-outline', hint: 'Drag between a high and a low to plot the levels.' },
];

interface Props {
  interval: number;
  onInterval: (sec: number) => void;
  chartType: ChartType;
  onChartType: (t: ChartType) => void;
  tool: DrawTool | null;
  onTool: (t: DrawTool | null) => void;
  hasDrawings: boolean;
  onClear: () => void;
  indicators: IndicatorKey[];
  onToggleIndicator: (key: IndicatorKey) => void;
  /** Extra button(s) shown under the tools (e.g. open positions). */
  children?: React.ReactNode;
}

type Section = 'draw' | 'time' | 'type' | 'indicators';

/** Floating chart toolbar: drawing tools, candle size, chart type and indicators. */
export function ChartTools({
  interval,
  onInterval,
  chartType,
  onChartType,
  tool,
  onTool,
  hasDrawings,
  onClear,
  indicators,
  onToggleIndicator,
  children,
}: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<Section | null>(null);

  const styles = useStyles((t) => ({
    col: { position: 'absolute', top: 8, left: 12, gap: t.spacing.sm },
    btn: {
      width: 40,
      height: 40,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnOn: { backgroundColor: t.colors.accent },
    btnText: { ...t.typography.label, color: t.colors.text, fontWeight: '800' },
    dot: {
      position: 'absolute',
      top: -3,
      right: -3,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: t.colors.warn,
    },
    panel: {
      position: 'absolute',
      top: 8,
      left: 60,
      maxWidth: 290,
      maxHeight: 380,
      padding: t.spacing.sm,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.card,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    cell: {
      width: 84,
      height: 38,
      borderRadius: t.radius.sm,
      backgroundColor: t.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cellText: { ...t.typography.label, color: t.colors.text },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      minWidth: 200,
      paddingVertical: t.spacing.md,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.radius.sm,
    },
    rowOn: { backgroundColor: t.colors.surface },
    rowText: { ...t.typography.body, color: t.colors.text, flex: 1 },
    hint: { ...t.typography.caption, color: t.colors.muted, paddingHorizontal: t.spacing.md, paddingTop: 4, maxWidth: 240 },
    swatch: { width: 14, height: 3, borderRadius: 2 },
  }));

  const pick = (s: Section) => setSection(section === s ? null : s);
  const typeIcon = TYPES.find((t) => t.value === chartType)?.icon ?? 'stats-chart-outline';
  const activeTool = DRAW_TOOLS.find((d) => d.value === tool);

  const toggle = () => {
    setOpen(!open);
    setSection(null);
  };

  return (
    <>
      <View style={styles.col}>
        <Pressable style={[styles.btn, open && styles.btnOn]} onPress={toggle} accessibilityLabel="Chart tools">
          <Ionicons name={open ? 'close' : 'ellipsis-horizontal'} size={20} color={open ? colors.onAccent : colors.text} />
        </Pressable>
        {open && (
          <>
            <Pressable style={[styles.btn, (section === 'draw' || tool) && styles.btnOn]} onPress={() => pick('draw')} accessibilityLabel="Drawing tools">
              <Ionicons name="pencil" size={18} color={section === 'draw' || tool ? colors.onAccent : colors.text} />
              {hasDrawings && !tool && <View style={styles.dot} />}
            </Pressable>
            <Pressable style={[styles.btn, section === 'time' && styles.btnOn]} onPress={() => pick('time')} accessibilityLabel="Candle size">
              <Text style={[styles.btnText, section === 'time' && { color: colors.onAccent }]}>{INTERVAL_LABEL[interval]}</Text>
            </Pressable>
            <Pressable style={[styles.btn, section === 'type' && styles.btnOn]} onPress={() => pick('type')} accessibilityLabel="Chart type">
              <Ionicons name={typeIcon} size={20} color={section === 'type' ? colors.onAccent : colors.text} />
            </Pressable>
            <Pressable style={[styles.btn, (section === 'indicators' || indicators.length > 0) && styles.btnOn]} onPress={() => pick('indicators')} accessibilityLabel="Indicators">
              <Ionicons name="pulse-outline" size={20} color={section === 'indicators' || indicators.length > 0 ? colors.onAccent : colors.text} />
              {indicators.length > 0 && section !== 'indicators' && <View style={styles.dot} />}
            </Pressable>
          </>
        )}
        {children}
      </View>

      {open && section === 'time' && (
        <View style={styles.panel}>
          <View style={styles.grid}>
            {INTERVALS.map((iv) => (
              <Pressable
                key={iv}
                style={[styles.cell, iv === interval && styles.btnOn]}
                onPress={() => {
                  onInterval(iv);
                  setSection(null);
                }}
              >
                <Text style={[styles.cellText, iv === interval && { color: colors.onAccent, fontWeight: '800' }]}>{INTERVAL_LABEL[iv]}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.hint}>Pinch to zoom and drag to scroll — candle size follows the zoom.</Text>
        </View>
      )}

      {open && section === 'type' && (
        <View style={styles.panel}>
          {TYPES.map((t) => (
            <Pressable
              key={t.value}
              style={[styles.row, t.value === chartType && styles.rowOn]}
              onPress={() => {
                onChartType(t.value);
                setSection(null);
              }}
            >
              <Ionicons name={t.icon} size={20} color={t.value === chartType ? colors.accent : colors.text} />
              <Text style={[styles.rowText, t.value === chartType && { color: colors.accent }]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {open && section === 'draw' && (
        <View style={styles.panel}>
          {DRAW_TOOLS.map((d) => (
            <Pressable
              key={d.value}
              style={[styles.row, tool === d.value && styles.rowOn]}
              onPress={() => {
                onTool(tool === d.value ? null : d.value);
                setSection(null);
              }}
            >
              <Ionicons name={d.icon} size={20} color={tool === d.value ? colors.accent : colors.text} />
              <Text style={[styles.rowText, tool === d.value && { color: colors.accent }]}>{d.label}</Text>
            </Pressable>
          ))}
          <Pressable
            style={[styles.row, !hasDrawings && { opacity: 0.4 }]}
            disabled={!hasDrawings}
            onPress={() => {
              onClear();
              setSection(null);
            }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.down} />
            <Text style={styles.rowText}>Clear all</Text>
          </Pressable>
          <Text style={styles.hint}>{activeTool ? activeTool.hint : 'Pick a tool, then draw on the chart.'}</Text>
        </View>
      )}

      {open && section === 'indicators' && (
        <View style={styles.panel}>
          {INDICATORS.map((ind) => {
            const on = indicators.includes(ind.key);
            const color = ind.key === 'sma20' ? colors.warn : ind.key === 'ema20' ? colors.accent : colors.muted;
            return (
              <Pressable key={ind.key} style={[styles.row, on && styles.rowOn]} onPress={() => onToggleIndicator(ind.key)}>
                <View style={[styles.swatch, { backgroundColor: color }]} />
                <Text style={[styles.rowText, on && { color: colors.accent }]}>{ind.label}</Text>
                {on && <Ionicons name="checkmark" size={18} color={colors.accent} />}
              </Pressable>
            );
          })}
          <Text style={styles.hint}>Overlays computed from this chart's prices — not real technical signals.</Text>
        </View>
      )}
    </>
  );
}
