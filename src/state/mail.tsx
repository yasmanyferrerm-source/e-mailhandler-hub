import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { refreshAsync } from 'expo-auth-session';
import { discovery } from 'expo-auth-session/providers/google';
import { AuthExpiredError, fetchProfileEmail, GmailSource, type MailSource } from '../gmail/api';
import { DEMO_ACCOUNTS, DemoSource } from '../gmail/demo';
import { ACCOUNT_COLORS, desktopClient, isDesktop, platformClientId } from '../lib/config';
import { getJSON, removeItem, setJSON } from '../lib/storage';
import type { Account, MailDetail, MailSummary, OutgoingMail, SmartView, Tokens } from '../types';

const ACCOUNTS_KEY = 'mailhub.accounts';
const tokenKey = (id: string) => `mailhub.tokens.${id.replace(/[^A-Za-z0-9._-]/g, '_')}`;
const PER_ACCOUNT = 30;

export type AccountFilter = 'all' | string;

type MailState = {
  ready: boolean;
  accounts: Account[];
  expired: Set<string>;
  messages: MailSummary[];
  loading: boolean;
  error: string | null;
  filter: AccountFilter;
  view: SmartView | null;
  search: string;
  visible: MailSummary[];
  unreadByAccount: Record<string, number>;
  viewCounts: Record<SmartView, number>;
  setFilter(f: AccountFilter): void;
  setView(v: SmartView | null): void;
  setSearch(q: string): void;
  refresh(): Promise<void>;
  addGoogleAccount(t: { accessToken: string; refreshToken?: string; expiresIn?: number }): Promise<Account>;
  startDemo(): void;
  removeAccount(id: string): Promise<void>;
  accountFor(id: string): Account | undefined;
  open(accountId: string, id: string): Promise<MailDetail>;
  archive(m: MailSummary): Promise<void>;
  trash(m: MailSummary): Promise<void>;
  setRead(m: MailSummary, read: boolean): Promise<void>;
  send(accountId: string, mail: OutgoingMail): Promise<void>;
};

const Ctx = createContext<MailState | null>(null);

export function useMail(): MailState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMail must be used inside <MailProvider>');
  return v;
}

async function validToken(accountId: string): Promise<string> {
  const tokens = await getJSON<Tokens | null>(tokenKey(accountId), null);
  if (!tokens) throw new AuthExpiredError(accountId);
  if (tokens.expiresAt - 60_000 > Date.now()) return tokens.accessToken;
  // Only installed apps (iOS, Android, desktop) get a refresh token. On web
  // the user reconnects the account when its one-hour token runs out.
  if (!tokens.refreshToken || !platformClientId) throw new AuthExpiredError(accountId);
  const fresh = await refreshAsync(
    {
      clientId: platformClientId,
      clientSecret: isDesktop ? desktopClient.clientSecret : undefined,
      refreshToken: tokens.refreshToken,
    },
    discovery,
  );
  const next: Tokens = {
    accessToken: fresh.accessToken,
    refreshToken: fresh.refreshToken ?? tokens.refreshToken,
    expiresAt: Date.now() + (fresh.expiresIn ?? 3600) * 1000,
  };
  await setJSON(tokenKey(accountId), next);
  return next.accessToken;
}

export function MailProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expired, setExpired] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<MailSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AccountFilter>('all');
  const [view, setView] = useState<SmartView | null>(null);
  const [search, setSearch] = useState('');
  const loadId = useRef(0);

  useEffect(() => {
    getJSON<Account[]>(ACCOUNTS_KEY, []).then((saved) => {
      setAccounts(saved.filter((a) => !a.demo));
      setReady(true);
    });
  }, []);

  const sources = useMemo(() => {
    const map = new Map<string, MailSource>();
    for (const a of accounts) {
      map.set(a.id, a.demo ? new DemoSource(a) : new GmailSource(a.id, a.email, () => validToken(a.id)));
    }
    return map;
  }, [accounts]);

  const source = useCallback(
    (id: string) => {
      const s = sources.get(id);
      if (!s) throw new Error('Unknown account');
      return s;
    },
    [sources],
  );

  const markExpired = useCallback((id: string) => {
    setExpired((prev) => new Set(prev).add(id));
  }, []);

  const refresh = useCallback(async () => {
    const id = ++loadId.current;
    setLoading(true);
    setError(null);
    const query = ['in:inbox', search.trim()].filter(Boolean).join(' ');
    const results = await Promise.allSettled(
      accounts.map((a) => source(a.id).list(query, PER_ACCOUNT)),
    );
    if (id !== loadId.current) return; // A newer load started meanwhile.
    const merged: MailSummary[] = [];
    const failures: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') merged.push(...r.value);
      else if (r.reason instanceof AuthExpiredError) markExpired(accounts[i].id);
      else failures.push(accounts[i].label);
    });
    merged.sort((a, b) => b.date - a.date);
    setMessages(merged);
    setError(failures.length ? `Couldn't load ${failures.join(', ')}. Pull to retry.` : null);
    setLoading(false);
  }, [accounts, search, source, markExpired]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(refresh, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [ready, refresh, search]);

  const persist = (next: Account[]) => setJSON(ACCOUNTS_KEY, next.filter((a) => !a.demo));

  const addGoogleAccount: MailState['addGoogleAccount'] = async (t) => {
    const email = await fetchProfileEmail(t.accessToken);
    await setJSON(tokenKey(email), {
      accessToken: t.accessToken,
      refreshToken: t.refreshToken,
      expiresAt: Date.now() + (t.expiresIn ?? 3600) * 1000,
    } satisfies Tokens);
    const existing = accounts.find((a) => a.id === email);
    const account: Account = existing ?? {
      id: email,
      email,
      label: email.endsWith('@gmail.com') ? 'Personal' : email.split('@')[1].split('.')[0],
      color: ACCOUNT_COLORS[accounts.filter((a) => !a.demo).length % ACCOUNT_COLORS.length],
    };
    // Real accounts replace the demo ones.
    const next = [...accounts.filter((a) => !a.demo && a.id !== email), account];
    setAccounts(next);
    setExpired((prev) => {
      const s = new Set(prev);
      s.delete(email);
      return s;
    });
    await persist(next);
    return account;
  };

  const startDemo = () => setAccounts(DEMO_ACCOUNTS);

  const removeAccount = async (id: string) => {
    const next = accounts.filter((a) => a.id !== id);
    setAccounts(next);
    if (filter === id) setFilter('all');
    await removeItem(tokenKey(id));
    await persist(next);
  };

  const patch = (m: MailSummary, change: Partial<MailSummary> | null) =>
    setMessages((prev) =>
      change === null
        ? prev.filter((x) => !(x.id === m.id && x.accountId === m.accountId))
        : prev.map((x) => (x.id === m.id && x.accountId === m.accountId ? { ...x, ...change } : x)),
    );

  // Optimistic: update the list first, put it back if Gmail refuses.
  const optimistic = async (m: MailSummary, change: Partial<MailSummary> | null, run: () => Promise<void>) => {
    patch(m, change);
    try {
      await run();
    } catch (e) {
      if (e instanceof AuthExpiredError) markExpired(m.accountId);
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev.map((x) => (x.id === m.id ? m : x)) : [...prev, m].sort((a, b) => b.date - a.date)));
      throw e;
    }
  };

  const visible = useMemo(
    () =>
      messages.filter(
        (m) => (filter === 'all' || m.accountId === filter) && (!view || m.views.includes(view)),
      ),
    [messages, filter, view],
  );

  const unreadByAccount = useMemo(() => {
    const out: Record<string, number> = {};
    for (const m of messages) if (m.unread) out[m.accountId] = (out[m.accountId] ?? 0) + 1;
    return out;
  }, [messages]);

  const viewCounts = useMemo(() => {
    const out: Record<SmartView, number> = { 'needs-reply': 0, bills: 0, travel: 0, newsletters: 0 };
    for (const m of messages) {
      if (filter !== 'all' && m.accountId !== filter) continue;
      for (const v of m.views) out[v]++;
    }
    return out;
  }, [messages, filter]);

  const value: MailState = {
    ready,
    accounts,
    expired,
    messages,
    loading,
    error,
    filter,
    view,
    search,
    visible,
    unreadByAccount,
    viewCounts,
    setFilter,
    setView,
    setSearch,
    refresh,
    addGoogleAccount,
    startDemo,
    removeAccount,
    accountFor: (id) => accounts.find((a) => a.id === id),
    open: async (accountId, id) => {
      const detail = await source(accountId).get(id);
      const summary = messages.find((m) => m.id === id && m.accountId === accountId);
      if (summary?.unread) {
        optimistic(summary, { unread: false }, () => source(accountId).markRead(id, true)).catch(() => {});
      }
      return detail;
    },
    archive: (m) => optimistic(m, null, () => source(m.accountId).archive(m.id)),
    trash: (m) => optimistic(m, null, () => source(m.accountId).trash(m.id)),
    setRead: (m, read) =>
      optimistic(m, { unread: !read }, () => source(m.accountId).markRead(m.id, read)),
    send: async (accountId, mail) => {
      try {
        await source(accountId).send(mail);
      } catch (e) {
        if (e instanceof AuthExpiredError) markExpired(accountId);
        throw e;
      }
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
