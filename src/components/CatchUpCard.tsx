import { StyleSheet, Text, View } from 'react-native';
import { useMail } from '../state/mail';
import { useStyles } from '../state/settings';
import { font, radius, type Palette } from '../theme';
import { Button } from './ui';
import { Icon } from './Icon';

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/** A one-line summary of the inbox with a shortcut to the most useful next step. */
export function CatchUpCard({ compact }: { compact?: boolean }) {
  const { viewCounts, messages, setView, archive, filter } = useMail();
  const styles = useStyles(makeStyles);
  const parts: string[] = [];
  if (viewCounts['needs-reply']) parts.push(`${plural(viewCounts['needs-reply'], 'email')} from people`);
  if (viewCounts.bills) parts.push(plural(viewCounts.bills, 'bill or receipt', 'bills and receipts'));
  if (viewCounts.travel) parts.push(`${viewCounts.travel} travel`);
  if (viewCounts.newsletters) parts.push(`${plural(viewCounts.newsletters, 'newsletter')} that can wait`);
  if (!parts.length) return null;

  const newsletters = messages.filter(
    (m) => m.views.includes('newsletters') && (filter === 'all' || m.accountId === filter),
  );

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.kicker}>
        <Icon name="sparkle" size={14} color={styles.kickerText.color} strokeWidth={2.2} />
        <Text style={styles.kickerText}>Catch-up</Text>
      </View>
      <Text style={styles.text}>{parts.join(' · ')}</Text>
      {!compact ? (
        <View style={styles.actions}>
          {viewCounts['needs-reply'] ? (
            <Button small variant="primary" label="Start with people" onPress={() => setView('needs-reply')} />
          ) : null}
          {newsletters.length ? (
            <Button
              small
              variant="ghost"
              label={`Archive ${plural(newsletters.length, 'newsletter')}`}
              onPress={() => newsletters.forEach((m) => archive(m).catch(() => {}))}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  card: { borderRadius: radius.lg, backgroundColor: c.night, padding: 16, gap: 10 },
  kicker: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kickerText: { fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: c.nightText, ...font.bold },
  text: { color: '#FFFFFF', fontSize: 15, lineHeight: 22 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
