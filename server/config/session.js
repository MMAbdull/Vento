const session = require('express-session');
const { randomBytes } = require('node:crypto');
const VentoSessionStore = require('./sessionStore');
const { IDLE_MS } = require('../services/sessionPolicy');
const { assertSafeSessionLogging } = require('./sessionLogging');

// app.js mounts this factory; importing this module alone does not connect to MongoDB.
// Supply the already-connected native MongoClient; this does not open Atlas itself.
function createSessionFoundation({ client, dbName, secret, production = true, clock }) {
  if (process.env.NODE_ENV === 'production' && production !== true) {
    throw new Error('Development session configuration is forbidden in production');
  }
  if (production) assertSafeSessionLogging();
  if (!client || typeof client.db !== 'function') throw new TypeError('Connected MongoClient required');
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32) {
    throw new TypeError('A session signing secret of at least 32 bytes is required');
  }
  const store = new VentoSessionStore({ client, dbName, clock });
  const options = {
    store, secret,
    name: production ? '__Host-vento.sid' : 'vento.sid.dev',
    genid: () => randomBytes(32).toString('base64url'),
    resave: false, saveUninitialized: false, rolling: false,
    cookie: { httpOnly: true, secure: production, sameSite: 'lax', path: '/', maxAge: IDLE_MS },
  };
  const middleware = session(options);
  return { store, middleware(req, res, next) {
    // Also fail closed if runtime debug configuration changes after startup.
    try { if (production) assertSafeSessionLogging(); } catch (error) { return next(error); }
    return middleware(req, res, next);
  } };
}

module.exports = { createSessionFoundation };
