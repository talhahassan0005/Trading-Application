import React, { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CandleChart, ChartType, Drawing, DrawTool, IndicatorKey, Viewport, maxZoomForInterval, minZoomForInterval, zoomForInterval } from '../../components/CandleChart';
import { ChartTools } from '../../components/ChartTools';
import { OutlineField } from '../../components/OutlineField';
import { PairIcon } from '../../components/PairIcon';
import { PositionRow } from '../../components/PositionRow';
import { Row } from '../../components/Row';
import { Segmented } from '../../components/Segmented';
import { Sheet } from '../../components/Sheet';
import { MIN_LEAD, TimePopover, TimerMode, clockHM, hms, timeOptions } from '../../components/TimePopover';
import { getAsset, isOtc } from '../../data/assets';
import { useOtcFeed } from '../../data/useOtcFeed';
import { useNow } from '../../hooks/useNow';
import type { AppStackParamList } from '../../navigation/types';
import { useMarketStore } from '../../store/market';
import { useNotificationsStore } from '../../store/notifications';
import { useTradesStore } from '../../store/trades';
import { useUiStore } from '../../store/ui';
import { useWalletStore } from '../../store/wallet';
import { useStyles, useTheme, withAlpha } from '../../theme';
import { money, percent, signedMoney } from '../../utils/format';

const STEP = 1;
const MIN_STAKE = 1;
const NO_DRAWINGS: Drawing[] = [];

export default function TradeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const stack = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const symbol = useMarketStore((s) => s.symbol);
  const asset = getAsset(symbol);
  const otc = isOtc(asset);

  // Chart: zoom/scroll. The candle size is exactly the one selected in the tools panel;
  // pinching only makes those candles wider or narrower.
  const [baseInterval, setBaseInterval] = useState(60);
  const [view, setView] = useState<Viewport>({ pxPerMin: zoomForInterval(60), right: null });
  const interval = baseInterval;
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [tool, setTool] = useState<DrawTool | null>(null);
  const [drawingsBy, setDrawingsBy] = useState<Record<string, Drawing[]>>({});
  const drawings = drawingsBy[symbol] ?? NO_DRAWINGS;
  const [indicators, setIndicators] = useState<IndicatorKey[]>([]);
  const toggleIndicator = (key: IndicatorKey) =>
    setIndicators((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  // Trade settings. Timer = a duration; Time = a clock time the trade ends.
  const [timerMode, setTimerMode] = useState<TimerMode>('timer');
  const [expiry, setExpiry] = useState(60);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [amount, setAmount] = useState(10);
  const [popoverBottom, setPopoverBottom] = useState<number | null>(null);
  const [sheet, setSheet] = useState<null | 'positions' | 'notifications'>(null);
  const [posTab, setPosTab] = useState<'open' | 'history'>('open');
  const fieldsRef = useRef<View>(null);

  const { candles, price, change } = useOtcFeed(interval);
  const now = useNow(1000);
  const mode = useWalletStore((s) => s.mode);
  const setMode = useWalletStore((s) => s.setMode);
  const balance = useWalletStore((s) => s.balances[s.mode]);
  const realBalance = useWalletStore((s) => s.balances.real);
  const positions = useTradesStore((s) => s.positions);
  const placeTrade = useTradesStore((s) => s.placeTrade);
  const notices = useNotificationsStore((s) => s.items);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const bonusDismissed = useUiStore((s) => s.bonusDismissed);
  const dismissBonus = useUiStore((s) => s.dismissBonus);

  const open = useMemo(() => positions.filter((p) => p.status === 'open'), [positions]);
  const closed = useMemo(() => positions.filter((p) => p.status !== 'open'), [positions]);
  const here = useMemo(() => open.filter((p) => p.symbol === symbol), [open, symbol]);
  const markers = useMemo(
    () => here.map((p) => ({ price: p.entry, color: p.direction === 'up' ? colors.up : colors.down })),
    [here, colors],
  );
  const trade = here[0]
    ? { openedAt: here[0].openedAt, expiresAt: here[0].expiresAt, entry: here[0].entry, direction: here[0].direction }
    : undefined;
  const unread = notices.filter((n) => !n.read).length;
  // The promo shows after login while the real account has no funds, until dismissed.
  const showBonus = !bonusDismissed && realBalance === 0;

  // --- Time / Timer ---------------------------------------------------------
  const marks = useMemo(() => timeOptions(now), [Math.floor(now / 1000)]); // eslint-disable-line react-hooks/exhaustive-deps
  const effectiveEnd = endTime !== null && endTime - now >= MIN_LEAD ? endTime : marks[0];
  const expirySeconds = timerMode === 'timer' ? expiry : Math.max(1, Math.round((effectiveEnd - now) / 1000));

  const changeMode = (m: TimerMode) => {
    if (m === 'time' && timerMode === 'timer') {
      // Time mode starts at the whole minute at/after now + the current timer.
      setEndTime(Math.max(Math.ceil((now + expiry * 1000) / 60_000) * 60_000, marks[0]));
    }
    setTimerMode(m);
  };

  const openTimePopover = () => {
    fieldsRef.current?.measureInWindow((_x, y) => setPopoverBottom(Math.max(8, win.height - y + 8)));
  };

  const styles = useStyles((t) => ({
    page: { flex: 1, backgroundColor: t.colors.page },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 0,
      paddingHorizontal: t.spacing.md,
      paddingBottom: t.spacing.sm,
      backgroundColor: t.colors.surface,
    },
    balance: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: t.spacing.sm,
      height: 28,
      borderRadius: t.radius.sm,
      backgroundColor: t.colors.card,
    },
    modeText: { ...t.typography.caption, fontWeight: '800' },
    balText: { ...t.typography.label, color: t.colors.text, fontVariant: ['tabular-nums'] },
    bell: { width: 28, height: 28, marginLeft: -6, borderRadius: t.radius.sm, backgroundColor: t.colors.card, alignItems: 'center', justifyContent: 'center' },
    bellBadge: {
      position: 'absolute',
      top: -5,
      right: -5,
      minWidth: 16,
      height: 14,
      borderRadius: 7,
      paddingHorizontal: 3,
      backgroundColor: t.colors.down,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: { fontSize: 8, color: t.colors.onAccent, fontWeight: '800' },
    spacer: { flex: 1 },
    deposit: {
      height: 26,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.radius.sm,
      backgroundColor: t.colors.up,
      alignItems: 'center',
      justifyContent: 'center',
    },
    depositText: { ...t.typography.caption, color: t.colors.onAccent, fontWeight: '800' },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      marginHorizontal: t.spacing.md,
      marginTop: t.spacing.sm,
      paddingLeft: t.spacing.md,
      paddingRight: t.spacing.sm,
      height: 40,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.up,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 5,
    },
    toastText: { ...t.typography.label, color: t.colors.onAccent, flex: 1, fontWeight: '700' },
    bonus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      marginHorizontal: t.spacing.md,
      marginVertical: t.spacing.sm,
      paddingLeft: t.spacing.md,
      paddingRight: t.spacing.sm,
      height: 38,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.up,
    },
    bonusText: { ...t.typography.label, color: t.colors.onAccent, flex: 1 },
    bonusPill: { paddingHorizontal: 10, height: 24, borderRadius: 12, backgroundColor: withAlpha(t.colors.page, 0.35), alignItems: 'center', justifyContent: 'center' },
    bonusPillText: { ...t.typography.label, color: t.colors.onAccent, fontWeight: '800' },
    chartWrap: { flex: 1 },
    overlayTop: { position: 'absolute', top: 10, left: 64, flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: t.colors.up },
    clock: { ...t.typography.label, color: t.colors.text, fontVariant: ['tabular-nums'] },
    utc: { ...t.typography.caption, color: t.colors.muted },
    floatBtn: { width: 40, height: 40, borderRadius: t.radius.md, backgroundColor: t.colors.card, alignItems: 'center', justifyContent: 'center' },
    badge: {
      position: 'absolute',
      top: -6,
      right: -6,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 4,
      backgroundColor: t.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    panel: {
      backgroundColor: t.colors.surface,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      paddingHorizontal: t.spacing.lg,
      paddingTop: 6,
      paddingBottom: 6,
      gap: 6,
    },
    pairRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, height: 22 },
    pairText: { ...t.typography.label, fontWeight: '700', color: t.colors.text, flexShrink: 1 },
    payoutPct: { ...t.typography.label, fontWeight: '700', color: t.colors.warn },
    priceText: { ...t.typography.caption, marginLeft: 'auto', fontVariant: ['tabular-nums'] },
    fields: { flexDirection: 'row', gap: t.spacing.md, paddingTop: 6 },
    fieldText: { ...t.typography.subheading, color: t.colors.text, fontVariant: ['tabular-nums'] },
    stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    stepBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: t.colors.card, alignItems: 'center', justifyContent: 'center' },
    payoutRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    payoutLabel: { ...t.typography.label, color: t.colors.muted },
    leader: { flex: 1, height: 1, backgroundColor: t.colors.border },
    payoutVal: { ...t.typography.label, fontWeight: '700', color: t.colors.text, fontVariant: ['tabular-nums'] },
    actions: { flexDirection: 'row', gap: t.spacing.md },
    tradeBtn: { flex: 1, height: 38, borderRadius: t.radius.sm, paddingHorizontal: t.spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    tradeText: { ...t.typography.subheading, color: t.colors.onAccent },
    tradeIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: withAlpha(t.colors.onAccent, 0.3), alignItems: 'center', justifyContent: 'center' },
    empty: { ...t.typography.label, color: t.colors.muted, textAlign: 'center', paddingVertical: t.spacing.lg },
    divider: { height: 1, backgroundColor: t.colors.border },
    scroll: { maxHeight: win.height * 0.5 },
    noticeTime: { ...t.typography.caption, color: t.colors.muted },
  }));

  const profit = amount * asset.payout;
  const setStake = (v: number) => setAmount(Math.max(MIN_STAKE, Math.min(Math.floor(balance) || MIN_STAKE, v)));

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const place = (direction: 'up' | 'down') => {
    const res = placeTrade({ symbol, direction, stake: amount, expirySeconds });
    if (!res.ok) return Alert.alert('Trade rejected', res.error);
    showToast(`Trade opened with price: ${res.entry.toFixed(asset.decimals)} ${symbol}`);
  };

  const clockText = new Date(now).toLocaleTimeString([], { hour12: false });
  const offset = -new Date(now).getTimezoneOffset() / 60;
  const utcLabel = `UTC${offset >= 0 ? '+' : '-'}${Math.abs(offset)}`;

  const openNotifications = () => {
    setSheet('notifications');
    markAllRead();
  };

  return (
    <View style={styles.page}>
      {/* top bar: account, notifications, deposit */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.balance} onPress={() => setMode(mode === 'demo' ? 'real' : 'demo')} accessibilityLabel="Switch demo / real wallet">
          <Ionicons name={mode === 'demo' ? 'school' : 'paper-plane'} size={13} color={mode === 'demo' ? colors.warn : colors.up} />
          <Text style={[styles.modeText, { color: mode === 'demo' ? colors.warn : colors.up }]}>{mode === 'demo' ? 'DEMO' : 'LIVE'}</Text>
          <Text style={styles.balText}>{money(balance)}</Text>
          <Ionicons name="chevron-down" size={12} color={colors.muted} />
        </Pressable>
        <Pressable style={styles.bell} onPress={openNotifications} accessibilityLabel="Notifications">
          <Ionicons name="notifications-outline" size={15} color={colors.text} />
          {unread > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          )}
        </Pressable>
        <View style={styles.spacer} />
        <Pressable style={styles.deposit} onPress={() => stack.navigate('Deposit')} accessibilityRole="button">
          <Text style={styles.depositText}>Deposit</Text>
        </Pressable>
      </View>

      {showBonus && (
        <Pressable style={styles.bonus} onPress={() => stack.navigate('Deposit')} accessibilityRole="button">
          <Ionicons name="rocket" size={20} color={colors.onAccent} />
          <Text style={styles.bonusText} numberOfLines={1}>
            Get a 50% bonus on your deposit!
          </Text>
          <View style={styles.bonusPill}>
            <Text style={styles.bonusPillText}>50%</Text>
          </View>
          <Pressable onPress={dismissBonus} hitSlop={10} accessibilityLabel="Dismiss">
            <Ionicons name="close" size={22} color={colors.onAccent} />
          </Pressable>
        </Pressable>
      )}

      {/* chart with overlays */}
      <View style={styles.chartWrap}>
        {toast && (
          <View style={styles.toast}>
            <Text style={styles.toastText} numberOfLines={1}>
              {toast}
            </Text>
            <Pressable onPress={() => setToast(null)} hitSlop={10} accessibilityLabel="Dismiss">
              <Ionicons name="close" size={18} color={colors.onAccent} />
            </Pressable>
          </View>
        )}
        <CandleChart
          candles={candles}
          chartType={chartType}
          tool={tool}
          drawings={drawings}
          onDrawings={(d) => setDrawingsBy((m) => ({ ...m, [symbol]: d }))}
          indicators={indicators}
          decimals={asset.decimals}
          intervalSec={interval}
          viewport={view}
          minPxPerMin={minZoomForInterval(baseInterval)}
          maxPxPerMin={maxZoomForInterval(baseInterval)}
          onViewport={setView}
          expirySec={expirySeconds}
          markers={markers}
          trade={trade}
        />
        <View style={styles.overlayTop}>
          <View style={styles.liveDot} />
          <View>
            <Text style={styles.clock}>{clockText}</Text>
            <Text style={styles.utc}>{utcLabel}</Text>
          </View>
        </View>
        <ChartTools
          interval={baseInterval}
          onInterval={(iv) => {
            setBaseInterval(iv);
            setView({ pxPerMin: zoomForInterval(iv), right: null });
          }}
          chartType={chartType}
          onChartType={setChartType}
          tool={tool}
          onTool={setTool}
          hasDrawings={drawings.length > 0}
          onClear={() => setDrawingsBy((m) => ({ ...m, [symbol]: [] }))}
          indicators={indicators}
          onToggleIndicator={toggleIndicator}
        >
          <Pressable style={styles.floatBtn} onPress={() => setSheet('positions')} accessibilityLabel="Open positions">
            <Ionicons name="briefcase" size={20} color={colors.text} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{open.length}</Text>
            </View>
          </Pressable>
        </ChartTools>
      </View>

      {/* trade panel */}
      <View style={styles.panel}>
        <Pressable style={styles.pairRow} onPress={() => stack.navigate('AssetSelector')} accessibilityRole="button">
          <PairIcon symbol={asset.symbol} />
          <Text style={styles.pairText} numberOfLines={1}>
            {asset.symbol}
            {otc ? ' (OTC)' : ''}
          </Text>
          <Text style={styles.payoutPct}>{Math.round(asset.payout * 100)}%</Text>
          <Ionicons name="chevron-down" size={16} color={colors.muted} />
          <Text style={[styles.priceText, { color: change >= 0 ? colors.up : colors.down }]}>
            {price.toFixed(asset.decimals)}  {percent(change)}
          </Text>
        </Pressable>

        <View ref={fieldsRef} style={styles.fields} collapsable={false}>
          <OutlineField label={timerMode === 'timer' ? 'Timer' : 'Time'} onPress={openTimePopover}>
            <Text style={styles.fieldText}>{timerMode === 'timer' ? hms(expiry) : clockHM(effectiveEnd)}</Text>
          </OutlineField>
          <OutlineField label="Investment">
            <View style={styles.stepRow}>
              <Pressable style={styles.stepBtn} onPress={() => setStake(amount - STEP)} accessibilityLabel="Decrease amount">
                <Ionicons name="remove" size={16} color={colors.text} />
              </Pressable>
              <Text style={styles.fieldText}>{amount} $</Text>
              <Pressable style={styles.stepBtn} onPress={() => setStake(amount + STEP)} accessibilityLabel="Increase amount">
                <Ionicons name="add" size={16} color={colors.text} />
              </Pressable>
            </View>
          </OutlineField>
        </View>

        <View style={styles.payoutRow}>
          <Text style={styles.payoutLabel}>Payout</Text>
          <View style={styles.leader} />
          <Text style={styles.payoutVal}>{(amount + profit).toFixed(2)} $</Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={[styles.tradeBtn, { backgroundColor: colors.up }]} onPress={() => place('up')} accessibilityRole="button">
            <Text style={styles.tradeText}>Up</Text>
            <View style={styles.tradeIcon}>
              <Ionicons name="arrow-up" size={18} color={colors.onAccent} />
            </View>
          </Pressable>
          <Pressable style={[styles.tradeBtn, { backgroundColor: colors.down }]} onPress={() => place('down')} accessibilityRole="button">
            <Text style={styles.tradeText}>Down</Text>
            <View style={styles.tradeIcon}>
              <Ionicons name="arrow-down" size={18} color={colors.onAccent} />
            </View>
          </Pressable>
        </View>
      </View>

      <TimePopover
        visible={popoverBottom !== null}
        onClose={() => setPopoverBottom(null)}
        bottom={popoverBottom ?? 0}
        now={now}
        mode={timerMode}
        onMode={changeMode}
        timerValue={expiry}
        onTimer={(s) => {
          setExpiry(s);
          setTimerMode('timer');
        }}
        timeValue={effectiveEnd}
        onTime={(t) => {
          setEndTime(t);
          setTimerMode('time');
        }}
      />

      <Sheet visible={sheet === 'positions'} title="Trades" onClose={() => setSheet(null)}>
        <Segmented
          options={[
            { label: `Open (${open.length})`, value: 'open' as const },
            { label: `History (${closed.length})`, value: 'history' as const },
          ]}
          value={posTab}
          onChange={setPosTab}
        />
        <View style={styles.scroll}>
          {posTab === 'open' ? (
            open.length === 0 ? (
              <Text style={styles.empty}>No open trades. Place one with Up or Down.</Text>
            ) : (
              open.map((p, i) => (
                <View key={p.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <PositionRow position={p} />
                </View>
              ))
            )
          ) : closed.length === 0 ? (
            <Text style={styles.empty}>Settled trades will appear here.</Text>
          ) : (
            closed.slice(0, 30).map((p, i) => (
              <View key={p.id}>
                {i > 0 && <View style={styles.divider} />}
                <Row
                  left={<PairIcon symbol={p.symbol} size={24} />}
                  title={p.symbol}
                  subtitle={`${p.direction === 'up' ? '▲ Up' : '▼ Down'} · ${money(p.stake)}`}
                  right={signedMoney(p.pnl ?? 0)}
                  rightColor={p.status === 'won' ? colors.up : p.status === 'lost' ? colors.down : colors.muted}
                  rightSub={p.status.toUpperCase()}
                />
              </View>
            ))
          )}
        </View>
      </Sheet>

      <Sheet visible={sheet === 'notifications'} title="Notifications" onClose={() => setSheet(null)}>
        <View style={styles.scroll}>
          {notices.length === 0 ? (
            <Text style={styles.empty}>No notifications.</Text>
          ) : (
            notices.slice(0, 40).map((n, i) => (
              <View key={n.id}>
                {i > 0 && <View style={styles.divider} />}
                <Row
                  left={
                    <Ionicons
                      name={n.kind === 'win' ? 'trending-up' : n.kind === 'loss' ? 'trending-down' : 'information-circle'}
                      size={24}
                      color={n.kind === 'win' ? colors.up : n.kind === 'loss' ? colors.down : colors.accent}
                    />
                  }
                  title={n.title}
                  subtitle={n.body}
                  right={new Date(n.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  rightColor={colors.muted}
                />
              </View>
            ))
          )}
        </View>
      </Sheet>
    </View>
  );
}
