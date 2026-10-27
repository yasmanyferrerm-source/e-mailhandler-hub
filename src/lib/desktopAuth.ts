import { exchangeCodeAsync, type TokenError } from 'expo-auth-session';
import { discovery } from 'expo-auth-session/providers/google';
import { desktopClient, GMAIL_SCOPES } from './config';

const SIGN_IN_TIMEOUT_MS = 5 * 60_000;

const DONE_PAGE = `<!doctype html><meta charset="utf-8"><title>Mail Hub</title>
<body style="font-family:system-ui,sans-serif;background:#F4F6F8;color:#14171F;display:grid;place-items:center;height:100vh;margin:0">
<div style="text-align:center"><h1 style="font-size:22px">You're signed in</h1>
<p style="color:#5B6472">You can close this tab and go back to Mail Hub.</p></div></body>`;

function base64Url(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(bytes: number): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

/**
 * Desktop sign-in. Google blocks sign-in inside embedded webviews, so this
 * opens the system browser and catches Google's redirect on a one-off
 * 127.0.0.1 port (Google's "loopback" flow for installed apps, with PKCE).
 */
export async function desktopSignIn(loginHint?: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}> {
  const { clientId, clientSecret } = desktopClient;
  if (!clientId) throw new Error('Desktop sign-in is not set up yet. See README, "Set up Google sign-in".');

  const { start, cancel, onUrl } = await import('@fabianlars/tauri-plugin-oauth');
  const { openUrl } = await import('@tauri-apps/plugin-opener');

  const verifier = randomString(48);
  const state = randomString(16);
  const port = await start({ response: DONE_PAGE });
  const redirectUri = `http://127.0.0.1:${port}`;
  let unlisten: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const code = await new Promise<string>((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('Sign-in timed out. Try again.')), SIGN_IN_TIMEOUT_MS);
      onUrl((url) => {
        // Anything on this machine can hit the port, so only accept our own
        // state. The plugin stops listening after the first URL it receives,
        // so a mismatch ends this attempt instead of waiting for the timeout.
        const params = new URL(url).searchParams;
        if (params.get('state') !== state) {
          reject(new Error('Sign-in was interrupted. Try again.'));
          return;
        }
        const error = params.get('error');
        if (error) reject(new Error(error === 'access_denied' ? 'Sign-in was cancelled.' : `Google said: ${error}`));
        else if (params.get('code')) resolve(params.get('code')!);
      }).then((fn) => (unlisten = fn), reject);

      challengeFor(verifier)
        .then((challenge) => {
          const q = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: GMAIL_SCOPES.join(' '),
            code_challenge: challenge,
            code_challenge_method: 'S256',
            state,
            access_type: 'offline',
            prompt: 'consent select_account',
            include_granted_scopes: 'true',
            ...(loginHint ? { login_hint: loginHint } : {}),
          });
          return openUrl(`${discovery.authorizationEndpoint}?${q}`);
        })
        .catch(reject);
    });

    const tokens = await exchangeCodeAsync(
      { clientId, clientSecret, code, redirectUri, extraParams: { code_verifier: verifier } },
      discovery,
    ).catch((e: TokenError) => {
      // The default message quotes the whole OAuth spec; Google's short description is enough.
      throw new Error(`Google sign-in failed: ${e.description ?? e.code ?? e.message}`);
    });
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresIn: tokens.expiresIn };
  } finally {
    clearTimeout(timer);
    unlisten?.();
    cancel(port).catch(() => {});
  }
}
