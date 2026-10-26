import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMail } from '../state/mail';
import { colors, font, radius } from '../theme';
import { Button, Chip, IconButton } from '../components/ui';

export default function Compose() {
  const { accounts, filter, send } = useMail();
  const [from, setFrom] = useState(filter !== 'all' ? filter : accounts[0]?.id);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const valid = !!from && /\S+@\S+\.\S+/.test(to) && body.trim().length > 0;

  const submit = async () => {
    if (!from) return;
    setSending(true);
    setError(null);
    try {
      await send(from, { to: to.trim(), subject: subject.trim() || '(no subject)', body });
      close();
    } catch (e) {
      setError((e as Error).message);
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <View style={styles.head}>
          <Text style={styles.title}>New email</Text>
          <IconButton icon="close" label="Close" onPress={close} />
        </View>

        <Text style={styles.label}>Send from</Text>
        <View style={styles.row}>
          {accounts.map((a) => (
            <Chip key={a.id} label={a.email} color={a.color} active={from === a.id} onPress={() => setFrom(a.id)} />
          ))}
        </View>

        <TextInput value={to} onChangeText={setTo} placeholder="To" placeholderTextColor={colors.muted} accessibilityLabel="To"
          autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={styles.input} />
        <TextInput value={subject} onChangeText={setSubject} placeholder="Subject" placeholderTextColor={colors.muted}
          accessibilityLabel="Subject" style={styles.input} />
        <TextInput value={body} onChangeText={setBody} placeholder="Write your message" placeholderTextColor={colors.muted}
          accessibilityLabel="Message" multiline style={[styles.input, styles.body]} />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {accounts.find((a) => a.id === from)?.demo ? (
          <Text style={styles.note}>Sample accounts don't send real mail.</Text>
        ) : null}
        <View style={styles.row}>
          <Button variant="primary" icon="send" label={sending ? 'Sending…' : 'Send'} disabled={!valid || sending} onPress={submit} />
          <Button label="Discard" onPress={close} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, letterSpacing: -0.4, color: colors.ink, ...font.heavy },
  label: { fontSize: 12, color: colors.muted, ...font.bold },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, fontSize: 15, color: colors.ink },
  body: { minHeight: 220, textAlignVertical: 'top' },
  error: { color: colors.danger, fontSize: 13, ...font.semibold },
  note: { color: colors.muted, fontSize: 13 },
});
