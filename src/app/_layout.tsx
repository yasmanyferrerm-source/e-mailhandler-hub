import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MailProvider } from '../state/mail';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MailProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="index" options={{ title: 'Mail Hub' }} />
          <Stack.Screen name="message/[account]/[id]" options={{ title: 'Message' }} />
          <Stack.Screen name="compose" options={{ presentation: 'modal', title: 'New email' }} />
          <Stack.Screen name="accounts" options={{ presentation: 'modal', title: 'Accounts' }} />
        </Stack>
      </MailProvider>
    </SafeAreaProvider>
  );
}
