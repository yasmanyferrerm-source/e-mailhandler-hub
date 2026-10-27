import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MailProvider } from '../state/mail';
import { SettingsProvider, useSettings } from '../state/settings';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <MailProvider>
          <Screens />
        </MailProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

function Screens() {
  const { colors, dark } = useSettings();

  // Match the page behind the app on web, so overscroll and scrollbars follow the theme.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.body.style.backgroundColor = colors.bg;
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }, [colors, dark]);

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" options={{ title: 'Mail Hub' }} />
        <Stack.Screen name="message/[account]/[id]" options={{ title: 'Message' }} />
        <Stack.Screen name="compose" options={{ presentation: 'modal', title: 'New email' }} />
        <Stack.Screen name="accounts" options={{ presentation: 'modal', title: 'Accounts' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal', title: 'Settings' }} />
      </Stack>
    </>
  );
}
