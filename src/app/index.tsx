import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMail } from '../state/mail';
import { useColors, useStyles } from '../state/settings';
import { font, radius, VIEW_META, WIDE_BREAKPOINT, type Palette } from '../theme';
import { greeting } from '../lib/format';
import type { MailSummary, SmartView } from '../types';
import { Sidebar } from '../components/Sidebar';
import { MessageList } from '../components/MessageList';
import { MessageView } from '../components/MessageView';
import { CatchUpCard } from '../components/CatchUpCard';
import { AddAccountButton } from '../components/AddAccountButton';
import { Button, Chip, IconButton } from '../components/ui';
import { Icon } from '../components/Icon';

export default function Inbox() {
  const { ready, accounts } = useMail();
  const { width } = useWindowDimensions();
  const c = useColors();
  if (!ready) return <ActivityIndicator color={c.accent} style={{ flex: 1 }} />;
  if (!accounts.length) return <Welcome />;
  return width >= WIDE_BREAKPOINT ? <WideInbox /> : <NarrowInbox />;
}

function SearchBar() {
  const { search, setSearch } = useMail();
  const styles = useStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.search}>
      <Icon name="search" size={16} color={c.muted} />
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search all accounts"
        placeholderTextColor={c.muted}
        accessibilityLabel="Search all accounts"
        style={styles.searchInput}
        returnKeyType="search"
      />
      {search ? <IconButton icon="close" label="Clear search" onPress={() => setSearch('')} style={styles.searchClear} /> : null}
    </View>
  );
}

function ViewTabs() {
  const { view, setView, viewCounts } = useMail();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
      <Chip label="Everything" active={!view} onPress={() => setView(null)} />
      {(Object.keys(VIEW_META) as SmartView[]).map((v) => (
        <Chip key={v} label={`${VIEW_META[v].label} · ${viewCounts[v]}`} active={view === v} onPress={() => setView(view === v ? null : v)} />
      ))}
    </ScrollView>
  );
}

function WideInbox() {
  const { visible, refresh, loading } = useMail();
  const [selected, setSelected] = useState<MailSummary | null>(null);
  const styles = useStyles(makeStyles);

  // Keep a message open; pick the newest one when the current one leaves the list.
  useEffect(() => {
    if (!selected || !visible.some((m) => m.id === selected.id && m.accountId === selected.accountId)) {
      setSelected(visible[0] ?? null);
    }
  }, [visible]);

  return (
    <View style={styles.wide}>
      <Sidebar />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.topbar}>
          <View style={{ flex: 1 }}><SearchBar /></View>
          <IconButton icon="refresh" label={loading ? 'Refreshing' : 'Refresh'} onPress={refresh} />
        </View>
        <View style={{ flex: 1, flexDirection: 'row', minHeight: 0 }}>
          <View style={styles.listCol}>
            <MessageList
              selectedId={selected?.id}
              onOpen={setSelected}
              header={<View style={{ gap: 14 }}><CatchUpCard /><ViewTabs /></View>}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            {selected ? (
              <MessageView key={`${selected.accountId}:${selected.id}`} accountId={selected.accountId} id={selected.id} />
            ) : (
              <View style={styles.nothing}><Text style={styles.nothingText}>Pick an email to read it here.</Text></View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function NarrowInbox() {
  const { accounts, filter, setFilter, messages } = useMail();
  const total = messages.filter((m) => m.unread).length;
  const current = accounts.find((a) => a.id === filter);
  const styles = useStyles(makeStyles);
  const c = useColors();
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <MessageList
        onOpen={(m) => router.push({ pathname: '/message/[account]/[id]', params: { account: m.accountId, id: m.id } })}
        header={
          <View style={{ gap: 14 }}>
            <View style={styles.hello}>
              <View style={{ flex: 1 }}>
                <Text style={styles.helloSmall}>{greeting()}</Text>
                <Text style={styles.helloBig}>{current ? current.label : 'All inboxes'}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <IconButton icon="users" label="Manage accounts" onPress={() => router.push('/accounts')} />
                <IconButton icon="settings" label="Settings" onPress={() => router.push('/settings')} />
              </View>
            </View>
            <SearchBar />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Chip label={`All · ${total}`} active={filter === 'all'} onPress={() => setFilter('all')} />
              {accounts.map((a) => (
                <Chip key={a.id} label={a.label} color={a.color} active={filter === a.id} onPress={() => setFilter(a.id)} />
              ))}
            </ScrollView>
            <CatchUpCard />
            <ViewTabs />
          </View>
        }
      />
      <Pressable accessibilityRole="button" accessibilityLabel="Compose" onPress={() => router.push('/compose')} style={styles.fab}>
        <Icon name="pen" size={22} color={c.onAccent} strokeWidth={2.2} />
      </Pressable>
    </SafeAreaView>
  );
}

function Welcome() {
  const { startDemo } = useMail();
  const styles = useStyles(makeStyles);
  const c = useColors();
  return (
    <ScrollView contentContainerStyle={styles.welcome}>
      <View style={styles.logo}><Icon name="mail" size={30} color={c.onAccent} strokeWidth={2.2} /></View>
      <Text style={styles.welcomeTitle}>All your Gmail, one calm inbox</Text>
      <Text style={styles.welcomeText}>
        Connect as many Gmail accounts as you like. Every email shows which account it came to, and replies always go
        out from the right one.
      </Text>
      <View style={{ gap: 10, alignSelf: 'stretch' }}>
        <AddAccountButton variant="primary" label="Connect Gmail" />
        <Button label="Try it with sample mail" onPress={startDemo} />
      </View>
      <Text style={styles.privacy}>Your mail goes straight from Google to this device. Nothing is stored on our servers.</Text>
    </ScrollView>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  wide: { flex: 1, flexDirection: 'row', backgroundColor: c.bg },
  topbar: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.line },
  listCol: { width: 460, maxWidth: '45%', borderRightWidth: 1, borderRightColor: c.line },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingLeft: 14, borderRadius: radius.md, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line },
  searchInput: { flex: 1, height: 42, fontSize: 14, color: c.ink, outlineStyle: 'none' } as never,
  searchClear: { borderWidth: 0, width: 40, height: 40, backgroundColor: 'transparent' },
  nothing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  nothingText: { color: c.muted, fontSize: 14 },
  hello: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  helloSmall: { fontSize: 13, color: c.muted, ...font.semibold },
  helloBig: { fontSize: 26, letterSpacing: -0.5, color: c.ink, ...font.heavy },
  fab: {
    position: 'absolute', right: 20, bottom: 32, width: 56, height: 56, borderRadius: 18, backgroundColor: c.accent,
    alignItems: 'center', justifyContent: 'center', shadowColor: c.accent, shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  welcome: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 18, maxWidth: 440, width: '100%', alignSelf: 'center' },
  logo: { width: 64, height: 64, borderRadius: 20, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  welcomeTitle: { fontSize: 30, lineHeight: 36, textAlign: 'center', letterSpacing: -0.6, color: c.ink, ...font.heavy },
  welcomeText: { fontSize: 16, lineHeight: 24, textAlign: 'center', color: c.muted },
  privacy: { fontSize: 12, textAlign: 'center', color: c.muted },
});
