import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AnalyticsScreen from '../screens/Analytics';
import AssetSelectorScreen from '../screens/AssetSelector';
import DepositScreen from '../screens/Deposit';
import ForgotPasswordScreen from '../screens/ForgotPassword';
import LeaderboardScreen from '../screens/Leaderboard';
import MarketScreen from '../screens/Market';
import MoreScreen from '../screens/More';
import PortfolioScreen from '../screens/Portfolio';
import SettingsScreen from '../screens/Settings';
import SignInScreen from '../screens/SignIn';
import SignUpScreen from '../screens/SignUp';
import SignalsScreen from '../screens/Signals';
import SupportScreen from '../screens/Support';
import TournamentsScreen from '../screens/Tournaments';
import TradeScreen from '../screens/Trade';
import VerifyCodeScreen from '../screens/VerifyCode';
import VerifyScreen from '../screens/Verify';
import WalletScreen from '../screens/Wallet';
import WithdrawScreen from '../screens/Withdraw';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/auth';
import { Theme, useTheme } from '../theme';
import type { AppStackParamList, AuthStackParamList, TabParamList } from './types';

/** Plain back-arrow header for screens reached off the tab bar (the "More" menu). */
const backHeader = (colors: Theme['colors']) => ({
  headerShown: true,
  headerTitle: '',
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.page },
  headerTintColor: colors.text,
});

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

// Outline glyph when inactive, filled glyph when active — thin icon-only bar like the reference.
// Order/icons follow the reference bar's pattern: 1st = chart (Trade), 2nd = chat bubble
// (Support), 3rd = profile-like (Verify — it's the account/identity screen), 4th = a cup
// (Portfolio — your trading record), 5th = "…" (More — Wallet, Deposit and Withdraw live
// behind it, off the main bar).
const TAB_ICONS: Record<keyof TabParamList, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Trade: ['stats-chart-outline', 'stats-chart'],
  Support: ['chatbubble-ellipses-outline', 'chatbubble-ellipses'],
  Verify: ['person-circle-outline', 'person-circle'],
  Portfolio: ['trophy-outline', 'trophy'],
  More: ['ellipsis-horizontal-circle-outline', 'ellipsis-horizontal-circle'],
};

function AppTabs() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: 54 + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom + 6,
        },
        tabBarButtonTestID: route.name,
        tabBarAccessibilityLabel: route.name,
        tabBarShowLabel: false, // icon-only bar
        tabBarIcon: ({ color, focused }) => <Ionicons name={TAB_ICONS[route.name][focused ? 1 : 0]} size={24} color={color} />,
      })}
    >
      <Tabs.Screen name="Trade" component={TradeScreen} />
      <Tabs.Screen name="Support" component={SupportScreen} />
      <Tabs.Screen name="Verify" component={VerifyScreen} />
      <Tabs.Screen name="Portfolio" component={PortfolioScreen} />
      <Tabs.Screen name="More" component={MoreScreen} />
    </Tabs.Navigator>
  );
}

/** Auth stack when signed out, tabs (+ asset selector) when signed in. */
export function RootNavigator() {
  const { colors, isDark } = useTheme();
  const ready = useAuthStore((s) => s.ready);
  const user = useAuthStore((s) => s.user);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: colors.accent,
      background: colors.page,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.warn,
    },
  };

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.page }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {user ? (
        <AppStack.Navigator screenOptions={{ headerShown: false }}>
          <AppStack.Screen name="Tabs" component={AppTabs} />
          <AppStack.Screen name="AssetSelector" component={AssetSelectorScreen} options={{ presentation: 'modal' }} />
          {/* Reached from the "More" tab — a plain back header, since they're off the tab bar. */}
          <AppStack.Screen name="Wallet" component={WalletScreen} options={backHeader(colors)} />
          <AppStack.Screen name="Deposit" component={DepositScreen} options={backHeader(colors)} />
          <AppStack.Screen name="Withdraw" component={WithdrawScreen} options={backHeader(colors)} />
          <AppStack.Screen name="Settings" component={SettingsScreen} options={backHeader(colors)} />
          <AppStack.Screen name="Analytics" component={AnalyticsScreen} options={backHeader(colors)} />
          <AppStack.Screen name="Tournaments" component={TournamentsScreen} options={backHeader(colors)} />
          <AppStack.Screen name="Leaderboard" component={LeaderboardScreen} options={backHeader(colors)} />
          <AppStack.Screen name="Market" component={MarketScreen} options={backHeader(colors)} />
          <AppStack.Screen name="Signals" component={SignalsScreen} options={backHeader(colors)} />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="SignIn" component={SignInScreen} />
          <AuthStack.Screen name="SignUp" component={SignUpScreen} />
          <AuthStack.Screen name="VerifyCode" component={VerifyCodeScreen} />
          <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
