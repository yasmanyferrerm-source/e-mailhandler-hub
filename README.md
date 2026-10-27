# Mail Hub

One calm inbox for all your Gmail accounts, on the web, desktop (Mac, Windows, Linux) and mobile (iPhone, Android), built from one codebase.

- **Unified inbox.** Every connected account in one list, newest first. A colored dot on each email shows which account it came to.
- **Smart views.** Needs reply, Bills & receipts, Travel and Newsletters, sorted on the device from email headers.
- **Catch-up card.** A one-line summary of what's waiting, with one tap to start with people or archive every newsletter.
- **Replies from the right account.** Quick replies and full replies always go out from the address the email was sent to.
- **Private by design.** The app talks straight to Gmail. Sign-in tokens stay on the device (Keychain/Keystore on mobile, browser storage on web and desktop), and there is no server of ours in between.
- **Demo mode.** "Try it with sample mail" runs the whole app with three sample accounts, so you can try it before setting up Google sign-in.

## Stack

| Piece | Choice |
| --- | --- |
| App | [Expo](https://expo.dev) SDK 58 (React Native 0.88) with Expo Router, which builds iOS, Android and web |
| Desktop | [Tauri 2](https://tauri.app) wrapping the web build (`src-tauri/`) |
| Mail | Gmail REST API, called from the app (`src/gmail/api.ts`) |
| Sign-in | Google OAuth through `expo-auth-session` (PKCE on mobile) |

```
src/
  app/            screens (Expo Router): inbox, message, compose, accounts
  components/     sidebar, message list, reading pane, catch-up card, buttons
  gmail/          Gmail client, MIME helpers (+ tests), demo mailbox
  state/mail.tsx  accounts, tokens, unified inbox, optimistic actions
src-tauri/        desktop shell
```

## Run it

```bash
npm install
npm run web          # opens in the browser; pick "Try it with sample mail"
npm start            # then scan the QR code with Expo Go, or press i / a
npm run desktop:dev  # desktop window (needs Rust and the Tauri prerequisites)
```

Checks:

```bash
npm run typecheck
npm test
npm run build:web    # static web build in dist/
```

## Set up Google sign-in

Demo mode works without this. To connect real Gmail accounts you need your own Google OAuth client IDs. This takes about 10 minutes, once.

1. Go to the [Google Cloud console](https://console.cloud.google.com/) and create a project (for example "Mail Hub").
2. **APIs & Services → Library**: search for **Gmail API** and click **Enable**.
3. **APIs & Services → OAuth consent screen** (also called "Google Auth Platform"):
   - User type **External**, app name "Mail Hub", your email as the support and developer contact.
   - Scopes: add `gmail.modify` and `gmail.send` (plus `openid`, `email`, `profile`).
   - **Test users**: add every Gmail address you want to connect. While the app is in "Testing", only these addresses can sign in.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**, once per platform:
   - **Web application**: add `http://localhost:8081` (and your deployed web address later) under *Authorized JavaScript origins* and *Authorized redirect URIs*.
   - **iOS**: bundle ID `com.mailhub.app`.
   - **Android**: package name `com.mailhub.app`, plus the SHA-1 of your signing key (`npx eas-cli credentials` shows it).
   - **Desktop app**: no settings needed. Google shows a client ID *and* a client secret; copy both.
5. Copy `.env.example` to `.env` and paste the client IDs:

   ```
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_DESKTOP_CLIENT_ID=...apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_DESKTOP_CLIENT_SECRET=GOCSPX-...
   ```

6. Restart `npm run web` and click **Connect Gmail**. Repeat **Add Gmail account** for each extra account.

Client IDs are not secrets, but `.env` is git-ignored anyway. The one exception to "no secrets in the app" is the **Desktop app** client secret: Google requires it for desktop sign-in and [documents it as not confidential](https://developers.google.com/identity/protocols/oauth2/native-app) for installed apps. Never put a *Web application* client's secret in this app.

### Good to know

- **Web stays signed in for about an hour.** Google gives browser apps a one-hour token with no refresh token. When it runs out, the account shows "Sign-in expired" and one tap on **Reconnect** fixes it. iPhone and Android get a refresh token and stay signed in.
- **Mobile sign-in needs a development build**, not Expo Go, because Google redirects back to the app's own bundle ID: `npx expo run:ios` / `npx expo run:android`, or `npx eas-cli build --profile development`.
- **Desktop signs in through your normal browser.** Google blocks sign-in inside app windows, so the desktop app opens your default browser, then catches Google's answer on a one-off `127.0.0.1` port. Desktop gets a refresh token and stays signed in.
- **Publishing to other people** needs Google to verify the app, because `gmail.modify` is a restricted scope. For your own accounts, Testing mode with yourself as a test user is enough.

## Roadmap

- Swipe to archive or snooze on mobile
- Snooze and reminders
- Thread view (whole conversation instead of single messages)
- Push notifications for new mail
- Optional AI catch-up summaries (needs a small server to hold the API key)
- More providers (Outlook, iCloud, IMAP)
