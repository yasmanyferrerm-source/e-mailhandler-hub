import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMail } from '../state/mail';
import { colors, font, radius } from '../theme';
import { AccountBadge, Button, IconButton } from '../components/ui';
import { AddAccountButton } from '../components/AddAccountButton';

export default function Accounts() {
  const { accounts, expired, removeAccount, unreadByAccount } = useMail();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.head}>
          <Text style={styles.title}>Accounts</Text>
          <IconButton icon="close" label="Close" onPress={close} />
        </View>
        {accounts.map((a) => (
          <View key={a.id} style={styles.card}>
            <AccountBadge label={a.label} color={a.color} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.name}>{a.label}{a.demo ? ' (sample)' : ''}</Text>
              <Text style={styles.email} numberOfLines={1}>{a.email}</Text>
              <Text style={[styles.status, expired.has(a.id) && { color: colors.danger }]}>
                {expired.has(a.id) ? 'Sign-in expired' : `${unreadByAccount[a.id] ?? 0} unread`}
              </Text>
            </View>
            <View style={{ gap: 6, alignItems: 'flex-end' }}>
              {expired.has(a.id) ? <AddAccountButton variant="primary" label="Reconnect" loginHint={a.email} /> : null}
              <Button small label="Remove" onPress={() => removeAccount(a.id)} />
            </View>
          </View>
        ))}
        <AddAccountButton variant="dark" onAdded={close} />
        <Text style={styles.note}>
          Removing an account only signs it out of this app. Your mail stays in Gmail.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 24, letterSpacing: -0.4, color: colors.ink, ...font.heavy },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  name: { fontSize: 15, color: colors.ink, ...font.bold },
  email: { fontSize: 13, color: colors.muted },
  status: { fontSize: 12, color: colors.muted, marginTop: 2, ...font.semibold },
  note: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 8 },
});
