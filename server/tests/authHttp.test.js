const assert = require('node:assert/strict');
const { test, beforeEach, afterEach } = require('node:test');
const { once } = require('node:events');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/authRepository');
const eventRepository = require('../repositories/eventRepository');
const rsvpRepository = require('../repositories/rsvpRepository');
const CollectionDouble = require('../testSupport/sessionCollection');
const { createApp } = require('../app');
const { IDLE_MS, ABSOLUTE_MS } = require('../services/sessionPolicy');

let server, base, app, collection, now, users, events;
const ORIGIN = 'http://localhost:5173';
const DAY = IDLE_MS / 7;
let passwordHash;
beforeEach(async () => {
  passwordHash ||= await bcrypt.hash('password8', 4);
  now = Date.now(); users = new Map(); events = new Map(); collection = new CollectionDouble();
  authRepository.findByEmail = async email => [...users.values()].find(user => user.email === email);
  authRepository.findEmailWithPassword = authRepository.findByEmail;
  authRepository.findById = async id => users.get(id);
  authRepository.createUser = async data => {
    const user = { ...data, _id: String(users.size + 1), status: 'active', role: 'customer' };
    users.set(user._id, user); return user;
  };
  eventRepository.createEvent = async data => { const event = { ...data, _id: '507f1f77bcf86cd799439011', status: 'draft' }; events.set(event._id, event); return event; };
  rsvpRepository.getRSVPsByEvent = async () => [];
  eventRepository.findOwnedEventById = async (id, owner) => events.get(id)?.owner === owner ? events.get(id) : null;
  eventRepository.updateOwnedEvent = async (id, owner, data) => {
    const event = await eventRepository.findOwnedEventById(id, owner);
    return event ? Object.assign(event, data) : null;
  };
  eventRepository.publishOwnedEvent = async (id, owner, slug) => {
    const event = await eventRepository.findOwnedEventById(id, owner);
    return event ? Object.assign(event, { status: 'published', slug }) : null;
  };
  app = createApp({ client: { db: () => ({ collection: () => collection }) }, dbName: 'test',
    secret: 'http-test-only-secret-at-least-32-bytes', origins: [ORIGIN], production: false, clock: () => now });
  server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});
afterEach(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });

// Actual HTTP requests, explicit cookie jar; intentionally not a browser cookie engine.
function customer() {
  const jar = new Map();
  return {
    csrf: undefined, jar,
    async request(path, method = 'GET', body, headers = {}) {
      const response = await fetch(`${base}${path}`, { method, headers: {
        Origin: ORIGIN, Cookie: [...jar].map(([key, value]) => `${key}=${value}`).join('; '),
        ...(method !== 'GET' ? { 'Content-Type': 'application/json', 'X-CSRF-Token': this.csrf || '' } : {}), ...headers,
      }, body: method === 'GET' || method === 'OPTIONS' ? undefined : JSON.stringify(body || {}) });
      for (const value of response.headers.getSetCookie()) {
        const pair = value.split(';')[0]; const index = pair.indexOf('=');
        jar.set(pair.slice(0, index), pair.slice(index + 1));
      }
      const data = method === 'OPTIONS' ? null : await response.json();
      if (data?.csrfToken) this.csrf = data.csrfToken;
      return { status: response.status, data, headers: response.headers };
    },
    async bootstrap() { return this.request('/api/auth/csrf'); },
    async register(email = 'a@example.com') {
      await this.bootstrap();
      return this.request('/api/auth/register', 'POST', { name: 'Customer', email, password: 'password8' });
    },
  };
}

test('HTTP registration sets persistent HttpOnly cookie; me restores safe state without renewal', async () => {
  const c = customer(); const result = await c.register();
  assert.equal(result.status, 201); assert.equal(result.data.token, undefined);
  assert.equal(result.data.user.passwordHash, undefined);
  const cookie = result.headers.getSetCookie().find(value => value.startsWith('vento.sid.dev='));
  assert.match(cookie, /HttpOnly/); assert.match(cookie, /Expires=/); assert.match(cookie, /SameSite=Lax/);
  const expiry = [...collection.docs.values()].find(doc => doc.session)?.expires;
  now += DAY;
  assert.equal((await c.request('/api/auth/me')).status, 200);
  assert.deepEqual([...collection.docs.values()].find(doc => doc.session)?.expires, expiry);
  assert.equal((await customer().request('/api/auth/me')).status, 401);
});

test('HTTP login accepts correct credentials, rejects wrong credentials and inactive users', async () => {
  users.set('1', { _id: '1', name: 'Customer', email: 'a@example.com', passwordHash, status: 'active' });
  const c = customer(); await c.bootstrap();
  assert.equal((await c.request('/api/auth/login', 'POST', { email: 'a@example.com', password: 'incorrect' })).status, 401);
  assert.equal((await c.request('/api/auth/login', 'POST', { email: 'a@example.com', password: 'password8' })).status, 200);
  users.get('1').status = 'disabled';
  assert.equal((await c.request('/api/auth/me')).status, 403);
  const d = customer(); await d.bootstrap();
  assert.equal((await d.request('/api/auth/login', 'POST', { email: 'a@example.com', password: 'password8' })).status, 403);
});

test('HTTP registration rejects invalid/duplicate input and CSRF-free login or registration', async () => {
  const c = customer();
  assert.equal((await c.request('/api/auth/register', 'POST')).status, 403);
  assert.equal((await c.request('/api/auth/login', 'POST')).status, 403);
  await c.bootstrap();
  assert.equal((await c.request('/api/auth/register', 'POST', { name: ' ', password: 'short' })).status, 400);
  assert.equal((await c.register()).status, 201);
  const d = customer(); assert.equal((await d.register()).status, 400);
});

test('HTTP logout rejects bad CSRF, revokes on success, and rejects captured cookie replay', async () => {
  const c = customer(); await c.register(); const captured = c.jar.get('vento.sid.dev');
  assert.equal((await c.request('/api/auth/logout', 'POST', {}, { 'X-CSRF-Token': 'wrong' })).status, 403);
  assert.equal((await c.request('/api/auth/logout', 'POST')).status, 200);
  c.jar.set('vento.sid.dev', captured);
  assert.equal((await c.request('/api/auth/me')).status, 401);
  assert.equal((await c.request('/api/auth/activity', 'POST')).status, 401);
});

test('HTTP activity enforces CSRF, renews cookie with fixed absolute cap and rejects expiry', async () => {
  const c = customer(); await c.register(); const start = now;
  assert.equal((await c.request('/api/auth/activity', 'POST', {}, { 'X-CSRF-Token': '' })).status, 403);
  for (const day of [6, 12, 18, 24, 29]) {
    now = start + day * DAY;
    const result = await c.request('/api/auth/activity', 'POST');
    assert.equal(result.status, 200);
    assert.ok(result.headers.getSetCookie().some(value => value.startsWith('vento.sid.dev=')));
  }
  const doc = [...collection.docs.values()].find(item => item.session);
  assert.equal(doc.expires.getTime(), start + ABSOLUTE_MS);
  now = start + ABSOLUTE_MS;
  assert.equal((await c.request('/api/auth/me')).status, 401);
  assert.equal((await c.request('/api/auth/activity', 'POST')).status, 401);
});

test('HTTP seven inactive days rejects the session even while its record remains', async () => {
  const c = customer(); await c.register(); now += IDLE_MS;
  assert.equal((await c.request('/api/auth/me')).status, 401);
});

test('HTTP CORS allows configured credentialed origin and rejects other/missing mutation origins', async () => {
  const c = customer();
  const result = await c.bootstrap();
  assert.equal(result.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal(result.headers.get('access-control-allow-credentials'), 'true');
  assert.equal((await c.request('/api/auth/csrf', 'GET', undefined, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await c.request('/api/auth/login', 'POST', {}, { Origin: '' })).status, 403);
  const preflight = await c.request('/api/auth/login', 'OPTIONS', undefined, { 'Access-Control-Request-Method': 'POST' });
  assert.equal(preflight.status, 204);
});

test('HTTP owner isolation, mutation CSRF, server-owned identity and legacy JWT rejection', async () => {
  const a = customer(); await a.register(); const b = customer(); await b.register('b@example.com');
  assert.equal((await a.request('/api/events', 'POST', {}, { 'X-CSRF-Token': 'bad' })).status, 403);
  const created = await a.request('/api/events', 'POST', { title: 'Test', owner: '2', status: 'published' });
  assert.equal(created.status, 201); assert.equal(created.data.data.owner, '1');
  assert.equal((await a.request('/api/events/507f1f77bcf86cd799439011')).status, 200);
  assert.equal((await a.request('/api/events/507f1f77bcf86cd799439011', 'PUT', { title: 'Updated', owner: '2' })).status, 200);
  assert.equal(events.get('507f1f77bcf86cd799439011').owner, '1');
  assert.equal((await a.request('/api/events/507f1f77bcf86cd799439011/publish', 'PUT')).status, 200);
  assert.equal((await a.request('/api/events/507f1f77bcf86cd799439011/rsvps')).status, 200);
  assert.equal((await b.request('/api/events/507f1f77bcf86cd799439011')).status, 404);
  assert.equal((await b.request('/api/events/507f1f77bcf86cd799439011', 'PUT', { title: 'Stolen' })).status, 404);
  assert.equal((await b.request('/api/events/507f1f77bcf86cd799439011/publish', 'PUT')).status, 404);
  assert.equal((await b.request('/api/events/507f1f77bcf86cd799439011/rsvps')).status, 404);
  const token = jwt.sign({ sub: '1' }, 'legacy-test-only-secret');
  assert.equal((await customer().request('/api/events/507f1f77bcf86cd799439011', 'GET', undefined, { Authorization: `Bearer ${token}` })).status, 401);
});

test('HTTP store/account errors fail closed without leaking raw errors', async () => {
  const c = customer(); await c.register();
  authRepository.findById = async () => { throw new Error('private database details'); };
  const failed = await c.request('/api/auth/me');
  assert.equal(failed.status, 503); assert.equal(JSON.stringify(failed.data).includes('private'), false);
  collection.findOne = async () => { throw new Error('private store failure'); };
  assert.equal((await c.request('/api/auth/me')).status, 503);
});

test('HTTP session cookie tampering and expired/forged bootstrap CSRF are rejected', async () => {
  const c = customer(); await c.bootstrap();
  const bootstrapToken = c.csrf;
  now += 15 * 60 * 1000;
  assert.equal((await c.request('/api/auth/login', 'POST')).status, 403);
  c.csrf = `${bootstrapToken}invalid`;
  assert.equal((await c.request('/api/auth/login', 'POST')).status, 403);
  now = Date.now(); await c.register();
  c.jar.set('vento.sid.dev', 'tampered');
  assert.equal((await c.request('/api/auth/me')).status, 401);
});

test('HTTP login rotates sessions, rejects old cookies and old CSRF, and deleted users lose access', async () => {
  const c = customer(); await c.register();
  const oldCookie = c.jar.get('vento.sid.dev'); const oldCsrf = c.csrf;
  assert.equal((await c.request('/api/auth/login', 'POST', { email: 'a@example.com', password: 'password8' })).status, 200);
  const fresh = c.jar.get('vento.sid.dev'); assert.notEqual(fresh, oldCookie);
  assert.notEqual(c.csrf, oldCsrf);
  assert.equal((await c.request('/api/auth/activity', 'POST', {}, { 'X-CSRF-Token': oldCsrf })).status, 403);
  c.jar.set('vento.sid.dev', oldCookie);
  assert.equal((await c.request('/api/auth/me')).status, 401);
  c.jar.set('vento.sid.dev', fresh); users.delete('1');
  assert.equal((await c.request('/api/auth/me')).status, 403);
  c.jar.set('vento.sid.dev', fresh);
  assert.equal((await c.request('/api/auth/me')).status, 401);
});

test('HTTP logout store failure returns service error and registration insert failure never authenticates', async () => {
  const c = customer(); await c.register();
  const update = collection.updateOne.bind(collection);
  collection.updateOne = async () => { throw new Error('private logout database failure'); };
  const result = await c.request('/api/auth/logout', 'POST');
  assert.equal(result.status, 503); assert.equal(result.data.message, 'Service unavailable');
  collection.updateOne = update;
  collection.insertOne = async () => { throw new Error('private insert failure'); };
  const d = customer(); const registration = await d.register('new@example.com');
  assert.equal(registration.status, 500);
  assert.equal(JSON.stringify(registration.data).includes('private'), false);
  assert.equal((await d.request('/api/auth/me')).status, 401);
});

test('HTTP production headers contain Secure host cookies behind an explicitly trusted TLS proxy', async () => {
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  const origin = 'https://vento.example';
  app = createApp({ client: { db: () => ({ collection: () => collection }) },
    dbName: 'test', secret: 'http-test-only-secret-at-least-32-bytes', origins: [origin],
    production: true, clock: () => now, trustProxy: 'loopback' });
  server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
  const c = customer(); const headers = { Origin: origin, 'X-Forwarded-Proto': 'https' };
  const bootstrap = await c.request('/api/auth/csrf', 'GET', undefined, headers);
  assert.match(bootstrap.headers.get('set-cookie'), /__Host-vento.csrf=.*Secure.*SameSite=Lax/);
  const registration = await c.request('/api/auth/register', 'POST', { name: 'Customer', email: 'secure@example.com', password: 'password8' }, headers);
  assert.equal(registration.status, 201);
  const cookie = registration.headers.getSetCookie().find(value => value.startsWith('__Host-vento.sid='));
  assert.match(cookie, /Path=\/.*Expires=.*HttpOnly.*Secure.*SameSite=Lax/);
  assert.equal(cookie.includes('Domain='), false);
  assert.equal((await c.request('/api/auth/me', 'GET', undefined, headers)).status, 200);
});

test('HTTP parsing errors are bounded and do not leak request body or crash the server', async () => {
  const response = await fetch(`${base}/api/auth/login`, { method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' }, body: '{"synthetic-secret":' });
  assert.equal(response.status, 400);
  assert.equal(JSON.stringify(await response.json()).includes('synthetic-secret'), false);
  const oversized = await customer().request('/api/auth/login', 'POST', { value: 'x'.repeat(40 * 1024) });
  assert.equal(oversized.status, 413);
  assert.equal((await customer().request('/api/health')).status, 200);
});
