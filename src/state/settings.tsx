import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getJSON, setJSON } from '../lib/storage';
import { palettes, type Palette, type ThemeName } from '../theme';

const SETTINGS_KEY = 'mailhub.settings';

export type Settings = {
  /** 'system' follows the device's light or dark setting. */
  theme: ThemeName | 'system';
  textSize: 'small' | 'normal' | 'large';
  /** 'original' shows emails with their own formatting where the platform can. */
  emailFormat: 'original' | 'simple';
  loadImages: boolean;
};

const DEFAULTS: Settings = { theme: 'system', textSize: 'normal', emailFormat: 'original', loadImages: true };

export const TEXT_SCALE: Record<Settings['textSize'], number> = { small: 0.9, normal: 1, large: 1.18 };

type SettingsState = {
  settings: Settings;
  update(patch: Partial<Settings>): void;
  colors: Palette;
  dark: boolean;
  textScale: number;
};

const Ctx = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    getJSON<Partial<Settings>>(SETTINGS_KEY, {}).then((saved) => setSettings({ ...DEFAULTS, ...saved }));
  }, []);

  const value = useMemo<SettingsState>(() => {
    const name: ThemeName = settings.theme === 'system' ? (system === 'dark' ? 'dark' : 'light') : settings.theme;
    return {
      settings,
      update(patch) {
        setSettings((prev) => {
          const next = { ...prev, ...patch };
          setJSON(SETTINGS_KEY, next);
          return next;
        });
      },
      colors: palettes[name],
      dark: name === 'dark',
      textScale: TEXT_SCALE[settings.textSize],
    };
  }, [settings, system]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSettings needs SettingsProvider');
  return ctx;
}

/** The current palette. */
export function useColors(): Palette {
  return useSettings().colors;
}

/** Builds a component's styles from the current palette, once per theme change. */
export function useStyles<T>(make: (c: Palette) => T): T {
  const colors = useColors();
  return useMemo(() => make(colors), [colors, make]);
}
