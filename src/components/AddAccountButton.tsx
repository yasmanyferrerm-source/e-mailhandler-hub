import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useMail } from '../state/mail';
import { GMAIL_SCOPES, googleClientIds, platformClientId } from '../lib/config';
import { colors } from '../theme';
import { Button } from './ui';

WebBrowser.maybeCompleteAuthSession();

type Props = { variant?: 'primary' | 'dark' | 'outline'; label?: string; loginHint?: string; onAdded?(): void };

/** Opens Google sign-in and adds the chosen Gmail account. */
export function AddAccountButton(props: Props) {
  // The Google hook throws without a client ID for this platform, so only
  // mount it when one is configured.
  if (!platformClientId) {
    return <Text style={{ color: colors.muted, fontSize: 13 }}>Google sign-in is not set up yet. See README, “Set up Google sign-in”.</Text>;
  }
  return <GoogleButton {...props} />;
}

function GoogleButton({ variant = 'outline', label = 'Add Gmail account', loginHint, onAdded }: Props) {
  const { addGoogleAccount } = useMail();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [request, response, promptAsync] = Google.useAuthRequest({
    ...googleClientIds,
    scopes: GMAIL_SCOPES,
    selectAccount: true,
    loginHint,
    extraParams: { access_type: 'offline', include_granted_scopes: 'true' },
  });

  useEffect(() => {
    if (response?.type !== 'success') {
      if (response) setBusy(false);
      return;
    }
    const auth = response.authentication;
    const accessToken = auth?.accessToken ?? response.params.access_token;
    if (!accessToken) return; // Code exchange still running.
    addGoogleAccount({
      accessToken,
      refreshToken: auth?.refreshToken,
      expiresIn: auth?.expiresIn ?? Number(response.params.expires_in || 3600),
    })
      .then(() => onAdded?.())
      .catch((e: Error) => setError(e.message))
      .finally(() => setBusy(false));
  }, [response]);

  return (
    <>
      <Button
        icon="plus"
        variant={variant}
        label={busy ? 'Connecting…' : label}
        disabled={!request || busy}
        onPress={() => {
          setError(null);
          setBusy(true);
          promptAsync().catch(() => setBusy(false));
        }}
      />
      {error ? <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text> : null}
    </>
  );
}
