import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMail } from '../state/mail';
import { useSettings, useStyles, type Settings } from '../state/settings';
import { font, palettes, radius, type Palette, type ThemeName } from '../theme';
import { canShowHtml } from '../components/HtmlBody';
import { Button, IconButton, SectionLabel } from '../components/ui';
import { Icon } from '../components/Icon';

const THEMES: { value: Settings['theme']; label: string; hint: string }[] = [
  { value: 'system', label: 'Automatic', hint: 'Follows your device' },
  { value: 'light', label: 'Light', hint: 'Bright and crisp' },
  { value: 'soft', label: 'Soft', hint: 'Less glare' },
  { value: 'dark', label: 'Dark', hint: 'Easy on the eyes' },
];

const TEXT_SIZES: { value: Settings['textSize']; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
];

const FORMATS: { value: Settings['emailFormat']; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 'simple', label: 'Simple text' },
];

export default function SettingsScreen() {
  const { settings, update, colors: c } = useSettings();
  const { accounts } = useMail();
  const styles = useStyles(makeStyles);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.head}>
          <Text style={styles.title} accessibilityRole="header">Settings</Text>
          <IconButton icon="close" label="Close" onPress={close} />
        </View>

        <View style={styles.group}>
          <SectionLabel>Theme</SectionLabel>
          <View style={styles.themes}>
            {THEMES.map((t) => (
              <ThemeCard key={t.value} {...t} active={settings.theme === t.value} onPress={() => update({ theme: t.value })} />
            ))}
          </View>
        </View>

        <View style={styles.group}>
          <SectionLabel>Reading</SectionLabel>
          <View style={styles.card}>
            <Row title="Email text size" hint="For the inbox list and the emails you open.">
              <Segmented options={TEXT_SIZES} value={settings.textSize} onChange={(textSize) => update({ textSize })} />
            </Row>
            <View style={styles.divider} />
            <Row
              title="Show emails as"
              hint={
                canShowHtml
                  ? 'Original keeps the sender’s layout and pictures. Simple text is plainer and easier to read.'
                  : 'Phones show simple text for now. Original formatting works on the web and desktop apps.'
              }
            >
              <Segmented options={FORMATS} value={settings.emailFormat} onChange={(emailFormat) => update({ emailFormat })} />
            </Row>
            <View style={styles.divider} />
            <Row title="Load pictures in emails" hint="Turn off to stop senders seeing when you open their email.">
              <Switch
                value={settings.loadImages}
                onValueChange={(loadImages) => update({ loadImages })}
                trackColor={{ true: c.accent, false: c.lineStrong }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Load pictures in emails"
              />
            </Row>
          </View>
        </View>

        <View style={styles.group}>
          <SectionLabel>Accounts</SectionLabel>
          <Pressable accessibilityRole="button" onPress={() => router.push('/accounts')} style={[styles.card, styles.linkRow]}>
            <Icon name="users" size={18} color={c.ink} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Manage accounts</Text>
              <Text style={styles.rowHint}>{accounts.length === 1 ? '1 account connected' : `${accounts.length} accounts connected`}</Text>
            </View>
            <View style={{ transform: [{ rotate: '180deg' }] }}><Icon name="back" size={18} color={c.muted} strokeWidth={2.2} /></View>
          </Pressable>
        </View>

        <View style={styles.group}>
          <SectionLabel>About</SectionLabel>
          <View style={styles.card}>
            <Text style={styles.rowTitle}>Mail Hub {Constants.expoConfig?.version ?? ''}</Text>
            <Text style={styles.rowHint}>
              Your mail goes straight from Google to this device. Settings are saved on this device only.
            </Text>
          </View>
        </View>

        <Button label="Done" variant="dark" onPress={close} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ThemeCard({ value, label, hint, active, onPress }: {
  value: Settings['theme'];
  label: string;
  hint: string;
  active: boolean;
  onPress(): void;
}) {
  const styles = useStyles(makeStyles);
  const { colors: c } = useSettings();
  // Automatic shows half light, half dark.
  const halves: ThemeName[] = value === 'system' ? ['light', 'dark'] : [value];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      accessibilityLabel={`${label} theme`}
      onPress={onPress}
      style={[styles.theme, active && styles.themeActive]}
    >
      <View style={styles.preview}>
        {halves.map((h) => <Preview key={h} p={palettes[h]} />)}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={styles.themeLabel}>{label}</Text>
        {active ? <Icon name="check" size={16} color={c.accentDeep} strokeWidth={2.6} /> : null}
      </View>
      <Text style={styles.rowHint}>{hint}</Text>
    </Pressable>
  );
}

/** A tiny inbox drawn in one palette. */
function Preview({ p }: { p: Palette }) {
  return (
    <View style={{ flex: 1, backgroundColor: p.bg, padding: 8, gap: 5 }}>
      {[0.9, 0.7, 0.8].map((w, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: p.surface, borderRadius: 5, padding: 5, borderWidth: 1, borderColor: p.line }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === 0 ? p.accent : p.chip }} />
          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ height: 3, width: `${w * 100}%`, borderRadius: 2, backgroundColor: p.ink }} />
            <View style={{ height: 3, width: `${w * 70}%`, borderRadius: 2, backgroundColor: p.muted }} />
          </View>
        </View>
      ))}
    </View>
  );
}

function Row({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, minWidth: 200, gap: 2 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowHint}>{hint}</Text>
      </View>
      {children}
    </View>
  );
}

function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[];
  value: T;
  onChange(v: T): void;
}) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup">
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === o.value }}
          onPress={() => onChange(o.value)}
          style={[styles.segment, value === o.value && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, value === o.value && styles.segmentTextActive]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  wrap: { padding: 20, gap: 22, maxWidth: 720, width: '100%', alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, letterSpacing: -0.4, color: c.ink, ...font.heavy },
  group: { gap: 4 },
  themes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  theme: { flexGrow: 1, flexBasis: 140, padding: 10, gap: 4, borderRadius: radius.lg, borderWidth: 2, borderColor: c.line, backgroundColor: c.surface },
  themeActive: { borderColor: c.accent },
  preview: { height: 84, borderRadius: 10, overflow: 'hidden', flexDirection: 'row', marginBottom: 4, borderWidth: 1, borderColor: c.line },
  themeLabel: { fontSize: 14, color: c.ink, ...font.bold },
  card: { padding: 16, gap: 4, borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingVertical: 4 },
  rowTitle: { fontSize: 15, color: c.ink, ...font.bold },
  rowHint: { fontSize: 13, lineHeight: 18, color: c.muted },
  divider: { height: 1, backgroundColor: c.line, marginVertical: 10 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  segmented: { flexDirection: 'row', padding: 3, gap: 3, borderRadius: radius.md, backgroundColor: c.chip },
  segment: { minHeight: 36, paddingHorizontal: 14, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: c.surface, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  segmentText: { fontSize: 13, color: c.muted, ...font.semibold },
  segmentTextActive: { color: c.ink, ...font.bold },
});
