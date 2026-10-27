import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const googleClientIds = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined,
};

/** True inside the Tauri desktop shell, which runs the web build. */
export const isDesktop =
  Platform.OS === 'web' && typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// Google's "Desktop app" clients need their client secret for the token
// exchange. Google documents that secret as not confidential for installed
// apps, so it ships in the desktop build. Never put a Web client's secret here.
export const desktopClient = {
  clientId: process.env.EXPO_PUBLIC_GOOGLE_DESKTOP_CLIENT_ID || undefined,
  clientSecret: process.env.EXPO_PUBLIC_GOOGLE_DESKTOP_CLIENT_SECRET || undefined,
};

/** The client ID this platform signs in with, if one is configured. */
export const platformClientId = isDesktop
  ? desktopClient.clientId
  : Platform.select({
      ios: googleClientIds.iosClientId,
      android: googleClientIds.androidClientId,
      default: googleClientIds.webClientId,
    });

/**
 * Where Google sends the browser back to on web. Defaults to the bare origin,
 * which is wrong when the app lives under a sub-path (GitHub Pages), so add
 * the base URL. Register exactly this value as a redirect URI in Google Cloud.
 */
export function webRedirectUri(): string | undefined {
  if (Platform.OS !== 'web' || isDesktop || typeof window === 'undefined') return undefined;
  const base = Constants.expoConfig?.experiments?.baseUrl?.replace(/\/$/, '');
  return base ? `${window.location.origin}${base}/` : window.location.origin;
}

export const GMAIL_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
];

// Account colors, picked in order as accounts are added. Each pair differs in
// lightness as well as hue so they stay distinguishable for color-blind users.
export const ACCOUNT_COLORS = ['#2563EB', '#EA580C', '#7C3AED', '#0F9D8A', '#DB2777', '#CA8A04'];
