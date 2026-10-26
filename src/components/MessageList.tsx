import { useMemo } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { useMail } from '../state/mail';
import { colors, font, radius, VIEW_META } from '../theme';
import { dayBucket, shortTime } from '../lib/format';
import type { MailSummary } from '../types';
import { Avatar } from './ui';
import type { WebPressState } from './ui';
import { Icon } from './Icon';

export function MessageRow({ m, selected, onPress }: { m: MailSummary; selected?: boolean; onPress(): void }) {
  const { accountFor, archive } = useMail();
  const account = accountFor(m.accountId);
  const tag = m.views[0] ? VIEW_META[m.views[0]] : null;
  const weight = m.unread ? font.bold : font.medium;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${m.unread ? 'Unread. ' : ''}From ${m.from}, ${m.subject}, to ${account?.label ?? 'account'}`}
      style={({ hovered }: WebPressState) => [
        styles.row,
        selected && styles.rowSelected,
        hovered && !selected && { borderColor: '#C9D0D8' },
      ]}
    >
      <Avatar name={m.from} color={account?.color} />
      <View style={styles.body}>
        <View style={styles.line}>
          <Text style={[styles.from, weight]} numberOfLines={1}>{m.from}</Text>
          <Text style={styles.time}>{shortTime(m.date)}</Text>
        </View>
        <Text style={[styles.subject, weight]} numberOfLines={1}>{m.subject}</Text>
        <Text style={styles.snippet} numberOfLines={1}>{m.snippet}</Text>
        {tag ? (
          <View style={[styles.tag, { backgroundColor: tag.bg }]}>
            <Text style={[styles.tagText, { color: tag.fg }]}>{tag.label}</Text>
          </View>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Archive"
        onPress={() => archive(m).catch(() => {})}
        hitSlop={6}
        style={styles.quick}
      >
        <Icon name="archive" size={16} color={colors.muted} />
      </Pressable>
    </Pressable>
  );
}

export function MessageList({ selectedId, onOpen, header }: {
  selectedId?: string;
  onOpen(m: MailSummary): void;
  header?: React.ReactElement;
}) {
  const { visible, loading, refresh, error, view, search } = useMail();
  const sections = useMemo(() => {
    const groups = new Map<string, MailSummary[]>();
    for (const m of visible) {
      const k = dayBucket(m.date);
      groups.set(k, [...(groups.get(k) ?? []), m]);
    }
    return [...groups].map(([title, data]) => ({ title, data }));
  }, [visible]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(m) => `${m.accountId}:${m.id}`}
      renderItem={({ item }) => (
        <MessageRow m={item} selected={item.id === selectedId} onPress={() => onOpen(item)} />
      )}
      renderSectionHeader={({ section }) => <Text style={styles.bucket}>{section.title}</Text>}
      ListHeaderComponent={
        <View style={{ gap: 14 }}>
          {header}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.empty}>
            <Icon name="sparkle" size={28} color={colors.accent} />
            <Text style={styles.emptyTitle}>
              {search ? 'No matches' : view ? `Nothing in ${VIEW_META[view].label}` : 'Inbox zero'}
            </Text>
            <Text style={styles.emptyText}>
              {search ? 'Try a different word, or search one account at a time.' : 'You are all caught up. Enjoy it.'}
            </Text>
          </View>
        )
      }
      stickySectionHeadersEnabled={false}
      refreshControl={<RefreshControl refreshing={loading && visible.length > 0} onRefresh={refresh} />}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120, gap: 0 },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowSelected: { borderColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
  body: { flex: 1, minWidth: 0, gap: 3 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  from: { flex: 1, fontSize: 14, color: colors.ink },
  time: { fontSize: 12, color: colors.muted },
  subject: { fontSize: 14, color: colors.ink },
  snippet: { fontSize: 13, color: colors.muted },
  tag: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 11, ...font.bold },
  quick: { alignSelf: 'center', width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  bucket: { fontSize: 12, color: colors.muted, paddingTop: 16, paddingBottom: 8, ...font.bold },
  error: { fontSize: 13, color: colors.danger, ...font.semibold },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 48 },
  emptyTitle: { fontSize: 18, color: colors.ink, ...font.heavy },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center' },
});
