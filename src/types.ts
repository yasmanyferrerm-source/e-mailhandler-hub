export type Account = {
  id: string;
  email: string;
  label: string;
  color: string;
  /** Demo accounts serve sample mail and never touch the network. */
  demo?: boolean;
};

export type Tokens = {
  accessToken: string;
  refreshToken?: string;
  /** Epoch milliseconds. */
  expiresAt: number;
};

export type SmartView = 'needs-reply' | 'bills' | 'travel' | 'newsletters';

export type MailSummary = {
  id: string;
  threadId: string;
  accountId: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  snippet: string;
  date: number;
  unread: boolean;
  labelIds: string[];
  messageIdHeader?: string;
  views: SmartView[];
};

export type MailDetail = MailSummary & {
  bodyText: string;
  /** The HTML part, when the email has one. */
  bodyHtml?: string;
  attachments: { filename: string; size: number }[];
};

export type OutgoingMail = {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  threadId?: string;
};
