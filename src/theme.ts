export const colors = {
  bg: '#F4F6F8',
  surface: '#FFFFFF',
  ink: '#14171F',
  inkSoft: '#2A2F3A',
  muted: '#5B6472',
  line: '#E4E8EC',
  chip: '#EEF1F4',
  accent: '#0F9D8A',
  accentDeep: '#0B5E53',
  accentSoft: '#F2FAF8',
  accentLine: '#CDEBE4',
  night: '#14171F',
  nightText: '#8FE3D3',
  danger: '#B42318',
};

export const font = {
  regular: { fontWeight: '400' as const },
  medium: { fontWeight: '500' as const },
  semibold: { fontWeight: '600' as const },
  bold: { fontWeight: '700' as const },
  heavy: { fontWeight: '800' as const },
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 18, pill: 999 };

export const VIEW_META = {
  'needs-reply': { label: 'Needs reply', color: '#EA580C', bg: '#FFF1E6', fg: '#9A3412' },
  bills: { label: 'Bills & receipts', color: '#0F9D8A', bg: '#E6F5F2', fg: '#0B5E53' },
  travel: { label: 'Travel', color: '#7C3AED', bg: '#F3EEFE', fg: '#5B21B6' },
  newsletters: { label: 'Newsletters', color: '#8A93A0', bg: '#EEF1F4', fg: '#3F4652' },
} as const;

/** Wide layouts (tablet, desktop, web) show sidebar, list and reading pane together. */
export const WIDE_BREAKPOINT = 900;
