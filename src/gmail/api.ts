import type { MailDetail, MailSummary, OutgoingMail } from '../types';
import { buildRawMessage, extractAttachments, extractBody, toSummary, type GmailMessage } from './mime';

const BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export class AuthExpiredError extends Error {
  constructor(public accountId: string) {
    super('Google sign-in expired');
  }
}

/** What the app needs from a mailbox. Gmail implements it; so does demo mode. */
export interface MailSource {
  list(query: string, max: number): Promise<MailSummary[]>;
  get(id: string): Promise<MailDetail>;
  archive(id: string): Promise<void>;
  markRead(id: string, read: boolean): Promise<void>;
  trash(id: string): Promise<void>;
  send(mail: OutgoingMail): Promise<void>;
}

export class GmailSource implements MailSource {
  constructor(
    private accountId: string,
    private email: string,
    private getToken: () => Promise<string>,
  ) {}

  private async call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
    });
    if (res.status === 401) throw new AuthExpiredError(this.accountId);
    if (!res.ok) throw new Error(`Gmail ${res.status}: ${await res.text()}`);
    return (res.status === 204 ? undefined : await res.json()) as T;
  }

  async list(query: string, max: number): Promise<MailSummary[]> {
    const q = encodeURIComponent(query);
    const page = await this.call<{ messages?: { id: string }[] }>(`/messages?maxResults=${max}&q=${q}`);
    const ids = page.messages?.map((m) => m.id) ?? [];
    const meta = 'format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject' +
      '&metadataHeaders=Message-ID&metadataHeaders=List-Unsubscribe';
    // Gmail allows plenty of parallel requests per user; 10 at a time keeps mobile radios happy.
    const out: MailSummary[] = [];
    for (let i = 0; i < ids.length; i += 10) {
      const batch = await Promise.all(
        ids.slice(i, i + 10).map((id) => this.call<GmailMessage>(`/messages/${id}?${meta}`)),
      );
      out.push(...batch.map((m) => toSummary(m, this.accountId)));
    }
    return out;
  }

  async get(id: string): Promise<MailDetail> {
    const msg = await this.call<GmailMessage>(`/messages/${id}?format=full`);
    return {
      ...toSummary(msg, this.accountId),
      bodyText: extractBody(msg.payload),
      attachments: extractAttachments(msg.payload),
    };
  }

  private modify(id: string, add: string[], remove: string[]) {
    return this.call<void>(`/messages/${id}/modify`, {
      method: 'POST',
      body: JSON.stringify({ addLabelIds: add, removeLabelIds: remove }),
    });
  }

  archive(id: string) {
    return this.modify(id, [], ['INBOX']);
  }

  markRead(id: string, read: boolean) {
    return read ? this.modify(id, [], ['UNREAD']) : this.modify(id, ['UNREAD'], []);
  }

  async trash(id: string) {
    await this.call(`/messages/${id}/trash`, { method: 'POST' });
  }

  async send(mail: OutgoingMail) {
    await this.call('/messages/send', {
      method: 'POST',
      body: JSON.stringify({ raw: buildRawMessage(this.email, mail), threadId: mail.threadId }),
    });
  }
}

export async function fetchProfileEmail(accessToken: string): Promise<string> {
  const res = await fetch(`${BASE}/profile`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Could not read Gmail profile (${res.status})`);
  return ((await res.json()) as { emailAddress: string }).emailAddress;
}
