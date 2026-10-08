import React, { useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PairIcon } from '../../components/PairIcon';
import { OtcBadge } from '../../components/OtcBadge';
import { Screen } from '../../components/Screen';
import { ASSETS, Asset, CATEGORIES, Category, isOtc } from '../../data/assets';
import { useLivePrice } from '../../hooks/useLivePrice';
import { useMarketStore } from '../../store/market';
import { useStyles, useTheme, withAlpha } from '../../theme';
import { percent } from '../../utils/format';

function AssetRow({ asset, current, onPick }: { asset: Asset; current: boolean; onPick: () => void }) {
  const { colors } = useTheme();
  const { price, change } = useLivePrice(asset.symbol);
  const styles = useStyles((t) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      paddingVertical: t.spacing.md,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.radius.md,
    },
    current: { backgroundColor: withAlpha(t.colors.accent, 0.12) },
    grow: { flex: 1, gap: 2 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    name: { ...t.typography.subheading, color: t.colors.text },
    sub: { ...t.typography.caption, color: t.colors.muted },
    right: { alignItems: 'flex-end', gap: 2, minWidth: 96 },
    price: { ...t.typography.mono, color: t.colors.text },
    change: { ...t.typography.label, fontVariant: ['tabular-nums'] },
    payout: {
      ...t.typography.label,
      color: t.colors.accent,
      fontWeight: '700',
      width: 44,
      textAlign: 'right',
    },
  }));
  return (
    <Pressable style={[styles.row, current && styles.current]} onPress={onPick} accessibilityRole="button">
      <PairIcon symbol={asset.symbol} size={26} />
      <View style={styles.grow}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{asset.symbol}</Text>
          {isOtc(asset) && <OtcBadge />}
          {current && <Ionicons name="checkmark-circle" size={16} color={colors.accent} />}
        </View>
        <Text style={styles.sub}>{asset.category}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.price}>{price.toFixed(asset.decimals)}</Text>
        <Text style={[styles.change, { color: change >= 0 ? colors.up : colors.down }]}>{percent(change)}</Text>
      </View>
      <Text style={styles.payout}>{Math.round(asset.payout * 100)}%</Text>
    </Pressable>
  );
}

export default function AssetSelectorScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const symbol = useMarketStore((s) => s.symbol);
  const setSymbol = useMarketStore((s) => s.setSymbol);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'All' | Category>('All');

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ASSETS.filter(
      (a) => (category === 'All' || a.category === category) && (!q || a.symbol.toLowerCase().includes(q)),
    );
  }, [query, category]);

  const styles = useStyles((t) => ({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { ...t.typography.heading, color: t.colors.text },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
    },
    input: { ...t.typography.body, flex: 1, minHeight: 44, color: t.colors.text },
    chips: { gap: t.spacing.sm, paddingVertical: 2 },
    chip: {
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.sm,
      borderRadius: t.radius.pill,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
    },
    chipOn: { backgroundColor: t.colors.accent, borderColor: t.colors.accent },
    chipText: { ...t.typography.label, color: t.colors.muted },
    chipTextOn: { color: t.colors.onAccent, fontWeight: '700' },
    colHead: { flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.xl, paddingHorizontal: t.spacing.md },
    colText: { ...t.typography.caption, color: t.colors.muted, textTransform: 'uppercase' },
    empty: { ...t.typography.label, color: t.colors.muted, textAlign: 'center', padding: t.spacing.xl },
    note: { ...t.typography.caption, color: t.colors.muted, lineHeight: 15 },
  }));

  return (
    <Screen scroll={false} topInset={Platform.OS === 'android'}>
      <View style={styles.header}>
        <Text style={styles.title}>Select asset</Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityLabel="Close">
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search pairs"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map((c) => (
            <Pressable key={c} style={[styles.chip, category === c && styles.chipOn]} onPress={() => setCategory(c)}>
              <Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.colHead}>
        <Text style={styles.colText}>Price / Change</Text>
        <Text style={styles.colText}>Payout</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(a) => a.symbol}
        renderItem={({ item }) => (
          <AssetRow
            asset={item}
            current={item.symbol === symbol}
            onPick={() => {
              setSymbol(item.symbol);
              navigation.goBack();
            }}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No pairs match your search.</Text>}
        ListFooterComponent={
          <Text style={styles.note}>OTC = the real market is closed, so the price is generated in-app instead.</Text>
        }
        keyboardShouldPersistTaps="handled"
      />
    </Screen>
  );
}
