import type { Account, MailDetail, MailSummary, OutgoingMail } from '../types';
import type { MailSource } from './api';
import { classify } from './mime';

export const DEMO_ACCOUNTS: Account[] = [
  { id: 'demo-work', email: 'you@company.com', label: 'Work', color: '#2563EB', demo: true },
  { id: 'demo-personal', email: 'you@gmail.com', label: 'Personal', color: '#EA580C', demo: true },
  { id: 'demo-side', email: 'hello@studio.com', label: 'Side project', color: '#7C3AED', demo: true },
];

type Seed = {
  accountId: string;
  from: string;
  fromEmail: string;
  subject: string;
  body: string;
  minutesAgo: number;
  unread?: boolean;
  bulk?: boolean;
  attachments?: string[];
};

const SEEDS: Seed[] = [
  { accountId: 'demo-work', from: 'Maria Ruiz', fromEmail: 'maria@company.com', subject: "Can we move Thursday's review to 3pm?", body: 'Hi! Something came up on my side Thursday at lunch. Would 3pm work instead for the design review? Same room, same agenda. Let me know by end of day so I can update the invite.\n\nThanks,\nMaria', minutesAgo: 35, unread: true },
  { accountId: 'demo-personal', from: 'City Bank', fromEmail: 'no-reply@citybank.example', subject: 'Your statement is ready', body: 'Your monthly statement is ready to view. Payment is due on Friday.', minutesAgo: 67, unread: true, bulk: true },
  { accountId: 'demo-side', from: 'Jordan Tran', fromEmail: 'jordan@studio.com', subject: 'Logo drafts v2', body: 'Attached three directions. I lean toward the second one, but curious what you think.', minutesAgo: 105, attachments: ['logo-a.png', 'logo-b.png', 'logo-c.png'] },
  { accountId: 'demo-personal', from: 'Airline', fromEmail: 'notifications@airline.example', subject: 'Flight check-in opens tomorrow', body: 'Check-in for your flight opens 24 hours before departure. Seat 14C.', minutesAgo: 140, bulk: true },
  { accountId: 'demo-work', from: 'Team Standup', fromEmail: 'standup@company.com', subject: 'Notes from yesterday', body: 'Action items: finish onboarding flow, QA pass on the inbox, ship the settings screen.', minutesAgo: 170 },
  { accountId: 'demo-work', from: 'Sam Lee', fromEmail: 'sam@company.com', subject: 'Quick question about the roadmap', body: 'Do you have five minutes today to go over Q1 priorities?', minutesAgo: 230, unread: true },
  { accountId: 'demo-side', from: 'Design Weekly', fromEmail: 'newsletter@designweekly.example', subject: 'This week: 12 fresh type pairings', body: 'Our favorite type pairings this week, plus a deep dive on variable fonts.', minutesAgo: 300, unread: true, bulk: true },
  { accountId: 'demo-personal', from: 'Mom', fromEmail: 'mom@gmail.com', subject: 'Sunday dinner?', body: 'Are you coming on Sunday? Let me know so I can plan the food.', minutesAgo: 410, unread: true },
  { accountId: 'demo-personal', from: 'Online Shop', fromEmail: 'orders@shop.example', subject: 'Your order receipt #4821', body: 'Thanks for your order! Your package ships tomorrow.', minutesAgo: 600, bulk: true },
];

/** In-memory mailbox for one demo account. Changes last until the app reloads. */
export class DemoSource implements MailSource {
  private mails: MailDetail[];

  constructor(private account: Account) {
    const now = Date.now();
    this.mails = SEEDS.filter((s) => s.accountId === account.id).map((s, i) => {
      const labelIds = ['INBOX', ...(s.unread ? ['UNREAD'] : []), ...(s.bulk ? ['CATEGORY_UPDATES'] : [])];
      return {
        id: `${account.id}-${i}`,
        threadId: `${account.id}-t${i}`,
        accountId: account.id,
        from: s.from,
        fromEmail: s.fromEmail,
        to: account.email,
        subject: s.subject,
        snippet: s.body.split('\n')[0].slice(0, 120),
        date: now - s.minutesAgo * 60_000,
        unread: !!s.unread,
        labelIds,
        views: classify({ labelIds, subject: s.subject, fromEmail: s.fromEmail, listUnsubscribe: !!s.bulk }),
        bodyText: s.body,
        attachments: (s.attachments ?? []).map((filename) => ({ filename, size: 240_000 })),
      };
    });
  }

  async list(query: string): Promise<MailSummary[]> {
    const q = query.replace(/\bin:inbox\b/, '').trim().toLowerCase();
    return this.mails
      .filter((m) => m.labelIds.includes('INBOX'))
      .filter((m) => !q || `${m.from} ${m.subject} ${m.bodyText}`.toLowerCase().includes(q));
  }

  async get(id: string): Promise<MailDetail> {
    const m = this.mails.find((x) => x.id === id);
    if (!m) throw new Error('Message not found');
    return m;
  }

  async archive(id: string) {
    const m = await this.get(id);
    m.labelIds = m.labelIds.filter((l) => l !== 'INBOX');
  }

  async markRead(id: string, read: boolean) {
    const m = await this.get(id);
    m.unread = !read;
    m.labelIds = read ? m.labelIds.filter((l) => l !== 'UNREAD') : [...m.labelIds, 'UNREAD'];
  }

  async trash(id: string) {
    this.mails = this.mails.filter((m) => m.id !== id);
  }

  async send(_mail: OutgoingMail) {
    // Demo mode never sends real mail.
  }
}
