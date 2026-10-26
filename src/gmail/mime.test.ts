/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  base64UrlDecode,
  base64UrlEncode,
  buildRawMessage,
  classify,
  extractBody,
  parseAddress,
  replySubject,
  toSummary,
} from './mime.ts';

test('base64url round-trips unicode', () => {
  for (const s of ['', 'a', 'ab', 'abc', 'Hola, ¿qué tal? 👋', 'línea\r\nnueva']) {
    assert.equal(base64UrlDecode(base64UrlEncode(s)), s);
  }
  assert.equal(base64UrlEncode('hi?>'), 'aGk_Pg');
});

test('decodes standard Gmail payload data', () => {
  // "Hello world" as Gmail would send it.
  assert.equal(base64UrlDecode('SGVsbG8gd29ybGQ='), 'Hello world');
});

test('parseAddress handles quoted names and bare addresses', () => {
  assert.deepEqual(parseAddress('"Maria Ruiz" <maria@example.com>'), { name: 'Maria Ruiz', email: 'maria@example.com' });
  assert.deepEqual(parseAddress('Bank <no-reply@bank.com>'), { name: 'Bank', email: 'no-reply@bank.com' });
  assert.deepEqual(parseAddress('solo@example.com'), { name: 'solo@example.com', email: 'solo@example.com' });
});

test('extractBody prefers text/plain and falls back to stripped HTML', () => {
  const html = base64UrlEncode('<p>Hi&nbsp;there</p><style>x{}</style><br>Bye');
  assert.equal(extractBody({ mimeType: 'text/html', body: { data: html } }), 'Hi there\n\nBye');
  const multipart = {
    mimeType: 'multipart/alternative',
    parts: [
      { mimeType: 'text/html', body: { data: html } },
      { mimeType: 'text/plain', body: { data: base64UrlEncode('Plain version') } },
    ],
  };
  assert.equal(extractBody(multipart), 'Plain version');
});

test('classify sorts mail into smart views', () => {
  const base = { labelIds: ['INBOX', 'UNREAD'], fromEmail: 'maria@example.com', listUnsubscribe: false };
  assert.deepEqual(classify({ ...base, subject: 'Lunch tomorrow?' }), ['needs-reply']);
  assert.deepEqual(classify({ ...base, subject: 'Weekly digest', listUnsubscribe: true }), ['newsletters']);
  assert.deepEqual(classify({ ...base, subject: 'Your receipt', fromEmail: 'no-reply@shop.com' }), ['bills']);
  assert.ok(classify({ ...base, subject: 'Flight check-in is open' }).includes('travel'));
  assert.deepEqual(classify({ ...base, labelIds: ['INBOX'], subject: 'Read already' }), ['needs-reply']);
  assert.deepEqual(classify({ ...base, labelIds: ['UNREAD'], subject: 'Archived' }), []);
  assert.deepEqual(classify({ ...base, labelIds: ['INBOX', 'CATEGORY_UPDATES'], subject: 'Build passed' }), []);
});

test('toSummary maps a Gmail message', () => {
  const s = toSummary(
    {
      id: 'm1',
      threadId: 't1',
      labelIds: ['INBOX', 'UNREAD'],
      snippet: 'snip',
      internalDate: '1700000000000',
      payload: {
        headers: [
          { name: 'From', value: '"Maria" <maria@example.com>' },
          { name: 'Subject', value: 'Hello' },
          { name: 'Message-ID', value: '<abc@mail>' },
        ],
      },
    },
    'acct',
  );
  assert.equal(s.from, 'Maria');
  assert.equal(s.unread, true);
  assert.equal(s.date, 1700000000000);
  assert.equal(s.messageIdHeader, '<abc@mail>');
  assert.deepEqual(s.views, ['needs-reply']);
});

test('buildRawMessage threads replies and encodes non-ASCII subjects', () => {
  const raw = base64UrlDecode(
    buildRawMessage('me@example.com', { to: 'a@b.com', subject: 'Re: Café', body: 'Sí', inReplyTo: '<abc@mail>' }),
  );
  assert.match(raw, /^From: me@example.com\r\nTo: a@b.com\r\nSubject: =\?UTF-8\?B\?/);
  assert.match(raw, /In-Reply-To: <abc@mail>\r\nReferences: <abc@mail>/);
  assert.ok(raw.endsWith('\r\n\r\nSí'));
  assert.equal(replySubject('Hello'), 'Re: Hello');
  assert.equal(replySubject('RE: Hello'), 'RE: Hello');
});
