const assert = require('node:assert/strict');
const { test, beforeEach, afterEach } = require('node:test');
const { once } = require('node:events');
const bcrypt = require('bcryptjs');
const service = require('../services/rsvpService');
const eventRepository = require('../repositories/eventRepository');
const rsvpRepository = require('../repositories/rsvpRepository');
const authRepository = require('../repositories/authRepository');
const Event = require('../models/Event');
const realPublishedLookup = eventRepository.findPublishedEventById;
const CollectionDouble = require('../testSupport/sessionCollection');
const { createApp } = require('../app');

const ID = '507f1f77bcf86cd799439011';
const OTHER = '507f1f77bcf86cd799439012';
const ORIGIN = 'http://localhost:5173';
const valid = () => ({ guestName: '  أحمد Smith  ', status: 'attending', guestCount: 1 });
let events, records, inserts, lookups, server, base;
beforeEach(() => {
  events = new Map([[ID, { _id: ID, owner: 'owner-a', status: 'published' }]]);
  records = [{ _id: 'existing-record', event: ID, guestName: 'Existing', status: 'attending', guestCount: 1 }];
  inserts = []; lookups = [];
  eventRepository.findPublishedEventById = async id => {
    lookups.push(id); const event = events.get(id); return event?.status === 'published' ? event : null;
  };
  eventRepository.findOwnedEventById = async (id, owner) => events.get(id)?.owner === owner ? events.get(id) : null;
  rsvpRepository.createRSVP = async fields => { inserts.push(fields); const record = { ...fields, _id: 'new-record' }; records.push(record); return record; };
  rsvpRepository.getRSVPsByEvent = async id => records.filter(record => record.event === id);
});
afterEach(async () => {
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); server = null; }
});

test('RSVP service canonicalizes route ID and whitelists fields without editing existing records', async () => {
  const before = structuredClone(records[0]);
  const result = await service.createRSVP(ID.toUpperCase(), { ...valid(), message: '  Welcome  ',
    event: OTHER, owner: 'attacker', _id: 'forged', createdAt: 'forged', extra: { event: OTHER } });
  assert.deepEqual(inserts, [{ guestName: 'أحمد Smith', status: 'attending', guestCount: 1, message: 'Welcome', event: ID }]);
  assert.equal(result.event, ID); assert.deepEqual(records[0], before);
});

test('malformed RSVP IDs reject before any repository operation', async () => {
  for (const id of [undefined, null, 123, {}, '', 'bad', 'abcdefghijklmnopqrstuvwx', `${ID} `, `${ID}0`]) {
    await assert.rejects(service.createRSVP(id, valid()), error => error.statusCode === 400);
  }
  assert.equal(lookups.length, 0); assert.equal(inserts.length, 0);
});

test('guest fields reject coercion, missing values, arrays and unsupported statuses', async () => {
  const invalid = [undefined, null, [], 'string', {},
    ...[null, 3, {}, [], '   ', '!!!', '😀', 'Name\nInjected'].map(guestName => ({ ...valid(), guestName })),
    ...[undefined, null, true, {}, 'maybe', 'Attending'].map(status => ({ ...valid(), status })),
    ...['1', true, null, undefined, {}, [], NaN, Infinity, 1.5, -1, 0, Number.MAX_SAFE_INTEGER + 1]
      .map(guestCount => ({ ...valid(), guestCount })),
    ...[null, 2, {}, []].map(message => ({ ...valid(), message })),
  ];
  for (const data of invalid) await assert.rejects(service.createRSVP(ID, data), error => error.statusCode === 400);
  assert.equal(inserts.length, 0); assert.equal(lookups.length, 0);
});

test('declining means exactly zero; positive safe-integer attendance has no capacity limit', async () => {
  await service.createRSVP(ID, { ...valid(), status: 'not-attending', guestCount: 0 });
  await service.createRSVP(ID, { ...valid(), guestCount: Number.MAX_SAFE_INTEGER });
  for (const guestCount of [-1, 1, 1.5, '0', null, false]) {
    await assert.rejects(service.createRSVP(ID, { ...valid(), status: 'not-attending', guestCount }), error => error.statusCode === 400);
  }
  assert.equal(inserts.length, 2);
});

test('trimmed name/message length boundaries and optional message are explicit', async () => {
  await service.createRSVP(ID, { ...valid(), guestName: 'a'.repeat(200), message: 'm'.repeat(2000) });
  await service.createRSVP(ID, { ...valid(), message: '' });
  await service.createRSVP(ID, valid());
  for (const data of [{ ...valid(), guestName: 'a'.repeat(201) }, { ...valid(), message: 'm'.repeat(2001) },
    { ...valid(), message: 'NUL\u0000' }]) {
    await assert.rejects(service.createRSVP(ID, data), error => error.statusCode === 400);
  }
  assert.equal(inserts.length, 3);
});

test('missing and nonpublished events never receive RSVPs', async () => {
  for (const status of ['draft', 'unpublished', 'deleted']) {
    events.get(ID).status = status;
    await assert.rejects(service.createRSVP(ID, valid()), error => error.statusCode === 404);
  }
  events.delete(ID);
  await assert.rejects(service.createRSVP(ID, valid()), error => error.statusCode === 404);
  assert.equal(inserts.length, 0);
});

test('real event repository queries both authoritative ID and published status', async () => {
  const original = Event.findOne;
  try {
    Event.findOne = filter => { assert.deepEqual(filter, { _id: ID, status: 'published' }); return null; };
    assert.equal(await realPublishedLookup(ID), null);
  } finally { Event.findOne = original; }
});

async function startHttp() {
  const passwordHash = await bcrypt.hash('password8', 4);
  authRepository.findEmailWithPassword = async email => ({ _id: email === 'a@example.com' ? 'owner-a' : 'owner-b',
    email, name: 'Owner', passwordHash, status: 'active', role: 'customer' });
  authRepository.findById = async id => ({ _id: id, name: 'Owner', email: 'synthetic@example.com', status: 'active' });
  const collection = new CollectionDouble();
  const app = createApp({ client: { db: () => ({ collection: () => collection }) }, dbName: 'isolated',
    secret: 'rsvp-http-test-only-secret-at-least-32-bytes', origins: [ORIGIN], production: false });
  server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
  return collection;
}

function client() {
  const jar = new Map();
  return {
    csrf: '',
    async request(path, method = 'GET', body, headers = {}) {
      const response = await fetch(`${base}${path}`, { method, headers: { Origin: ORIGIN,
        Cookie: [...jar].map(([key, value]) => `${key}=${value}`).join('; '),
        'Content-Type': 'application/json', 'X-CSRF-Token': this.csrf, ...headers },
        body: method === 'GET' ? undefined : JSON.stringify(body) });
      for (const value of response.headers.getSetCookie()) {
        const pair = value.split(';')[0]; const at = pair.indexOf('='); jar.set(pair.slice(0, at), pair.slice(at + 1));
      }
      const data = await response.json(); if (data.csrfToken) this.csrf = data.csrfToken;
      return { status: response.status, data };
    },
    async login(email) {
      await this.request('/api/auth/csrf');
      const result = await this.request('/api/auth/login', 'POST', { email, password: 'password8' });
      assert.equal(result.status, 200);
    },
  };
}

test('HTTP public submissions need no account or CSRF and ignore forged event relationships', async () => {
  const collection = await startHttp(); const guest = client();
  const result = await guest.request(`/api/events/${ID}/rsvps`, 'POST', { ...valid(), event: OTHER, owner: 'attacker' });
  assert.equal(result.status, 201); assert.equal(result.data.data.event, ID);
  assert.equal(result.data.data.owner, undefined); assert.equal(collection.writes, 0);
  assert.equal((await guest.request(`/api/events/${ID}/rsvps`, 'POST', { ...valid(), status: 'not-attending', guestCount: 0 })).status, 201);
});

test('HTTP malformed IDs, invalid input and missing/unpublished events have predictable errors', async () => {
  await startHttp(); const guest = client();
  assert.equal((await guest.request('/api/events/not-an-id/rsvps', 'POST', valid())).status, 400);
  assert.equal((await guest.request(`/api/events/${ID}/rsvps`, 'POST', { ...valid(), guestCount: '1' })).status, 400);
  assert.equal((await guest.request(`/api/events/${OTHER}/rsvps`, 'POST', valid())).status, 404);
  events.get(ID).status = 'draft';
  assert.equal((await guest.request(`/api/events/${ID}/rsvps`, 'POST', valid())).status, 404);
  assert.equal(inserts.length, 0);
});

test('HTTP RSVP listing remains authenticated and owner-only, with ID validation', async () => {
  await startHttp();
  assert.equal((await client().request(`/api/events/${ID}/rsvps`)).status, 401);
  const a = client(); await a.login('a@example.com');
  const b = client(); await b.login('b@example.com');
  const result = await a.request(`/api/events/${ID}/rsvps`);
  assert.equal(result.status, 200); assert.equal(result.data.data.length, 1);
  assert.equal((await b.request(`/api/events/${ID}/rsvps`)).status, 404);
  assert.equal((await a.request('/api/events/bad/rsvps')).status, 400);
});

test('HTTP database errors are sanitized for lookup, insert and private listing', async () => {
  await startHttp(); const guest = client();
  const lookup = eventRepository.findPublishedEventById;
  eventRepository.findPublishedEventById = async () => { throw new Error('private lookup details'); };
  let result = await guest.request(`/api/events/${ID}/rsvps`, 'POST', valid());
  assert.equal(result.status, 503); assert.equal(result.data.message, 'Unable to submit RSVP');
  eventRepository.findPublishedEventById = lookup;
  rsvpRepository.createRSVP = async () => { const error = new Error('private insert details'); error.statusCode = 400; throw error; };
  result = await guest.request(`/api/events/${ID}/rsvps`, 'POST', valid());
  assert.equal(result.status, 503); assert.equal(result.data.message.includes('private'), false);
  const a = client(); await a.login('a@example.com');
  rsvpRepository.getRSVPsByEvent = async () => { throw new Error('private list details'); };
  result = await a.request(`/api/events/${ID}/rsvps`);
  assert.equal(result.status, 503); assert.equal(result.data.message, 'Unable to list RSVP responses');
  eventRepository.findOwnedEventById = async () => { throw new Error('private owner query details'); };
  result = await a.request(`/api/events/${ID}/rsvps`);
  assert.equal(result.status, 503); assert.equal(result.data.message.includes('private'), false);
  assert.equal(records.length, 1);
});
