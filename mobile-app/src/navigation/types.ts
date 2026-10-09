import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  VerifyCode: undefined;
  ForgotPassword: { email?: string } | undefined;
};

export type TabParamList = {
  Trade: undefined;
  Support: undefined;
  Verify: undefined;
  Portfolio: undefined;
  More: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  AssetSelector: undefined;
  // Reached from the "More" tab rather than the tab bar itself.
  Wallet: undefined;
  Deposit: undefined;
  Withdraw: undefined;
  Settings: undefined;
  Analytics: undefined;
  Tournaments: undefined;
  Leaderboard: undefined;
  Market: undefined;
  Signals: undefined;
};
