import { Pressable, type PressableStateCallbackType, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { colors, font, radius } from '../theme';
import { initials } from '../lib/format';
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
  const v = variants[variant];
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

export function IconButton({ icon, label, onPress, color = colors.ink, style }: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }, style]}
    >
      <Icon name={icon} size={18} color={color} />
    </Pressable>
  );
}

export function Avatar({ name, color, size = 40 }: { name: string; color?: string; size?: number }) {
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : null]}
    >
      {color ? <View style={[styles.chipDot, { backgroundColor: color }]} /> : null}
      <Text style={[styles.chipText, active && { color: '#FFFFFF' }]}>{label}</Text>
    </Pressable>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.section}>{children}</Text>;
}

const variants = {
  primary: { box: { backgroundColor: colors.accent, borderColor: colors.accent }, text: { color: '#FFFFFF' } },
  dark: { box: { backgroundColor: colors.night, borderColor: colors.night }, text: { color: '#FFFFFF' } },
  outline: { box: { backgroundColor: colors.surface, borderColor: colors.line }, text: { color: colors.ink } },
  soft: { box: { backgroundColor: colors.accentSoft, borderColor: colors.accentLine }, text: { color: colors.accentDeep } },
  ghost: { box: { backgroundColor: 'transparent', borderColor: '#3A404C' }, text: { color: '#FFFFFF' } },
};

const styles = StyleSheet.create({
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
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.ink, ...font.bold },
  avatarDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badge: { alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFFFFF', ...font.heavy },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.night, borderColor: colors.night },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 13, color: colors.ink, ...font.semibold },
  section: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.muted,
    paddingHorizontal: 10,
    paddingBottom: 6,
    ...font.bold,
  },
});
