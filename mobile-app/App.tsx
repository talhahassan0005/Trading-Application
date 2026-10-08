import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/auth';

export default function App() {
  // Restore the saved session (if any) before the navigator picks auth vs. app screens.
  useEffect(() => {
    void useAuthStore.getState().init();
  }, []);

  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}
