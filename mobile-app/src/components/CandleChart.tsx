import React, { useRef, useState } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, PanResponder, Pressable, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { useStyles, useTheme } from '../theme';
import type { Candle } from '../data/otcFeed';

export interface PriceMarker {
  price: number;
  color: string;
}

/** The latest open trade on this pair, drawn as "Beginning / End of trade" lines. */
export interface TradeSpan {
  openedAt: number;
  expiresAt: number;
  entry: number;
  direction: 'up' | 'down';
}

/**
 * What part of the timeline is on screen.
 *  - pxPerMin: horizontal zoom (pixels per minute of time)
 *  - right: timestamp at the right edge; null = follow the live edge
 */
export interface Viewport {
  pxPerMin: number;
  right: number | null;
}

export type ChartType = 'candles' | 'bars' | 'line' | 'area' | 'heikin';
export type DrawTool = 'hline' | 'vline' | 'trend' | 'ray' | 'rect' | 'fib';
/** One-tap tools place immediately; two-point tools need a drag (start/end point). */
const ONE_TAP_TOOLS: DrawTool[] = ['hline', 'vline'];

export type IndicatorKey = 'sma20' | 'ema20' | 'bb20';
export const INDICATORS: Array<{ key: IndicatorKey; label: string }> = [
  { key: 'sma20', label: 'SMA 20' },
  { key: 'ema20', label: 'EMA 20' },
  { key: 'bb20', label: 'Bollinger Bands 20' },
];

/** Drawings live in chart space (time, price) so they follow scrolling and zooming. */
export type Drawing =
  | { id: string; kind: 'hline'; price: number }
  | { id: string; kind: 'vline'; time: number }
  | { id: string; kind: 'trend' | 'ray' | 'rect' | 'fib'; t1: number; p1: number; t2: number; p2: number };

interface Props {
  candles: Candle[];
  chartType: ChartType;
  /** When set, one-finger drags draw instead of scrolling. */
  tool: DrawTool | null;
  drawings: Drawing[];
  onDrawings: (d: Drawing[]) => void;
  indicators?: IndicatorKey[];
  decimals: number;
  /** Interval (seconds) of the candles passed in. */
  intervalSec: number;
  viewport: Viewport;
  /** Zoom limits (px per minute) derived from the selected candle size. */
  minPxPerMin?: number;
  maxPxPerMin?: number;
  onViewport: (v: Viewport) => void;
  markers?: PriceMarker[];
  /** Latest open trade on this pair; when absent, a preview from now to now + expiry is drawn. */
  trade?: TradeSpan;
  expirySec: number;
}

export const P_MIN = 0.15; // whole day fits on screen
export const P_MAX = 120; // 5s candles ~10px wide
/** Selectable candle sizes (seconds). */
export const INTERVALS = [5, 10, 15, 30, 60, 120, 180, 300, 600, 900, 1800, 3600, 14400, 86400];
/**
 * Zoom limits for a selected candle size. The candle size never changes while zooming —
 * zoom only scales how wide those candles are, between ~3px and ~40px per candle.
 */
export const maxZoomForInterval = (intervalSec: number) => Math.min(P_MAX, Math.max(P_MIN, (40 * 60) / intervalSec));
export const minZoomForInterval = (intervalSec: number) => Math.min(maxZoomForInterval(intervalSec), Math.max(P_MIN, (3 * 60) / intervalSec));
/** Zoom at which `intervalSec` candles are a comfortable ~10px wide. */
export const zoomForInterval = (intervalSec: number) =>
  Math.min(maxZoomForInterval(intervalSec), Math.max(minZoomForInterval(intervalSec), (10 * 60) / intervalSec));

const AXIS_W = 62; // right-hand price axis
const PAD_TOP = 8;
const AXIS_H = 26; // bottom time axis
const FUTURE = 0.3; // fraction of the plot left empty right of "now" while live
const GRID_LINES = 5;
const LABEL_STEPS_MIN = [1, 2, 5, 10, 15, 30, 60, 120, 180, 360, 720, 1440];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const two = (n: number) => String(n).padStart(2, '0');
function timeLabel(ms: number): string {
  const d = new Date(ms);
  if (d.getHours() === 0 && d.getMinutes() === 0) return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return `${two(d.getHours())}:${two(d.getMinutes())}`;
}

/** Heikin-Ashi transform (each candle depends on the previous one). */
function heikin(cs: Candle[]): Candle[] {
  let prev: Candle | null = null;
  return cs.map((c) => {
    const close = (c.open + c.high + c.low + c.close) / 4;
    const open: number = prev ? (prev.open + prev.close) / 2 : (c.open + c.close) / 2;
    const ha = { time: c.time, open, close, high: Math.max(c.high, open, close), low: Math.min(c.low, open, close) };
    prev = ha;
    return ha;
  });
}

const countdown = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${two(h)}:${two(m)}:${two(s % 60)}` : `${two(m)}:${two(s % 60)}`;
};

/** SVG path through candle closes (area chart). */
function areaLine(vis: Candle[], xOfTime: (t: number) => number, slot: number, y: (p: number) => number): string {
  return vis.map((c, i) => `${i === 0 ? 'M' : 'L'} ${xOfTime(c.time) + slot / 2} ${y(c.close)}`).join(' ');
}

/** Simple moving average of closes; `undefined` where there isn't a full window yet. */
function sma(cs: Candle[], period: number): Array<number | undefined> {
  const out: Array<number | undefined> = [];
  let sum = 0;
  for (let i = 0; i < cs.length; i++) {
    sum += cs[i].close;
    if (i >= period) sum -= cs[i - period].close;
    out.push(i >= period - 1 ? sum / period : undefined);
  }
  return out;
}

/** Exponential moving average of closes, seeded with the first period's SMA. */
function ema(cs: Candle[], period: number): Array<number | undefined> {
  const out: Array<number | undefined> = [];
  const k = 2 / (period + 1);
  let prev: number | undefined;
  let sum = 0;
  for (let i = 0; i < cs.length; i++) {
    sum += cs[i].close;
    if (i < period - 1) {
      out.push(undefined);
      continue;
    }
    if (prev === undefined) prev = sum / period;
    else prev = cs[i].close * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

/** Bollinger Bands: SMA middle band ± `mult` standard deviations. */
function bollinger(cs: Candle[], period: number, mult: number) {
  const mid = sma(cs, period);
  const upper: Array<number | undefined> = [];
  const lower: Array<number | undefined> = [];
  for (let i = 0; i < cs.length; i++) {
    const m = mid[i];
    if (m === undefined) {
      upper.push(undefined);
      lower.push(undefined);
      continue;
    }
    let variance = 0;
    for (let k = i - period + 1; k <= i; k++) variance += (cs[k].close - m) ** 2;
    const sd = Math.sqrt(variance / period);
    upper.push(m + mult * sd);
    lower.push(m - mult * sd);
  }
  return { mid, upper, lower };
}

/** SVG path through a series (skipping undefined runs), aligned to candle centres. */
function seriesPath(cs: Candle[], values: Array<number | undefined>, xOfTime: (t: number) => number, slot: number, y: (p: number) => number): string {
  let d = '';
  let started = false;
  for (let i = 0; i < cs.length; i++) {
    const v = values[i];
    if (v === undefined) {
      started = false;
      continue;
    }
    const x = xOfTime(cs[i].time) + slot / 2;
    d += `${started ? 'L' : 'M'} ${x} ${y(v)} `;
    started = true;
  }
  return d;
}

/** First index whose time >= t (candles are sorted by time). */
function lowerBound(cs: Candle[], t: number): number {
  let lo = 0;
  let hi = cs.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cs[mid].time < t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

let drawSeq = 0;

/**
 * Marks exactly where a trade opened: a small filled dot at the entry point, a short
 * connector, and a bold direction arrow — red/down or green/up. No badge background.
 */
function EntryDot({ cx, cy, direction, lineColor, up, down }: { cx: number; cy: number; direction: 'up' | 'down'; lineColor: string; up: string; down: string }) {
  const color = direction === 'up' ? up : down;
  const badgeX = cx + 14;
  // Filled triangle, solid (not just an outline), matching a real chart's arrow badge.
  const arrow =
    direction === 'up'
      ? `M ${badgeX - 4} ${cy + 3} L ${badgeX} ${cy - 4} L ${badgeX + 4} ${cy + 3} Z`
      : `M ${badgeX - 4} ${cy - 3} L ${badgeX} ${cy + 4} L ${badgeX + 4} ${cy - 3} Z`;
  return (
    <>
      <Line x1={cx + 3} x2={badgeX - 6} y1={cy} y2={cy} stroke={lineColor} strokeWidth={1.5} />
      <Circle cx={cx} cy={cy} r={3.5} fill={color} />
      <Path d={arrow} fill={color} />
    </>
  );
}

/**
 * Candlestick chart drawn with react-native-svg. Drag to scroll through the day,
 * pinch to zoom (candles get wider/narrower; their size stays the selected one).
 */
export function CandleChart({
  candles,
  chartType,
  tool,
  drawings,
  onDrawings,
  indicators = [],
  decimals,
  intervalSec,
  viewport,
  minPxPerMin = P_MIN,
  maxPxPerMin = P_MAX,
  onViewport,
  markers = [],
  trade,
  expirySec,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles((t) => ({
    liveBtn: {
      position: 'absolute',
      right: AXIS_W + 8,
      bottom: AXIS_H + 8,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: t.colors.card,
      borderWidth: 1,
      borderColor: t.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    liveText: { color: t.colors.text, fontWeight: '800', fontSize: 16 },
  }));
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) =>
    setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const { w, h } = size;
  const plotW = Math.max(0, w - AXIS_W);
  const plotH = Math.max(0, h - PAD_TOP - AXIS_H);
  const p = viewport.pxPerMin;
  const futureMs = ((FUTURE * plotW) / p) * 60_000;

  // Gesture handlers are created once, so they read the latest values from refs.
  const scale = useRef({ left: 0, right: 0, hi: 1, lo: 0, plotW: 0, plotH: 0 });
  const [draft, setDraft] = useState<Extract<Drawing, { t1: number }> | null>(null);
  const live = useRef({ minP: minPxPerMin, maxP: maxPxPerMin, viewport, plotW, futureMs, first: candles[0]?.time ?? 0, onViewport, tool, drawings, onDrawings, draft });
  live.current = { minP: minPxPerMin, maxP: maxPxPerMin, viewport, plotW, futureMs, first: candles[0]?.time ?? 0, onViewport, tool, drawings, onDrawings, draft };
  const g = useRef({ panX: 0, right: 0, pinch: false, dist: 0, p: 1, active: false, drawing: false });

  /** Touch position (chart-local px) -> time / price, using the last rendered scale. */
  const toChart = (x: number, y: number) => {
    const sc = scale.current;
    return {
      t: sc.right - ((sc.plotW - x) / sc.plotW) * (sc.right - sc.left),
      price: sc.hi - ((y - PAD_TOP) / sc.plotH) * (sc.hi - sc.lo),
    };
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        const st = g.current;
        st.active = false;
        st.drawing = false;
        const { tool: tl, drawings: ds, onDrawings: setDs } = live.current;
        if (tl && e.nativeEvent.touches.length === 1 && scale.current.plotW > 0) {
          const pt = toChart(e.nativeEvent.locationX, e.nativeEvent.locationY);
          if (tl === 'hline') {
            setDs([...ds, { id: `d${drawSeq++}`, kind: 'hline', price: pt.price }]);
          } else if (tl === 'vline') {
            setDs([...ds, { id: `d${drawSeq++}`, kind: 'vline', time: pt.t }]);
          } else {
            st.drawing = true;
            setDraft({ id: `d${drawSeq++}`, kind: tl, t1: pt.t, p1: pt.price, t2: pt.t, p2: pt.price });
          }
        }
      },
      onPanResponderRelease: () => {
        const st = g.current;
        const { draft: dr, drawings: ds, onDrawings: setDs } = live.current;
        if (st.drawing && dr && (dr.t1 !== dr.t2 || dr.p1 !== dr.p2)) setDs([...ds, dr]);
        st.drawing = false;
        setDraft(null);
      },
      onPanResponderTerminate: () => {
        g.current.drawing = false;
        setDraft(null);
      },
      onPanResponderMove: (e: GestureResponderEvent) => {
        const { viewport: vp, plotW: pw, futureMs: fut, first, onViewport: emit, minP, maxP } = live.current;
        const touches = e.nativeEvent.touches;
        const st = g.current;
        const liveRight = Date.now() + fut;

        if (touches.length >= 2) {
          const d = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
          if (!st.pinch) {
            st.pinch = true;
            st.dist = d;
            st.p = vp.pxPerMin;
          }
          if (st.dist > 0) emit({ pxPerMin: clamp(st.p * (d / st.dist), minP, maxP), right: vp.right });
          return;
        }

        if (st.drawing) {
          const pt = toChart(e.nativeEvent.locationX, e.nativeEvent.locationY);
          setDraft((d) => (d ? { ...d, t2: pt.t, p2: pt.price } : d));
          return;
        }
        if (live.current.tool) return; // hline tool: a tap already placed it

        if (!st.active || st.pinch) {
          // (re)start a one-finger pan from the current position
          st.active = true;
          st.pinch = false;
          st.panX = touches[0].pageX;
          st.right = vp.right ?? liveRight;
          return;
        }
        const dx = touches[0].pageX - st.panX;
        const next = st.right - (dx / vp.pxPerMin) * 60_000;
        const minRight = first + ((0.3 * pw) / vp.pxPerMin) * 60_000; // keep some data in view
        emit({ pxPerMin: vp.pxPerMin, right: next >= liveRight ? null : Math.max(minRight, next) });
      },
    }),
  ).current;

  let body: React.ReactNode = null;
  if (w > 0 && h > 0 && candles.length > 0) {
    const nowMs = Date.now();
    const right = viewport.right ?? nowMs + futureMs;
    const left = right - (plotW / p) * 60_000;
    const xOfTime = (t: number) => plotW - ((right - t) / 60_000) * p;
    const ivMs = intervalSec * 1000;
    const slot = (intervalSec / 60) * p;
    const bodyW = Math.max(1, slot * 0.7);

    // Visible window (binary search: the day can hold thousands of candles)
    const i0 = Math.max(0, lowerBound(candles, left - ivMs));
    const i1 = lowerBound(candles, right + 1);
    const warmStart = Math.max(0, i0 - 40); // lookback so HA/indicator lines are stable at the left edge
    // Indicators always read real prices, even on a Heikin-Ashi chart.
    const extCandles = candles.slice(warmStart, i1);
    let vis: Candle[];
    if (chartType === 'heikin') {
      vis = heikin(extCandles).slice(i0 - warmStart);
    } else {
      vis = candles.slice(i0, i1);
    }
    const ext = vis.length > 0 ? vis : candles.slice(-1);
    let lo = Math.min(...ext.map((c) => c.low), ...markers.map((m) => m.price));
    let hi = Math.max(...ext.map((c) => c.high), ...markers.map((m) => m.price));
    const margin = (hi - lo || hi * 0.001) * 0.12;
    lo -= margin;
    hi += margin;
    scale.current = { left, right, hi, lo, plotW, plotH };
    const y = (price: number) => PAD_TOP + ((hi - price) / (hi - lo)) * plotH;
    const last = candles[candles.length - 1];
    const yLast = clamp(y(last.close), PAD_TOP, PAD_TOP + plotH);
    // time left in the current candle, shown on the price line
    const tagX = clamp(xOfTime(last.time) + slot / 2 + 46, 34, plotW - 34);

    // Time grid: one label per candle, on the candle's centre, so the label names the
    // candle it sits under. The step is a whole number of candles (>= 72px apart).
    const stepMin =
      LABEL_STEPS_MIN.find((m) => m * p >= 72 && m * 60 >= intervalSec && (m * 60) % intervalSec === 0) ?? 1440;
    const stepMs = stepMin * 60_000;
    const ticks: number[] = []; // candle start times
    for (let t = Math.ceil((left - ivMs) / stepMs) * stepMs; t <= right; t += stepMs) ticks.push(t);

    // Only drawn once a trade is actually open — a "beginning" preview at "now" would
    // just double up with the live price line and candle, so nothing is shown before that.
    const openX = trade ? xOfTime(trade.openedAt) : null;
    const endX = trade ? xOfTime(trade.expiresAt) : null;

    let lowIdx = 0;
    vis.forEach((c, i) => {
      if (c.low < vis[lowIdx].low) lowIdx = i;
    });
    const lowC = vis[lowIdx];

    body = (
      <Svg width={w} height={h}>
        <Defs>
          <ClipPath id="plot">
            <Rect x={0} y={0} width={plotW} height={h} />
          </ClipPath>
        </Defs>

        {Array.from({ length: GRID_LINES + 1 }, (_, i) => {
          const price = hi - ((hi - lo) * i) / GRID_LINES;
          return (
            <React.Fragment key={i}>
              <Line x1={0} x2={plotW} y1={y(price)} y2={y(price)} stroke={colors.border} strokeWidth={0.6} />
              <SvgText x={plotW + 6} y={y(price) + 4} fill={colors.text} fontSize={12}>
                {price.toFixed(decimals)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {ticks.map((t) => {
          const cx = xOfTime(t) + slot / 2; // centre of the candle that starts at t
          if (cx < 0 || cx > plotW) return null;
          return (
            <React.Fragment key={t}>
              <Line x1={cx} x2={cx} y1={PAD_TOP} y2={PAD_TOP + plotH} stroke={colors.border} strokeWidth={0.6} />
              <SvgText x={cx} y={h - 8} fill={colors.text} fontSize={12} textAnchor="middle">
                {timeLabel(t)}
              </SvgText>
            </React.Fragment>
          );
        })}

        <G clipPath="url(#plot)">
          {chartType === 'area' && vis.length > 1 && (
            <>
              <Defs>
                <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.accent} stopOpacity={0.35} />
                  <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Path
                d={`${areaLine(vis, xOfTime, slot, y)} L ${xOfTime(vis[vis.length - 1].time) + slot / 2} ${PAD_TOP + plotH} L ${xOfTime(vis[0].time) + slot / 2} ${PAD_TOP + plotH} Z`}
                fill="url(#area)"
              />
              <Path d={areaLine(vis, xOfTime, slot, y)} stroke={colors.accent} strokeWidth={2} fill="none" />
            </>
          )}

          {chartType === 'line' && vis.length > 1 && (
            <Path d={areaLine(vis, xOfTime, slot, y)} stroke={colors.accent} strokeWidth={2} fill="none" />
          )}

          {(chartType === 'candles' || chartType === 'heikin') &&
            vis.map((c) => {
              const cx = xOfTime(c.time) + slot / 2;
              const color = c.close >= c.open ? colors.up : colors.down;
              const top = y(Math.max(c.open, c.close));
              const bodyH = Math.max(1, Math.abs(y(c.open) - y(c.close)));
              return (
                <React.Fragment key={c.time}>
                  <Line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={1.2} />
                  <Rect x={cx - bodyW / 2} y={top} width={bodyW} height={bodyH} fill={color} />
                </React.Fragment>
              );
            })}

          {chartType === 'bars' &&
            vis.map((c) => {
              const cx = xOfTime(c.time) + slot / 2;
              const color = c.close >= c.open ? colors.up : colors.down;
              const tick = Math.max(2, slot * 0.35);
              return (
                <React.Fragment key={c.time}>
                  <Line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={1.5} />
                  <Line x1={cx - tick} x2={cx} y1={y(c.open)} y2={y(c.open)} stroke={color} strokeWidth={1.5} />
                  <Line x1={cx} x2={cx + tick} y1={y(c.close)} y2={y(c.close)} stroke={color} strokeWidth={1.5} />
                </React.Fragment>
              );
            })}

          {[...drawings, ...(draft ? [draft] : [])].map((d) => {
            if (d.kind === 'hline') {
              return <Line key={d.id} x1={0} x2={plotW} y1={y(d.price)} y2={y(d.price)} stroke={colors.warn} strokeWidth={1.5} />;
            }
            if (d.kind === 'vline') {
              const x = xOfTime(d.time);
              return <Line key={d.id} x1={x} x2={x} y1={PAD_TOP} y2={PAD_TOP + plotH} stroke={colors.warn} strokeWidth={1.5} />;
            }
            const x1 = xOfTime(d.t1);
            const y1 = y(d.p1);
            const x2 = xOfTime(d.t2);
            const y2 = y(d.p2);
            if (d.kind === 'rect') {
              return (
                <Rect
                  key={d.id}
                  x={Math.min(x1, x2)}
                  y={Math.min(y1, y2)}
                  width={Math.abs(x2 - x1)}
                  height={Math.abs(y2 - y1)}
                  fill={colors.accent}
                  fillOpacity={0.15}
                  stroke={colors.accent}
                  strokeWidth={1.5}
                />
              );
            }
            if (d.kind === 'fib') {
              const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
              const lo2 = Math.min(x1, x2);
              return (
                <React.Fragment key={d.id}>
                  {levels.map((lv) => {
                    const price = d.p1 + (d.p2 - d.p1) * lv;
                    return (
                      <React.Fragment key={lv}>
                        <Line x1={lo2} x2={plotW} y1={y(price)} y2={y(price)} stroke={colors.accent} strokeWidth={1} strokeDasharray="3,3" />
                        <SvgText x={lo2 + 4} y={y(price) - 3} fill={colors.accent} fontSize={10}>
                          {`${(lv * 100).toFixed(1)}%  ${price.toFixed(decimals)}`}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            }
            // trend / ray — a ray keeps going to the right edge of the plot.
            const ex2 = d.kind === 'ray' && x2 !== x1 ? plotW : x2;
            const ey2 = d.kind === 'ray' && x2 !== x1 ? y1 + ((y2 - y1) * (plotW - x1)) / (x2 - x1) : y2;
            return (
              <React.Fragment key={d.id}>
                <Line x1={x1} y1={y1} x2={ex2} y2={ey2} stroke={colors.accent} strokeWidth={2} />
                <Rect x={x1 - 3} y={y1 - 3} width={6} height={6} fill={colors.accent} />
                <Rect x={x2 - 3} y={y2 - 3} width={6} height={6} fill={colors.accent} />
              </React.Fragment>
            );
          })}

          {indicators.includes('sma20') && (
            <Path d={seriesPath(extCandles, sma(extCandles, 20), xOfTime, slot, y)} stroke={colors.warn} strokeWidth={1.5} fill="none" />
          )}
          {indicators.includes('ema20') && (
            <Path d={seriesPath(extCandles, ema(extCandles, 20), xOfTime, slot, y)} stroke={colors.accent} strokeWidth={1.5} fill="none" />
          )}
          {indicators.includes('bb20') &&
            (() => {
              const bb = bollinger(extCandles, 20, 2);
              return (
                <>
                  <Path d={seriesPath(extCandles, bb.upper, xOfTime, slot, y)} stroke={colors.muted} strokeWidth={1} fill="none" />
                  <Path d={seriesPath(extCandles, bb.mid, xOfTime, slot, y)} stroke={colors.muted} strokeWidth={1} strokeDasharray="3,3" fill="none" />
                  <Path d={seriesPath(extCandles, bb.lower, xOfTime, slot, y)} stroke={colors.muted} strokeWidth={1} fill="none" />
                </>
              );
            })()}

          {markers.map((m, i) => (
            <Line key={i} x1={0} x2={plotW} y1={y(m.price)} y2={y(m.price)} stroke={m.color} strokeWidth={1} strokeDasharray="2,3" />
          ))}

          {/* Beginning/end-of-trade markers: a plain grey line like the time grid, not the
              white dashed line used for the live price — the two shouldn't look the same. */}
          {openX !== null && openX >= 0 && openX <= plotW && (
            <Line x1={openX} x2={openX} y1={PAD_TOP} y2={PAD_TOP + plotH} stroke={colors.border} strokeWidth={1.5} />
          )}
          {endX !== null && endX <= plotW && endX >= 0 && (
            <>
              <Line x1={endX} x2={endX} y1={PAD_TOP} y2={PAD_TOP + plotH} stroke={colors.border} strokeWidth={1.5} />
              <SvgText x={endX + 6} y={PAD_TOP + 36} fill={colors.muted} fontSize={12}>
                End of trade
              </SvgText>
              <SvgText x={endX + 6} y={PAD_TOP + 52} fill={colors.muted} fontSize={12}>
                {trade && countdown(trade.expiresAt - nowMs)}
              </SvgText>
            </>
          )}

          {/* Entry marker: a small circle with a direction arrow, right where the trade opened. */}
          {trade && openX !== null && openX >= 0 && openX <= plotW && (
            <EntryDot cx={openX} cy={y(trade.entry)} direction={trade.direction} lineColor={colors.muted} up={colors.up} down={colors.down} />
          )}

          {lowC && (
            <>
              <Rect
                x={clamp(xOfTime(lowC.time) + slot / 2, 34, plotW - 34) - 32}
                y={Math.min(y(lowC.low) + 6, PAD_TOP + plotH - 20)}
                width={64}
                height={20}
                rx={5}
                fill={colors.card}
              />
              <SvgText
                x={clamp(xOfTime(lowC.time) + slot / 2, 34, plotW - 34)}
                y={Math.min(y(lowC.low) + 6, PAD_TOP + plotH - 20) + 14}
                fill={colors.muted}
                fontSize={11}
                textAnchor="middle"
              >
                {lowC.low.toFixed(decimals)}
              </SvgText>
            </>
          )}

          <Line x1={0} x2={plotW} y1={yLast} y2={yLast} stroke={colors.text} strokeWidth={1} strokeDasharray="5,4" />
          <Rect x={tagX - 27} y={yLast - 10} width={54} height={20} rx={5} fill={colors.card} />
          <SvgText x={tagX} y={yLast + 4} fill={colors.muted} fontSize={11} textAnchor="middle">
            {countdown(last.time + ivMs - nowMs)}
          </SvgText>
        </G>

        <Rect x={plotW + 2} y={yLast - 12} width={AXIS_W - 4} height={24} rx={12} fill={colors.accent} />
        <SvgText x={plotW + AXIS_W / 2} y={yLast + 4} fill={colors.onAccent} fontSize={12} fontWeight="bold" textAnchor="middle">
          {last.close.toFixed(decimals)}
        </SvgText>
      </Svg>
    );
  }

  return (
    <View onLayout={onLayout} style={{ flex: 1, width: '100%' }} {...responder.panHandlers}>
      {body}
      {viewport.right !== null && (
        <Pressable
          style={styles.liveBtn}
          onPress={() => onViewport({ ...viewport, right: null })}
          accessibilityLabel="Jump to latest"
        >
          <Text style={styles.liveText}>»</Text>
        </Pressable>
      )}
    </View>
  );
}
