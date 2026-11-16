const assert = require('node:assert/strict');
const { test } = require('node:test');
const { randomBytes } = require('node:crypto');
const expressSession = require('express-session');
const SessionRepository = require('../repositories/sessionRepository');
const VentoSessionStore = require('../config/sessionStore');
const { createSessionFoundation } = require('../config/session');
const {
  IDLE_MS, ABSOLUTE_MS, RENEWAL_INTERVAL_MS, storageId, isLive,
} = require('../services/sessionPolicy');

const DAY = IDLE_MS / 7;
const START = Date.UTC(2026, 0, 1);
const clone = value => structuredClone(value);

// Small Mongo collection double, not a MongoDB emulator. Tests also assert the
// exact conditional filters/pipeline sent to the driver. Real DB verification
// (including native query atomicity) remains a separate milestone.
const CollectionDouble = require('../testSupport/sessionCollection');

function fixture() {
  let now = START;
  const collection = new CollectionDouble();
  const clock = () => now;
  const repo = new SessionRepository(collection, clock);
  const sid = randomBytes(32).toString('base64url');
  const client = { db: () => ({ collection: () => collection }) };
  const store = new VentoSessionStore({ client, dbName: 'isolated_test', clock });
  return { repo, store, sid, collection, client, clock, setTime(value) { now = value; } };
}

const invoke = (store, method, ...args) => new Promise((resolve, reject) => {
  store[method](...args, (error, result) => error ? reject(error) : resolve(result));
});
const sessionData = () => ({ cookie: { httpOnly: true, secure: true, sameSite: 'lax', path: '/' } });

test('rejects exactly seven inactive days, before TTL cleanup', async () => {
  const f = fixture(); await f.repo.createAuthenticated(f.sid, 'owner-a', sessionData());
  f.setTime(START + IDLE_MS - 1); assert.ok(await f.repo.findLive(f.sid));
  f.setTime(START + IDLE_MS); assert.equal(await f.repo.findLive(f.sid), null);
  assert.equal(f.collection.docs.size, 1);
  await assert.rejects(f.repo.renewActivity(f.sid), /unavailable/);
  await assert.rejects(f.repo.saveExisting(f.sid, sessionData()), /unavailable/);
});

test('day-29 activity caps expiry at day 30 and cannot revive at the boundary', async () => {
  const f = fixture(); await f.repo.createAuthenticated(f.sid, 'owner-a', sessionData());
  for (const day of [6, 12, 18, 24, 29]) {
    f.setTime(START + day * DAY); await f.repo.renewActivity(f.sid);
  }
  const doc = await f.repo.findLive(f.sid);
  assert.equal(doc.expires.getTime(), START + ABSOLUTE_MS);
  assert.equal(doc.vento.authenticatedAt.getTime(), START);
  assert.equal(doc.vento.absoluteExpiresAt.getTime(), START + ABSOLUTE_MS);
  f.setTime(START + ABSOLUTE_MS);
  assert.equal(await f.repo.findLive(f.sid), null);
  await assert.rejects(f.repo.renewActivity(f.sid), /unavailable/);
});

test('passive reads, store touches and ordinary saves never renew activity', async () => {
  const f = fixture(); await f.repo.createAuthenticated(f.sid, 'owner-a', sessionData());
  const original = clone(f.collection.docs.get(storageId(f.sid)));
  f.setTime(START + 6 * DAY);
  const writes = f.collection.writes;
  for (let i = 0; i < 5; i++) {
    assert.ok(await invoke(f.store, 'get', f.sid));
    await invoke(f.store, 'touch', f.sid, sessionData());
  }
  assert.equal(f.collection.writes, writes);
  await invoke(f.store, 'set', f.sid, { ...sessionData(), authenticatedAt: new Date(), userId: 'attacker' });
  const after = f.collection.docs.get(storageId(f.sid));
  assert.deepEqual(after.vento, original.vento);
  assert.deepEqual(after.expires, original.expires);
  assert.equal(after.session.userId, 'owner-a');
  f.setTime(START + IDLE_MS); assert.equal(await invoke(f.store, 'get', f.sid), null);
});

test('dedicated activity renewal is throttled and never writes during the interval', async () => {
  const f = fixture(); await f.repo.createAuthenticated(f.sid, 'owner-a', sessionData());
  const writes = f.collection.writes;
  assert.equal((await f.repo.renewActivity(f.sid)).renewed, false);
  assert.equal(f.collection.writes, writes);
  f.setTime(START + RENEWAL_INTERVAL_MS);
  assert.equal((await f.repo.renewActivity(f.sid)).renewed, true);
  assert.equal((await f.repo.renewActivity(f.sid)).renewed, false);
  assert.equal(f.collection.writes, writes + 1);
});

test('revocation blocks delayed saves, touches, renewals and identifier reuse', async () => {
  const f = fixture(); await f.repo.createAuthenticated(f.sid, 'owner-a', sessionData());
  const stale = await invoke(f.store, 'get', f.sid);
  await invoke(f.store, 'destroy', f.sid);
  await invoke(f.store, 'touch', f.sid, stale);
  await assert.rejects(invoke(f.store, 'set', f.sid, stale), /unavailable/);
  await assert.rejects(f.store.renewActivity(f.sid), /unavailable/);
  await assert.rejects(f.repo.createAuthenticated(f.sid, 'owner-a', sessionData()), /Duplicate/);
  assert.equal(await invoke(f.store, 'get', f.sid), null);
});

test('logout between save validation and write wins atomically', async () => {
  const f = fixture(); await f.repo.createAuthenticated(f.sid, 'owner-a', sessionData());
  f.collection.beforeUpdate = () => f.repo.revoke(f.sid);
  await assert.rejects(f.repo.saveExisting(f.sid, sessionData()), /changed|unavailable/);
  assert.equal(await f.repo.findLive(f.sid), null);
});

test('logout between activity validation and update cannot be undone', async () => {
  const f = fixture(); await f.repo.createAuthenticated(f.sid, 'owner-a', sessionData());
  f.setTime(START + DAY);
  f.collection.beforeUpdate = () => f.repo.revoke(f.sid);
  await assert.rejects(f.repo.renewActivity(f.sid), /unavailable/);
  assert.equal(await f.repo.findLive(f.sid), null);
});

test('parallel renewals perform one update and stale saves cannot undo renewal', async () => {
  const f = fixture(); await f.repo.createAuthenticated(f.sid, 'owner-a', sessionData());
  f.setTime(START + DAY);
  const results = await Promise.all([f.repo.renewActivity(f.sid), f.repo.renewActivity(f.sid)]);
  assert.equal(results.filter(result => result.renewed).length, 1);
  f.setTime(START + 2 * DAY);
  f.collection.beforeUpdate = () => f.repo.renewActivity(f.sid);
  await assert.rejects(f.repo.saveExisting(f.sid, sessionData()), /changed/);
  assert.equal((await f.repo.findLive(f.sid)).vento.lastActivityAt.getTime(), START + 2 * DAY);
});

test('only explicit fresh authentication with a new ID starts a new lifetime', async () => {
  const f = fixture(); await f.repo.createAuthenticated(f.sid, 'owner-a', sessionData());
  const unknown = randomBytes(32).toString('base64url');
  await assert.rejects(invoke(f.store, 'set', unknown, sessionData()), /unavailable/);
  f.setTime(START + DAY);
  await f.repo.createAuthenticated(unknown, 'owner-a', sessionData());
  assert.equal((await f.repo.findLive(unknown)).vento.authenticatedAt.getTime(), START + DAY);
  assert.equal((await f.repo.findLive(f.sid)).vento.authenticatedAt.getTime(), START);
});

test('session records contain hashed IDs and whitelisted payloads only', async () => {
  const f = fixture(); await f.repo.createAuthenticated(f.sid, 'owner-a', {
    ...sessionData(), password: 'not-persisted', token: 'not-persisted', req: {},
  });
  const doc = f.collection.docs.get(storageId(f.sid));
  assert.match(doc._id, /^[a-f0-9]{64}$/);
  assert.notEqual(doc._id, f.sid);
  assert.equal(JSON.stringify(doc).includes(f.sid), false);
  assert.deepEqual(Object.keys(doc.session).sort(), ['cookie', 'userId']);
});

test('malformed policy metadata fails closed', () => {
  assert.equal(isLive(null, START), false);
  assert.equal(isLive({ userId: 'owner-a', revokedAt: null }, START), false);
});

test('database errors propagate through get/save/renew/logout without granting access', async () => {
  const f = fixture(); await f.repo.createAuthenticated(f.sid, 'owner-a', sessionData());
  f.collection.findOne = async () => { throw new Error('Database unavailable'); };
  await assert.rejects(invoke(f.store, 'get', f.sid), /Database unavailable/);
  await assert.rejects(invoke(f.store, 'set', f.sid, sessionData()), /Database unavailable/);
  await assert.rejects(f.store.renewActivity(f.sid), /Database unavailable/);
  f.collection.updateOne = async () => { throw new Error('Database unavailable'); };
  await assert.rejects(invoke(f.store, 'destroy', f.sid), /Database unavailable/);
});

test('middleware hydration pins automatic cookie touches to the approved date', async () => {
  const f = fixture(); await f.repo.createAuthenticated(f.sid, 'owner-a', sessionData());
  const data = await invoke(f.store, 'get', f.sid);
  const req = { sessionID: f.sid, sessionStore: f.store };
  f.store.createSession(req, data);
  assert.ok(req.session instanceof expressSession.Session);
  req.session.cookie.expires = new Date(START + 90 * DAY);
  req.session.touch();
  assert.equal(req.session.cookie.expires.getTime(), START + IDLE_MS);
});

test('foundation config uses real middleware with no database cleanup or HTTP mounting', async () => {
  const f = fixture();
  assert.throws(() => createSessionFoundation({ client: f.client, secret: 'short' }), /32 bytes/);
  const { store, middleware } = createSessionFoundation({ client: f.client,
    secret: 'test-only-signing-secret-with-at-least-32-bytes', clock: f.clock });
  assert.ok(store instanceof require('connect-mongo').MongoStore);
  assert.equal(typeof middleware, 'function');
  await store.repository;
  assert.equal(f.collection.writes, 0);
});

test('middleware regeneration revokes the old identifier without creating a new lifetime', async () => {
  const f = fixture();
  const { store } = createSessionFoundation({ client: f.client,
    secret: 'test-only-signing-secret-with-at-least-32-bytes', clock: f.clock });
  const req = { sessionID: f.sid, sessionStore: store, headers: {}, socket: {} };
  await f.repo.createAuthenticated(f.sid, 'owner-a', sessionData());
  store.createSession(req, await invoke(store, 'get', f.sid));
  await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
  assert.notEqual(req.sessionID, f.sid);
  assert.match(req.sessionID, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(await invoke(store, 'get', f.sid), null);
  assert.equal(await invoke(store, 'get', req.sessionID), null);
  await assert.rejects(invoke(store, 'set', req.sessionID, req.session), /unavailable/);
  const old = f.collection.docs.get(storageId(f.sid));
  assert.equal(old.vento.authenticatedAt.getTime(), START);
  assert.equal(old.vento.absoluteExpiresAt.getTime(), START + ABSOLUTE_MS);
});

test('pre-insert revocation creates a durable marker and defeats delayed creation', async () => {
  const f = fixture();
  const insert = f.collection.insertOne.bind(f.collection);
  let release;
  const blocked = new Promise(resolve => { release = resolve; });
  let entered;
  const ready = new Promise(resolve => { entered = resolve; });
  f.collection.insertOne = async doc => { entered(); await blocked; return insert(doc); };
  const creating = f.repo.createAuthenticated(f.sid, 'owner-a', sessionData());
  await ready;
  await f.repo.revoke(f.sid);
  release();
  await assert.rejects(creating, /Duplicate/);
  assert.equal(await f.repo.findLive(f.sid), null);
  const marker = f.collection.docs.get(storageId(f.sid));
  assert.equal(marker.cleanupAt.getTime(), START + ABSOLUTE_MS);
  assert.equal(marker.session, undefined);
});

test('revocation retention is independent from idle expiry; deleted IDs cannot be saved', async () => {
  const f = fixture(); await f.repo.createAuthenticated(f.sid, 'owner-a', sessionData());
  f.setTime(START + DAY); await f.repo.revoke(f.sid);
  const doc = f.collection.docs.get(storageId(f.sid));
  assert.equal(doc.expires.getTime(), START + IDLE_MS);
  assert.equal(doc.cleanupAt.getTime(), START + DAY + ABSOLUTE_MS);
  f.collection.docs.delete(storageId(f.sid)); // simulate future TTL, not a real deletion
  await assert.rejects(f.repo.saveExisting(f.sid, sessionData()), /unavailable/);
  assert.equal(f.store.createAuthenticated, undefined); // no arbitrary-ID issuance API
});

test('cookie allowlist drops nested extras and rejects invalid supported attributes', async () => {
  const f = fixture();
  const data = sessionData();
  data.cookie.extraField = { sid: f.sid, secret: 'synthetic-only' };
  data.cookie.domain = f.sid;
  await f.repo.createAuthenticated(f.sid, 'owner-a', data);
  const saved = f.collection.docs.get(storageId(f.sid)).session;
  assert.equal(JSON.stringify(saved).includes(f.sid), false);
  assert.deepEqual(Object.keys(saved.cookie).sort(),
    ['expires', 'httpOnly', 'originalMaxAge', 'path', 'sameSite', 'secure']);
  for (const [key, value] of [['path', f.sid], ['sameSite', {}], ['httpOnly', false], ['secure', {}]]) {
    const invalid = sessionData(); invalid.cookie[key] = value;
    await assert.rejects(f.repo.saveExisting(f.sid, invalid), /cookie attributes/);
  }
});

test('CSRF storage accepts independent random hex and rejects identifiers or nested input', async () => {
  const f = fixture(); await f.repo.createAuthenticated(f.sid, 'owner-a', sessionData());
  for (const csrfToken of [f.sid, storageId(f.sid), {}, null, 'short', ['nested']]) {
    await assert.rejects(f.repo.saveExisting(f.sid, { ...sessionData(), csrfToken }), /CSRF/);
  }
  const csrfToken = randomBytes(32).toString('hex');
  await f.repo.saveExisting(f.sid, { ...sessionData(), csrfToken });
  assert.equal((await f.repo.findLive(f.sid)).session.csrfToken, csrfToken);
});

function authenticationFixture() {
  const f = fixture();
  const { store } = createSessionFoundation({ client: f.client,
    secret: 'test-only-signing-secret-with-at-least-32-bytes', clock: f.clock });
  const req = { sessionID: f.sid, sessionStore: store, headers: {}, socket: {} };
  store.generate(req);
  return { ...f, store, req };
}

test('trusted authentication verifies before regeneration and uses only a new generated ID', async () => {
  const f = authenticationFixture();
  const oldSid = f.req.sessionID;
  const principal = await f.store.authenticate(f.req, async () => ({ id: 'owner-a', status: 'active' }));
  assert.deepEqual(principal, { id: 'owner-a' });
  assert.notEqual(f.req.sessionID, oldSid);
  assert.equal(await invoke(f.store, 'get', oldSid), null);
  assert.equal((await invoke(f.store, 'get', f.req.sessionID)).userId, 'owner-a');
});

test('credential failures and disabled principals never regenerate or create authentication', async () => {
  for (const verify of [async () => { throw new Error('Invalid credentials'); },
    async () => ({ id: 'owner-a', status: 'disabled' }), async () => null]) {
    const f = authenticationFixture();
    let regenerated = false;
    f.req.session.regenerate = () => { regenerated = true; };
    await assert.rejects(f.store.authenticate(f.req, verify));
    assert.equal(regenerated, false);
    assert.equal(f.collection.writes, 0);
  }
});

test('regeneration error and invalid/reused regenerated IDs never issue authentication', async () => {
  for (const failure of ['error', 'reused', 'malformed']) {
    const f = authenticationFixture();
    f.req.session.regenerate = callback => {
      if (failure === 'malformed') f.req.sessionID = 'invalid';
      callback(failure === 'error' ? new Error('Regeneration failed') : null);
    };
    await assert.rejects(f.store.authenticate(f.req, async () => ({ id: 'owner-a', status: 'active' })));
    assert.equal([...f.collection.docs.values()].some(doc => doc.session), false);
  }
});

test('authentication insert failure leaves no usable request session and revokes issuance', async () => {
  const f = authenticationFixture();
  f.collection.insertOne = async () => { throw new Error('Insert failed'); };
  await assert.rejects(f.store.authenticate(f.req, async () => ({ id: 'owner-a', status: 'active' })), /Insert failed/);
  assert.equal(f.req.session, undefined);
  assert.equal(await invoke(f.store, 'get', f.req.sessionID), null);
  assert.ok(f.collection.docs.get(storageId(f.req.sessionID)).vento.revokedAt);
});

test('concurrent authentication attempts on the same request are rejected', async () => {
  const f = authenticationFixture();
  let finish;
  const pending = f.store.authenticate(f.req, () => new Promise(resolve => { finish = resolve; }));
  await assert.rejects(f.store.authenticate(f.req, async () => ({ id: 'owner-a', status: 'active' })), /lifecycle/);
  finish({ id: 'owner-a', status: 'active' }); await pending;
});

test('unsafe production debug is rejected both at construction and per request', async () => {
  const { createRequire } = require('node:module');
  const debug = createRequire(require.resolve('express-session'))('debug');
  const previous = debug.disable();
  const f = fixture();
  const options = { client: f.client, secret: 'test-only-signing-secret-with-at-least-32-bytes' };
  try {
    debug.enable('*');
    assert.throws(() => createSessionFoundation(options), /debug logging/);
    debug.enable('*,-express-session,-connect-mongo');
    const { middleware } = createSessionFoundation(options);
    debug.enable('express-session');
    const error = await new Promise(resolve => middleware({}, {}, resolve));
    assert.match(error.message, /debug logging/);
  } finally { debug.enable(previous); }
});

test('regeneration that generates an ID then fails leaves a revoked issuance and no request session', async () => {
  const f = authenticationFixture();
  f.req.session.regenerate = callback => {
    f.store.generate(f.req);
    callback(new Error('Destroy failed'));
  };
  await assert.rejects(f.store.authenticate(f.req, async () => ({ id: 'owner-a', status: 'active' })), /Destroy failed/);
  assert.equal(f.req.session, undefined);
  assert.equal(await invoke(f.store, 'get', f.req.sessionID), null);
  assert.ok(f.collection.docs.get(storageId(f.req.sessionID)).vento.revokedAt);
});

test('failure after insertion revokes the new record rather than leaving usable credentials', async () => {
  const f = authenticationFixture();
  f.req.session.regenerate = callback => {
    f.store.generate(f.req);
    Object.freeze(f.req.session.cookie);
    callback(null);
  };
  await assert.rejects(f.store.authenticate(f.req, async () => ({ id: 'owner-a', status: 'active' })));
  assert.equal(f.req.session, undefined);
  assert.equal(await invoke(f.store, 'get', f.req.sessionID), null);
  assert.ok(f.collection.docs.get(storageId(f.req.sessionID)).vento.revokedAt);
});

test('production environment cannot select insecure development session configuration', () => {
  const previous = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    const f = fixture();
    assert.throws(() => createSessionFoundation({ client: f.client, production: false,
      secret: 'test-only-signing-secret-with-at-least-32-bytes' }), /forbidden/);
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous;
  }
});

test('connect-mongo debug namespace is independently blocked in production', () => {
  const { createRequire } = require('node:module');
  const debug = createRequire(require.resolve('connect-mongo'))('debug');
  const previous = debug.disable();
  const f = fixture();
  try {
    debug.enable('connect-mongo');
    assert.throws(() => createSessionFoundation({ client: f.client,
      secret: 'test-only-signing-secret-with-at-least-32-bytes' }), /debug logging/);
  } finally { debug.enable(previous); }
});

test('failed revocation during failed issuance propagates and cannot return authentication success', async () => {
  const f = authenticationFixture();
  f.collection.insertOne = async () => { throw new Error('Insert failed'); };
  const update = f.collection.updateOne.bind(f.collection);
  let revocations = 0;
  f.collection.updateOne = async (...args) => {
    if (++revocations > 1) throw new Error('Revocation unavailable');
    return update(...args);
  };
  await assert.rejects(f.store.authenticate(f.req, async () => ({ id: 'owner-a', status: 'active' })), /Revocation unavailable/);
  assert.equal(f.req.session, undefined);
  assert.equal([...f.collection.docs.values()].some(doc => doc.session), false);
});
