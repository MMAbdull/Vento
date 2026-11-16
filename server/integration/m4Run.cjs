const { approvedUri } = require('./m4Guard.cjs');
// Validate BEFORE connecting or importing application startup. Never read MONGODB_URI.
const uri = approvedUri(process.env.VENTO_M4_TEST_URI);
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { fork } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const Repo = require('../repositories/sessionRepository');
const Store = require('../config/sessionStore');
const { storageId, IDLE_MS, ABSOLUTE_MS } = require('../services/sessionPolicy');
const { createApp } = require('../app');
const { createSessionFoundation } = require('../config/session');
const Event = require('../models/Event');
const User = require('../models/User');
const RSVP = require('../models/RSVP');
const eventRepository = require('../repositories/eventRepository');
const rsvpService = require('../services/rsvpService');

const results = [], secrets = [], output = [], allBodies = [];
const secret = randomBytes(48).toString('hex'); secrets.push(secret);
const testPassword = randomBytes(32).toString('base64url'); secrets.push(testPassword);
const DAY = IDLE_MS / 7, origin = 'http://127.0.0.1:38148';
let now = Date.now(), client, db, server, base;
const children = new Set();
const payload = () => ({ cookie: { httpOnly: true, secure: false, sameSite: 'lax', path: '/' } });
const sid = () => { const value = randomBytes(32).toString('base64url'); secrets.push(value); return value; };
const invoke = (store, method, ...args) => new Promise((resolve, reject) => store[method](...args, (err, value) => err ? reject(err) : resolve(value)));
async function check(name, fn) {
  try { await fn(); results.push({ name, status: 'PASS' }); console.log(`PASS ${name}`); }
  catch (error) { results.push({ name, status: 'FAIL', errorType: error.name }); console.log(`FAIL ${name} (${error.name})`); }
}
function agent(url = () => base) {
  const jar = new Map();
  return { jar, csrf: '', bodies: [],
    async request(route, method = 'GET', body, extra = {}) {
      const response = await fetch(`${url()}${route}`, { method, headers: { Origin: origin,
        Cookie: [...jar].map(([key, value]) => `${key}=${value}`).join('; '),
        ...(method !== 'GET' ? { 'Content-Type': 'application/json', 'X-CSRF-Token': this.csrf } : {}), ...extra },
        body: method === 'GET' || method === 'OPTIONS' ? undefined : JSON.stringify(body || {}) });
      for (const value of response.headers.getSetCookie()) {
        const pair = value.split(';')[0], pos = pair.indexOf('='); jar.set(pair.slice(0, pos), pair.slice(pos + 1));
        if (pair.startsWith('vento.sid.dev=') && pair.slice(pos + 1)) {
          const raw = decodeURIComponent(pair.slice(pos + 1)); secrets.push(raw, raw.split('.')[0].slice(2));
        }
      }
      const data = method === 'OPTIONS' ? null : await response.json(); this.bodies.push(JSON.stringify(data)); allBodies.push(JSON.stringify(data));
      if (data?.csrfToken) this.csrf = data.csrfToken;
      return { status: response.status, data, headers: response.headers };
    },
    async register(email) { await this.request('/api/auth/csrf'); return this.request('/api/auth/register', 'POST', { name: 'Synthetic owner', email, password: testPassword }); },
    async login(email) { await this.request('/api/auth/csrf'); return this.request('/api/auth/login', 'POST', { email, password: testPassword }); },
  };
}
async function childHost() {
  const child = fork(path.join(__dirname, 'm4Host.cjs'), [], { silent: true, env: {
    SystemRoot: process.env.SystemRoot, PATH: process.env.PATH, NODE_ENV: 'test',
  } });
  children.add(child); child.stdout.on('data', value => output.push(value.toString())); child.stderr.on('data', value => output.push(value.toString()));
  const reply = once(child, 'message'); child.send({ action: 'start', uri, secret, now });
  const [message] = await Promise.race([reply, new Promise((_, reject) => setTimeout(() => reject(new Error('Test host timeout')), 10000).unref())]);
  assert.ok(!message.failed); return { child, url: `http://127.0.0.1:${message.port}` };
}
async function stopHost(host) { const ended = once(host.child, 'exit'); host.child.send({ action: 'stop' }); await ended; children.delete(host.child); }

async function main() {
  for (const invalid of [undefined, '', 'mongodb://localhost:37147/vento_m4_x', 'mongodb://127.0.0.1:27017/vento_m4_x',
    'mongodb+srv://remote/vento_m4_x', 'mongodb://127.0.0.1:37147/vento', `${uri}?directConnection=true`]) {
    assert.throws(() => approvedUri(invalid));
  }
  await mongoose.connect(uri, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 2000 });
  client = mongoose.connection.getClient(); db = mongoose.connection.db;
  const options = await db.admin().command({ getCmdLineOpts: 1 });
  assert.equal(options.parsed.net.bindIp, '127.0.0.1'); assert.equal(options.parsed.net.port, 37147);
  assert.equal((await db.admin().command({ getParameter: 1, ttlMonitorEnabled: 1 })).ttlMonitorEnabled, false);
  const version = (await db.admin().command({ buildInfo: 1 })).version;
  assert.match(version, /^8\.0\./);
  const collection = db.collection('policy_sessions');
  const repo = new Repo(collection, () => now);
  await check('real session creation, hashed identity, unique-ID rejection and retrieval', async () => {
    const id = sid(); await repo.createAuthenticated(id, 'synthetic-owner', payload());
    const doc = await repo.findLive(id); assert.ok(doc); assert.equal(doc._id === id, false);
    assert.equal(JSON.stringify(doc).includes(id), false);
    await assert.rejects(repo.createAuthenticated(id, 'synthetic-owner', payload()));
  });
  await check('exact idle expiry rejects even with retained Mongo record', async () => {
    const start = now, id = sid(); await repo.createAuthenticated(id, 'synthetic-owner', payload());
    now = start + IDLE_MS - 1; assert.ok(await repo.findLive(id));
    now++; assert.equal(await repo.findLive(id), null); await assert.rejects(repo.renewActivity(id));
    assert.ok(await collection.findOne({ _id: storageId(id) })); now = start;
  });
  await check('native renewal pipeline, throttle and nonrenewable day-30 deadline', async () => {
    const start = now, id = sid(); await repo.createAuthenticated(id, 'synthetic-owner', payload());
    assert.equal((await repo.renewActivity(id)).renewed, false);
    for (const day of [6, 12, 18, 24, 29]) { now = start + day * DAY; assert.equal((await repo.renewActivity(id)).renewed, true); }
    const doc = await repo.findLive(id); assert.equal(doc.expires.getTime(), start + ABSOLUTE_MS);
    assert.equal(doc.vento.authenticatedAt.getTime(), start);
    now = start + ABSOLUTE_MS; assert.equal(await repo.findLive(id), null); await assert.rejects(repo.saveExisting(id, payload())); now = start;
  });
  await check('pre-insert revoke creates real Mongo unique tombstone that blocks issuance', async () => {
    const id = sid(); await repo.revoke(id); await assert.rejects(repo.createAuthenticated(id, 'synthetic-owner', payload()));
    assert.equal(await repo.findLive(id), null);
  });
  await check('two independent clients: concurrent logout/save/renew cannot resurrect records (50 races)', async () => {
    const other = await new MongoClient(uri).connect();
    try {
      const second = new Repo(other.db().collection('policy_sessions'), () => now);
      for (let i = 0; i < 50; i++) {
        const id = sid(); await repo.createAuthenticated(id, 'synthetic-owner', payload());
        const start = now; now += DAY;
        await Promise.allSettled([repo.revoke(id), second.saveExisting(id, payload()), second.renewActivity(id)]);
        assert.equal(await repo.findLive(id), null); assert.equal(await second.findLive(id), null);
        await assert.rejects(second.saveExisting(id, payload())); now = start;
      }
    } finally { await other.close(); }
  });
  await check('real concurrent first insert/revoke leaves no authorized record (25 races)', async () => {
    for (let i = 0; i < 25; i++) {
      const id = sid(); await Promise.allSettled([repo.createAuthenticated(id, 'synthetic-owner', payload()), repo.revoke(id)]);
      assert.equal(await repo.findLive(id), null);
    }
  });
  const app = createApp({ client, dbName: db.databaseName, secret, origins: [origin], production: false, clock: () => now });
  server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}`;
  const a = agent(), b = agent(); let eventId, unpublishedId;
  const suffix = randomBytes(6).toString('hex'); const emailA = `a-${suffix}@example.invalid`, emailB = `b-${suffix}@example.invalid`;
  await check('real HTTP registration, login and safe me response', async () => {
    assert.equal((await a.register(emailA)).status, 201); assert.equal((await b.register(emailB)).status, 201);
    const me = await a.request('/api/auth/me'); assert.equal(me.status, 200); assert.equal(me.data.user.passwordHash, undefined);
    const c = agent(); await c.request('/api/auth/csrf');
    assert.equal((await c.request('/api/auth/login', 'POST', { email: emailA, password: 'incorrect' })).status, 401);
    assert.equal((await c.login(emailA)).status, 200);
  });
  await check('real HTTP passive requests do not update activity; cookie renewal throttle', async () => {
    const sessionCollection = db.collection('vento_sessions');
    const before = await sessionCollection.find({ 'vento.userId': (await a.request('/api/auth/me')).data.user.id }).toArray();
    await a.request('/api/auth/me'); const after = await sessionCollection.find({ 'vento.userId': before[0].vento.userId }).toArray();
    assert.deepEqual(after, before);
    now += 60000; const result = await a.request('/api/auth/activity', 'POST'); assert.equal(result.status, 200); assert.equal(result.data.renewed, true);
    assert.equal((await a.request('/api/auth/activity', 'POST')).data.renewed, false);
  });
  await check('real HTTP CSRF, CORS and legacy bearer rejection', async () => {
    assert.equal((await a.request('/api/auth/activity', 'POST', {}, { 'X-CSRF-Token': 'invalid' })).status, 403);
    assert.equal((await a.request('/api/auth/me', 'GET', null, { Origin: 'https://untrusted.invalid' })).status, 403);
    const c = agent(); assert.equal((await c.request('/api/auth/login', 'POST', { email: emailA, password: 'irrelevant' })).status, 403);
    const legacy = require('jsonwebtoken').sign({ sub: (await a.request('/api/auth/me')).data.user.id }, secret);
    secrets.push(legacy); assert.equal((await c.request('/api/auth/me', 'GET', null, { Authorization: `Bearer ${legacy}` })).status, 401);
  });
  await check('real event ownership read/update/publish and owner-only RSVP listing', async () => {
    const fields = { title: 'Synthetic invitation', eventType: 'wedding', date: '2027-01-01', time: '18:00', venue: 'Synthetic venue' };
    const created = await a.request('/api/events', 'POST', { ...fields, owner: 'forged' }); assert.equal(created.status, 201); eventId = created.data.data._id;
    unpublishedId = (await a.request('/api/events', 'POST', fields)).data.data._id;
    assert.equal((await a.request(`/api/events/${eventId}`)).status, 200);
    assert.equal((await b.request(`/api/events/${eventId}`)).status, 404);
    assert.equal((await b.request(`/api/events/${eventId}`, 'PUT', fields)).status, 404);
    assert.equal((await b.request(`/api/events/${eventId}/publish`, 'PUT')).status, 404);
    assert.equal((await a.request(`/api/events/${eventId}/publish`, 'PUT')).status, 200);
    assert.equal((await a.request(`/api/events/${eventId}/rsvps`)).status, 200);
    assert.equal((await b.request(`/api/events/${eventId}/rsvps`)).status, 404);
  });
  await check('real public RSVP insertion, route authority and invalid input rejection', async () => {
    const guest = agent(); const valid = { guestName: 'Synthetic guest', status: 'attending', guestCount: 1 };
    assert.equal((await guest.request(`/api/events/${eventId}/rsvps`, 'POST', { ...valid, event: unpublishedId })).status, 201);
    assert.equal((await RSVP.findOne({ event: eventId })).event.toString(), eventId);
    assert.equal((await guest.request(`/api/events/${unpublishedId}/rsvps`, 'POST', valid)).status, 404);
    assert.equal((await guest.request('/api/events/507f1f77bcf86cd799439099/rsvps', 'POST', valid)).status, 404);
    assert.equal((await guest.request('/api/events/invalid/rsvps', 'POST', valid)).status, 400);
    for (const bad of [{ guestName: '   ' }, { status: 'maybe' }, { guestCount: '1' }, { guestCount: 0 }, { status: 'not-attending', guestCount: 1 }]) {
      assert.equal((await guest.request(`/api/events/${eventId}/rsvps`, 'POST', { ...valid, ...bad })).status, 400);
    }
    assert.equal((await guest.request(`/api/events/${eventId}/rsvps`, 'POST', { ...valid, status: 'not-attending', guestCount: 0 })).status, 201);
  });
  await check('known publication-check/insertion race reproduced without adding transactions', async () => {
    const original = eventRepository.findPublishedEventById;
    eventRepository.findPublishedEventById = async id => {
      const result = await original(id); await Event.updateOne({ _id: id }, { $set: { status: 'unpublished' } }); return result;
    };
    try {
      const record = await rsvpService.createRSVP(eventId, { guestName: 'Synthetic race', status: 'attending', guestCount: 1 });
      assert.ok(record._id); assert.equal((await Event.findById(eventId)).status, 'unpublished');
    } finally { eventRepository.findPublishedEventById = original; }
  });
  await check('real two-process persistence and cookie authorization after server restart', async () => {
    let first = await childHost(); let second = await childHost();
    try {
      let currentUrl = first.url; const c = agent(() => currentUrl); assert.equal((await c.login(emailA)).status, 200);
      currentUrl = second.url; assert.equal((await c.request('/api/auth/me')).status, 200);
      currentUrl = first.url; const requestA = c.request('/api/auth/me');
      currentUrl = second.url; const requestB = c.request('/api/auth/me');
      const concurrent = await Promise.all([requestA, requestB]);
      assert.ok(concurrent.every(result => result.status === 200));
      await stopHost(first); first = await childHost(); currentUrl = first.url;
      assert.equal((await c.request('/api/auth/me')).status, 200);
      const oldCookie = c.jar.get('vento.sid.dev'); assert.equal((await c.request('/api/auth/logout', 'POST')).status, 200);
      c.jar.set('vento.sid.dev', oldCookie); currentUrl = second.url; assert.equal((await c.request('/api/auth/me')).status, 401);
    } finally { await stopHost(first); await stopHost(second); }
  });
  await check('real disabled/deleted accounts lose authorization; logout replay and expiry fail', async () => {
    await User.updateOne({ email: emailB }, { $set: { status: 'disabled' } }); assert.equal((await b.request('/api/auth/me')).status, 403);
    const c = agent(); assert.equal((await c.login(emailB)).status, 403);
    const old = a.jar.get('vento.sid.dev'); assert.equal((await a.request('/api/auth/logout', 'POST')).status, 200);
    a.jar.set('vento.sid.dev', old); assert.equal((await a.request('/api/auth/me')).status, 401);
    assert.equal((await a.login(emailA)).status, 200); now += IDLE_MS;
    assert.equal((await a.request('/api/auth/me')).status, 401); assert.equal((await a.login(emailA)).status, 200);
    await User.updateOne({ email: emailA }, { $set: { status: 'deleted' } }); assert.equal((await a.request('/api/auth/me')).status, 403);
  });
  await check('real closed-client store fails securely and new-client recovery preserves DB session', async () => {
    const secondary = await new MongoClient(uri).connect();
    const store = new Store({ client: secondary, dbName: db.databaseName, collectionName: 'failure_sessions' });
    const id = sid(); await (await store.repository).createAuthenticated(id, 'synthetic-owner', payload()); await secondary.close();
    await assert.rejects(invoke(store, 'get', id));
    const failedApp = createApp({ client: secondary, dbName: db.databaseName, secret,
      origins: [origin], production: false, clock: () => now });
    const failedServer = failedApp.listen(0, '127.0.0.1'); await once(failedServer, 'listening');
    try {
      const c = agent(() => `http://127.0.0.1:${failedServer.address().port}`);
      const dependencyRequire = require('node:module').createRequire(require.resolve('express-session'));
      c.jar.set('vento.sid.dev', encodeURIComponent(`s:${dependencyRequire('cookie-signature').sign(id, secret)}`));
      const result = await c.request('/api/auth/me');
      assert.equal(result.status, 503); assert.equal(result.data.message, 'Service unavailable');
    } finally { failedServer.closeAllConnections(); await new Promise(resolve => failedServer.close(resolve)); }
    const recovered = new Store({ client, dbName: db.databaseName, collectionName: 'failure_sessions' });
    assert.ok(await invoke(recovered, 'get', id));
  });
  await check('API bodies and captured child application logs contain no session identifiers/passwords/secrets', async () => {
    const bodies = allBodies.join('\n');
    const mongoLog = fs.readFileSync(path.resolve(__dirname, '../../../Vento-Codex/test-infrastructure/milestone4/logs/mongod.log'), 'utf8');
    for (const value of secrets) {
      assert.ok(value.length > 0);
      assert.equal(bodies.includes(value), false); assert.equal(output.join('').includes(value), false);
      assert.equal(mongoLog.includes(value), false);
    }
  });
  await check('no custom indexes or TTL indexes were enabled', async () => {
    for (const item of await db.listCollections().toArray()) {
      for (const index of await db.collection(item.name).listIndexes().toArray()) {
        assert.equal(index.name, '_id_'); assert.equal(index.expireAfterSeconds, undefined);
      }
    }
  });
  const mongooseRequire = require('node:module').createRequire(require.resolve('mongoose'));
  const report = { mongoVersion: version, driverVersion: require('mongodb/package.json').version,
    mongooseVersion: mongoose.version, mongooseDriverVersion: mongooseRequire('mongodb/package.json').version,
    database: db.databaseName, approvedPort: 37147, results,
    pass: results.filter(item => item.status === 'PASS').length, fail: results.filter(item => item.status === 'FAIL').length };
  const reportDir = path.resolve(__dirname, '../../../Vento-Codex/test-infrastructure/milestone4');
  fs.writeFileSync(path.join(reportDir, 'real-integration-results.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ pass: report.pass, fail: report.fail }));
  if (report.fail) process.exitCode = 1;
}
main().catch(error => { console.error(`Integration setup failed (${error.name}); no credentials printed`); process.exitCode = 1; })
  .finally(async () => {
    for (const child of children) child.kill();
    server?.closeAllConnections(); if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
  });
