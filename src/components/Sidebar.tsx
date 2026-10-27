import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMail } from '../state/mail';
import { useStyles } from '../state/settings';
import { font, VIEW_META, type Palette } from '../theme';
import type { SmartView } from '../types';
import { AccountBadge, Button, SectionLabel } from './ui';
import type { WebPressState } from './ui';
import { AddAccountButton } from './AddAccountButton';
import { Icon } from './Icon';

function NavItem({ active, onPress, children, label }: {
  active?: boolean;
  onPress(): void;
  children: React.ReactNode;
  label: string;
}) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ hovered }: WebPressState) => [styles.item, active && styles.itemActive, hovered && !active && styles.itemHover]}
    >
      {children}
    </Pressable>
  );
}

export function Sidebar() {
  const { accounts, expired, filter, setFilter, view, setView, unreadByAccount, viewCounts } = useMail();
  const total = Object.values(unreadByAccount).reduce((a, b) => a + b, 0);
  const hasDemo = accounts.some((a) => a.demo);
  const styles = useStyles(makeStyles);

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <View style={styles.brand}>
        <View style={styles.logo}><Icon name="mail" size={18} color={styles.logoIcon.color} strokeWidth={2.2} /></View>
        <Text style={styles.brandText}>Mail Hub</Text>
      </View>

      <Button icon="pen" variant="dark" label="Compose" onPress={() => router.push('/compose')} />

      <View style={styles.group}>
        <SectionLabel>Accounts</SectionLabel>
        <NavItem label="All inboxes" active={filter === 'all'} onPress={() => setFilter('all')}>
          <View style={styles.allBadge}>
            {accounts.slice(0, 3).map((a) => <View key={a.id} style={[styles.allSlice, { backgroundColor: a.color }]} />)}
          </View>
          <Text style={[styles.itemText, filter === 'all' && styles.itemTextActive]}>All inboxes</Text>
          {total ? <Text style={styles.count}>{total}</Text> : null}
        </NavItem>
        {accounts.map((a) => (
          <NavItem key={a.id} label={`${a.label}, ${a.email}`} active={filter === a.id} onPress={() => setFilter(a.id)}>
            <AccountBadge label={a.label} color={a.color} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.itemText, filter === a.id && styles.itemTextActive]} numberOfLines={1}>{a.label}</Text>
              <Text style={styles.email} numberOfLines={1}>{expired.has(a.id) ? 'Sign-in expired, reconnect below' : a.email}</Text>
            </View>
            {unreadByAccount[a.id] ? <Text style={styles.count}>{unreadByAccount[a.id]}</Text> : null}
          </NavItem>
        ))}
        <View style={{ marginTop: 8, gap: 6 }}>
          <AddAccountButton label={hasDemo ? 'Connect real Gmail' : 'Add Gmail account'} />
          <Button small label="Manage accounts" icon="users" onPress={() => router.push('/accounts')} />
          <Button small label="Settings" icon="settings" onPress={() => router.push('/settings')} />
        </View>
      </View>

      <View style={styles.group}>
        <SectionLabel>Smart views</SectionLabel>
        {(Object.keys(VIEW_META) as SmartView[]).map((v) => (
          <NavItem key={v} label={VIEW_META[v].label} active={view === v} onPress={() => setView(view === v ? null : v)}>
            <View style={[styles.viewDot, { backgroundColor: VIEW_META[v].color }]} />
            <Text style={[styles.itemText, view === v && styles.itemTextActive]}>{VIEW_META[v].label}</Text>
            <Text style={styles.count}>{viewCounts[v]}</Text>
          </NavItem>
        ))}
      </View>
    </ScrollView>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  wrap: { width: 260, flexGrow: 0, flexShrink: 0, backgroundColor: c.surface, borderRightWidth: 1, borderRightColor: c.line },
  content: { padding: 14, paddingTop: 20, gap: 22 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8 },
  logo: { width: 34, height: 34, borderRadius: 10, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  logoIcon: { color: c.onAccent },
  brandText: { fontSize: 18, letterSpacing: -0.3, color: c.ink, ...font.heavy },
  group: { gap: 2 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingHorizontal: 10, borderRadius: 10 },
  itemActive: { backgroundColor: c.selected },
  itemHover: { backgroundColor: c.bg },
  itemText: { fontSize: 14, color: c.ink, flexShrink: 1, ...font.medium },
  itemTextActive: { color: c.accentDeep, ...font.bold },
  email: { fontSize: 11, color: c.muted },
  count: { marginLeft: 'auto', fontSize: 12, color: c.muted, ...font.semibold },
  allBadge: { width: 22, height: 22, borderRadius: 7, overflow: 'hidden', flexDirection: 'row' },
  allSlice: { flex: 1 },
  viewDot: { width: 8, height: 8, borderRadius: 4 },
});
