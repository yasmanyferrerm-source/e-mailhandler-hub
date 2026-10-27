import type { SmartView } from './types';

export type ThemeName = 'light' | 'soft' | 'dark';

/** Every color the app draws with. Each theme fills in all of them. */
export type Palette = {
  bg: string;
  surface: string;
  ink: string;
  inkSoft: string;
  muted: string;
  line: string;
  lineStrong: string;
  chip: string;
  accent: string;
  onAccent: string;
  accentDeep: string;
  accentSoft: string;
  accentLine: string;
  selected: string;
  /** Dark buttons and active chips. */
  inverse: string;
  onInverse: string;
  /** The catch-up card. */
  night: string;
  nightText: string;
  nightLine: string;
  danger: string;
  tags: Record<SmartView, { bg: string; fg: string }>;
};

const light: Palette = {
  bg: '#F4F6F8',
  surface: '#FFFFFF',
  ink: '#14171F',
  inkSoft: '#2A2F3A',
  muted: '#5B6472',
  line: '#E4E8EC',
  lineStrong: '#C9D0D8',
  chip: '#EEF1F4',
  accent: '#0F9D8A',
  onAccent: '#FFFFFF',
  accentDeep: '#0B5E53',
  accentSoft: '#F2FAF8',
  accentLine: '#CDEBE4',
  selected: '#E6F5F2',
  inverse: '#14171F',
  onInverse: '#FFFFFF',
  night: '#14171F',
  nightText: '#8FE3D3',
  nightLine: '#3A404C',
  danger: '#B42318',
  tags: {
    'needs-reply': { bg: '#FFF1E6', fg: '#9A3412' },
    bills: { bg: '#E6F5F2', fg: '#0B5E53' },
    travel: { bg: '#F3EEFE', fg: '#5B21B6' },
    newsletters: { bg: '#EEF1F4', fg: '#3F4652' },
  },
};

// Light, but with less glare: grey paper instead of white, darker secondary text.
const soft: Palette = {
  ...light,
  bg: '#E3E6EA',
  surface: '#EEF0F3',
  inkSoft: '#1F242D',
  muted: '#454D5A',
  line: '#D2D7DD',
  lineStrong: '#B3BBC5',
  chip: '#DDE1E6',
  accentSoft: '#E3F1EE',
  accentLine: '#B9DDD5',
  selected: '#D5EBE6',
  tags: {
    'needs-reply': { bg: '#F8E3D3', fg: '#8A2E0E' },
    bills: { bg: '#D5EBE6', fg: '#0A5248' },
    travel: { bg: '#E6DEF8', fg: '#4C1D95' },
    newsletters: { bg: '#DDE1E6', fg: '#363C47' },
  },
};

const dark: Palette = {
  bg: '#0E1115',
  surface: '#171B21',
  ink: '#ECEFF3',
  inkSoft: '#D3D8DF',
  muted: '#9CA5B1',
  line: '#272D35',
  lineStrong: '#3A424D',
  chip: '#222831',
  accent: '#3DCDB6',
  onAccent: '#04211C',
  accentDeep: '#7FE3D1',
  accentSoft: '#122926',
  accentLine: '#24504A',
  selected: '#15302C',
  inverse: '#ECEFF3',
  onInverse: '#0E1115',
  night: '#13302C',
  nightText: '#8FE3D3',
  nightLine: '#2F5A53',
  danger: '#FF8B80',
  tags: {
    'needs-reply': { bg: '#3A2314', fg: '#FDBA8C' },
    bills: { bg: '#123430', fg: '#7FE3D1' },
    travel: { bg: '#2A2145', fg: '#C4B5FD' },
    newsletters: { bg: '#252B34', fg: '#C2C9D3' },
  },
};

export const palettes: Record<ThemeName, Palette> = { light, soft, dark };

export const font = {
  regular: { fontWeight: '400' as const },
  medium: { fontWeight: '500' as const },
  semibold: { fontWeight: '600' as const },
  bold: { fontWeight: '700' as const },
  heavy: { fontWeight: '800' as const },
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 18, pill: 999 };

/** Labels and dot colors for the smart views. Tag colors live in each palette. */
export const VIEW_META = {
  'needs-reply': { label: 'Needs reply', color: '#EA580C' },
  bills: { label: 'Bills & receipts', color: '#0F9D8A' },
  travel: { label: 'Travel', color: '#7C3AED' },
  newsletters: { label: 'Newsletters', color: '#8A93A0' },
} as const;

/** Wide layouts (tablet, desktop, web) show sidebar, list and reading pane together. */
export const WIDE_BREAKPOINT = 900;
