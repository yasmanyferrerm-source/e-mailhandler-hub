import { Pressable, type PressableStateCallbackType, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { font, radius, type Palette } from '../theme';
import { initials } from '../lib/format';
import { useStyles } from '../state/settings';
import { Icon, type IconName } from './Icon';

/** react-native-web adds `hovered` to Pressable's style callback state. */
export type WebPressState = PressableStateCallbackType & { hovered?: boolean };

type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  icon?: IconName;
  variant?: 'primary' | 'dark' | 'outline' | 'soft' | 'ghost';
  small?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, icon, variant = 'outline', small, style, ...rest }: ButtonProps) {
  const styles = useStyles(makeStyles);
  const v = useStyles(makeVariants)[variant];
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      style={({ pressed, hovered }: WebPressState) => [
        styles.btn,
        small && styles.btnSmall,
        v.box,
        (pressed || hovered) && { opacity: 0.85 },
        rest.disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={16} color={v.text.color} strokeWidth={2.2} /> : null}
      <Text style={[styles.btnText, v.text]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, color, style }: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }, style]}
    >
      <Icon name={icon} size={18} color={color ?? styles.iconColor.color} />
    </Pressable>
  );
}

export function Avatar({ name, color, size = 40 }: { name: string; color?: string; size?: number }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.avatarText, { fontSize: size * 0.34 }]}>{initials(name)}</Text>
      </View>
      {color ? <View style={[styles.avatarDot, { backgroundColor: color }]} /> : null}
    </View>
  );
}

export function AccountBadge({ label, color, size = 22 }: { label: string; color: string; size?: number }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size * 0.32, backgroundColor: color }]}>
      <Text style={[styles.badgeText, { fontSize: size * 0.5 }]}>{label[0]?.toUpperCase()}</Text>
    </View>
  );
}

export function Chip({ label, active, color, onPress }: {
  label: string;
  active?: boolean;
  color?: string;
  onPress?: () => void;
}) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : null]}
    >
      {color ? <View style={[styles.chipDot, { backgroundColor: color }]} /> : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function SectionLabel({ children }: { children: string }) {
  const styles = useStyles(makeStyles);
  return <Text style={styles.section}>{children}</Text>;
}

const makeVariants = (c: Palette) => ({
  primary: { box: { backgroundColor: c.accent, borderColor: c.accent }, text: { color: c.onAccent } },
  dark: { box: { backgroundColor: c.inverse, borderColor: c.inverse }, text: { color: c.onInverse } },
  outline: { box: { backgroundColor: c.surface, borderColor: c.line }, text: { color: c.ink } },
  soft: { box: { backgroundColor: c.accentSoft, borderColor: c.accentLine }, text: { color: c.accentDeep } },
  // Sits on the catch-up card, which stays dark in every theme.
  ghost: { box: { backgroundColor: 'transparent', borderColor: c.nightLine }, text: { color: '#FFFFFF' } },
});

const makeStyles = (c: Palette) => StyleSheet.create({
  btn: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnSmall: { minHeight: 36, paddingHorizontal: 12, borderRadius: 10 },
  btnText: { fontSize: 14, ...font.bold },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { backgroundColor: c.chip, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: c.ink, ...font.bold },
  avatarDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: c.surface,
  },
  badge: { alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFFFFF', ...font.heavy },
  iconColor: { color: c.ink },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surface,
  },
  chipActive: { backgroundColor: c.inverse, borderColor: c.inverse },
  chipTextActive: { color: c.onInverse },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 13, color: c.ink, ...font.semibold },
  section: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: c.muted,
    paddingHorizontal: 10,
    paddingBottom: 6,
    ...font.bold,
  },
});
