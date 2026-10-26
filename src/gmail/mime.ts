// Pure helpers for Gmail's message format. No React Native imports, so the
// node test runner can load this file directly.
import type { MailSummary, OutgoingMail, SmartView } from '../types.ts';

export type GmailHeader = { name: string; value: string };
export type GmailPart = {
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: { data?: string; size?: number; attachmentId?: string };
  parts?: GmailPart[];
};
export type GmailMessage = {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: GmailPart;
};

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function utf8Encode(text: string): number[] {
  const out: number[] = [];
  for (const ch of text) {
    let c = ch.codePointAt(0)!;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}

export function utf8Decode(bytes: number[]): string {
  let out = '';
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i++];
    let c: number;
    if (b < 0x80) c = b;
    else if (b < 0xe0) c = ((b & 31) << 6) | (bytes[i++] & 63);
    else if (b < 0xf0) c = ((b & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
    else c = ((b & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
    out += String.fromCodePoint(c);
  }
  return out;
}

export function base64UrlEncode(text: string): string {
  const bytes = utf8Encode(text);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63] : '';
    out += i + 2 < bytes.length ? B64[n & 63] : '';
  }
  return out.replace(/\+/g, '-').replace(/\//g, '_');
}

export function base64UrlDecode(data: string): string {
  const clean = data.replace(/-/g, '+').replace(/_/g, '/').replace(/[^A-Za-z0-9+/]/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const chunk = clean.slice(i, i + 4);
    const n = [...chunk].reduce((acc, ch, j) => acc | (B64.indexOf(ch) << (18 - 6 * j)), 0);
    bytes.push((n >> 16) & 255);
    if (chunk.length > 2) bytes.push((n >> 8) & 255);
    if (chunk.length > 3) bytes.push(n & 255);
  }
  return utf8Decode(bytes);
}

export function header(part: GmailPart | undefined, name: string): string {
  const lower = name.toLowerCase();
  return part?.headers?.find((h) => h.name.toLowerCase() === lower)?.value ?? '';
}

/** Splits `"Maria Ruiz" <maria@x.com>` into a display name and an address. */
export function parseAddress(value: string): { name: string; email: string } {
  const match = value.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>/);
  if (match) return { name: match[1].trim() || match[2], email: match[2].trim() };
  return { name: value.trim(), email: value.trim() };
}

function stripHtml(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Returns the readable text of a message, preferring text/plain over HTML. */
export function extractBody(part: GmailPart | undefined): string {
  if (!part) return '';
  const find = (p: GmailPart, type: string): string | undefined => {
    if (p.mimeType === type && p.body?.data) return base64UrlDecode(p.body.data);
    for (const child of p.parts ?? []) {
      const hit = find(child, type);
      if (hit !== undefined) return hit;
    }
    return undefined;
  };
  const plain = find(part, 'text/plain');
  if (plain !== undefined) return plain.trim();
  const html = find(part, 'text/html');
  return html !== undefined ? stripHtml(html) : '';
}

export function extractAttachments(part: GmailPart | undefined): { filename: string; size: number }[] {
  const out: { filename: string; size: number }[] = [];
  const walk = (p: GmailPart) => {
    if (p.filename && p.body?.attachmentId) out.push({ filename: p.filename, size: p.body.size ?? 0 });
    p.parts?.forEach(walk);
  };
  if (part) walk(part);
  return out;
}

const BILLS = /\b(invoice|receipt|statement|payment|order|bill|subscription|renewal)\b/i;
const TRAVEL = /\b(flight|boarding|check-in|itinerary|booking|reservation|hotel|trip)\b/i;

/** Rule-based smart views. Runs locally on headers, so no mail leaves the device. */
export function classify(msg: {
  labelIds: string[];
  subject: string;
  fromEmail: string;
  listUnsubscribe: boolean;
}): SmartView[] {
  const views: SmartView[] = [];
  const labels = new Set(msg.labelIds);
  const bulk =
    msg.listUnsubscribe ||
    labels.has('CATEGORY_PROMOTIONS') ||
    labels.has('CATEGORY_SOCIAL') ||
    /no-?reply|newsletter|notifications?@/i.test(msg.fromEmail);
  if (bulk && !BILLS.test(msg.subject)) views.push('newsletters');
  if (BILLS.test(msg.subject)) views.push('bills');
  if (TRAVEL.test(msg.subject)) views.push('travel');
  // Personal mail still sitting in the inbox. Archiving it marks it done.
  if (!bulk && labels.has('INBOX') && !labels.has('CATEGORY_UPDATES') && !labels.has('CATEGORY_FORUMS')) {
    views.push('needs-reply');
  }
  return views;
}

export function toSummary(msg: GmailMessage, accountId: string): MailSummary {
  const from = parseAddress(header(msg.payload, 'From'));
  const labelIds = msg.labelIds ?? [];
  const subject = header(msg.payload, 'Subject') || '(no subject)';
  return {
    id: msg.id,
    threadId: msg.threadId,
    accountId,
    from: from.name,
    fromEmail: from.email,
    to: header(msg.payload, 'To'),
    subject,
    snippet: msg.snippet ?? '',
    date: Number(msg.internalDate ?? 0),
    unread: labelIds.includes('UNREAD'),
    labelIds,
    messageIdHeader: header(msg.payload, 'Message-ID') || undefined,
    views: classify({
      labelIds,
      subject,
      fromEmail: from.email,
      listUnsubscribe: header(msg.payload, 'List-Unsubscribe') !== '',
    }),
  };
}

function encodeHeader(value: string): string {
  // RFC 2047 encoded-word for any non-ASCII subject.
  if (/^[\x20-\x7e]*$/.test(value)) return value;
  const b64 = base64UrlEncode(value).replace(/-/g, '+').replace(/_/g, '/');
  return `=?UTF-8?B?${b64.padEnd(Math.ceil(b64.length / 4) * 4, '=')}?=`;
}

/** Builds the base64url RFC 2822 message that Gmail's send endpoint expects. */
export function buildRawMessage(from: string, mail: OutgoingMail): string {
  const lines = [
    `From: ${from}`,
    `To: ${mail.to}`,
    `Subject: ${encodeHeader(mail.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
  ];
  if (mail.inReplyTo) lines.push(`In-Reply-To: ${mail.inReplyTo}`, `References: ${mail.inReplyTo}`);
  return base64UrlEncode(`${lines.join('\r\n')}\r\n\r\n${mail.body}`);
}

export function replySubject(subject: string): string {
  return /^re:/i.test(subject) ? subject : `Re: ${subject}`;
}
