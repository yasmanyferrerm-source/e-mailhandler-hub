import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMail } from '../state/mail';
import { colors, font, radius } from '../theme';
import { replySubject } from '../gmail/mime';
import type { MailDetail } from '../types';
import { Avatar, Button } from './ui';
import { Icon } from './Icon';

const QUICK_REPLIES = ['Thanks, got it!', 'Sounds good to me.', "Let me check and get back to you."];

export function MessageView({ accountId, id, onDone }: { accountId: string; id: string; onDone?(): void }) {
  const { open, accountFor, archive, trash, setRead, send, messages } = useMail();
  const [mail, setMail] = useState<MailDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const account = accountFor(accountId);

  useEffect(() => {
    let live = true;
    setMail(null);
    setError(null);
    setReply(null);
    setSent(false);
    open(accountId, id)
      .then((m) => live && setMail(m))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [accountId, id]);

  if (error) return <Text style={[styles.pad, { color: colors.danger }]}>{error}</Text>;
  if (!mail) return <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />;

  const summary = messages.find((m) => m.id === id && m.accountId === accountId) ?? mail;
  const act = (fn: () => Promise<void>) => fn().then(() => onDone?.()).catch((e: Error) => setError(e.message));

  const doSend = async () => {
    if (!reply?.trim()) return;
    setSending(true);
    try {
      await send(accountId, {
        to: mail.fromEmail,
        subject: replySubject(mail.subject),
        body: reply,
        inReplyTo: mail.messageIdHeader,
        threadId: mail.threadId,
      });
      setSent(true);
      setReply(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <View style={styles.card}>
        <View style={styles.toolbar}>
          <Button small icon="archive" label="Archive" onPress={() => act(() => archive(summary))} />
          <Button small icon="unread" label="Mark unread" onPress={() => act(() => setRead(summary, false))} />
          <Button small icon="trash" label="Delete" onPress={() => act(() => trash(summary))} />
          <Button small icon="reply" label="Reply" onPress={() => setReply(reply ?? '')} />
        </View>

        <View style={{ gap: 10 }}>
          {account ? (
            <View style={[styles.pill, { backgroundColor: `${account.color}1A` }]}>
              <View style={[styles.pillDot, { backgroundColor: account.color }]} />
              <Text style={styles.pillText}>Received on {account.label} · {account.email}</Text>
            </View>
          ) : null}
          <Text style={styles.subject} accessibilityRole="header">{mail.subject}</Text>
          <View style={styles.fromRow}>
            <Avatar name={mail.from} size={32} />
            <Text style={styles.fromText}>
              <Text style={{ color: colors.ink, ...font.bold }}>{mail.from}</Text>  {mail.fromEmail} · {new Date(mail.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </Text>
          </View>
        </View>

        <Text style={styles.body} selectable>{mail.bodyText || mail.snippet}</Text>

        {mail.attachments.length ? (
          <View style={styles.attachments}>
            {mail.attachments.map((a) => (
              <View key={a.filename} style={styles.attachment}>
                <Icon name="paperclip" size={14} color={colors.muted} />
                <Text style={styles.attachmentText}>{a.filename}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.replyArea}>
          {sent ? <Text style={styles.sent}>Reply sent from {account?.email}.</Text> : null}
          {reply === null ? (
            <>
              <Text style={styles.label}>Quick replies</Text>
              <View style={styles.quickRow}>
                {QUICK_REPLIES.map((q) => (
                  <Button key={q} small variant="soft" label={q} onPress={() => setReply(q)} />
                ))}
              </View>
            </>
          ) : (
            <>
              <TextInput
                value={reply}
                onChangeText={setReply}
                multiline
                autoFocus
                placeholder={`Reply to ${mail.from}`}
                placeholderTextColor={colors.muted}
                accessibilityLabel="Reply"
                style={styles.input}
              />
              <View style={styles.quickRow}>
                <Button small variant="primary" icon="send" label={sending ? 'Sending…' : 'Send'} disabled={sending || !reply.trim()} onPress={doSend} />
                <Button small label="Cancel" onPress={() => setReply(null)} />
              </View>
            </>
          )}
          <Text style={styles.hint}>
            Replies go out from <Text style={{ color: colors.ink, ...font.bold }}>{account?.email}</Text>, the account this email came to.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: 24, gap: 20 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  pillDot: { width: 8, height: 8, borderRadius: 4 },
  pillText: { fontSize: 12, color: colors.ink, ...font.bold },
  subject: { fontSize: 24, lineHeight: 30, letterSpacing: -0.4, color: colors.ink, ...font.heavy },
  fromRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fromText: { flex: 1, fontSize: 13, color: colors.muted },
  body: { fontSize: 15, lineHeight: 25, color: colors.inkSoft },
  attachments: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attachment: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.chip },
  attachmentText: { fontSize: 13, color: colors.ink, ...font.medium },
  replyArea: { gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.chip },
  label: { fontSize: 12, color: colors.muted, ...font.bold },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { minHeight: 120, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12, fontSize: 15, color: colors.ink, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: colors.muted },
  sent: { fontSize: 13, color: colors.accentDeep, ...font.bold },
});
