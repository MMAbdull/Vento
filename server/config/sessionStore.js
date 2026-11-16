const { MongoStore } = require('connect-mongo');
const { randomBytes } = require('node:crypto');
const SessionRepository = require('../repositories/sessionRepository');
const { storageId, expiresAt } = require('../services/sessionPolicy');

function pinCookieDeadline(session, deadline) {
  const expires = new Date(deadline);
  // express-session automatically calls touch() at response completion. Pin the
  // date so that this automatic call cannot roll either cookie deadline forward.
  Object.defineProperty(session, 'touch', {
    configurable: true,
    value() {
      this.cookie.expires = new Date(expires);
      return this;
    },
  });
  session.touch();
}

// connect-mongo owns connection/index lifecycle. Override its upsert/touch paths
// narrowly: Vento activity and revocation metadata are authoritative.
class VentoSessionStore extends MongoStore {
  #authenticating = new WeakSet();
  constructor({ client, dbName, collectionName = 'vento_sessions', clock = Date.now }) {
    super({ client, dbName, collectionName, stringify: false,
      transformId: storageId, autoRemove: 'disabled' });
    this.repository = this.collectionP.then(collection => new SessionRepository(collection, clock));
  }

  get(sid, callback) {
    this.repository.then(repo => repo.findLive(sid))
      .then(doc => callback(null, doc ? doc.session : null), callback);
  }

  createSession(req, data) {
    super.createSession(req, data);
    pinCookieDeadline(req.session, data.cookie.expires);
    return req.session;
  }

  set(sid, session, callback = () => {}) {
    this.repository.then(repo => repo.saveExisting(sid, session))
      .then(() => callback(null), callback);
  }

  touch(_sid, _session, callback = () => {}) {
    // express-session calls this for passive requests. Intentionally no DB write.
    callback(null);
  }

  destroy(sid, callback = () => {}) {
    this.repository.then(repo => repo.revoke(sid)).then(() => callback(null), callback);
  }

  async authenticate(req, verifyCredentials) {
    // Only server code supplies this callback. No caller-supplied SID is accepted.
    if (typeof verifyCredentials !== 'function' || this.#authenticating.has(req)) {
      throw new TypeError('Invalid authentication lifecycle');
    }
    this.#authenticating.add(req);
    let issuedSid;
    let regenerating = false;
    const previousSid = req.sessionID;
    try {
      const principal = await verifyCredentials();
      if (!principal || typeof principal.id !== 'string' || !principal.id
        || principal.status !== 'active') throw new Error('Authentication rejected');
      regenerating = true;
      await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
      issuedSid = req.sessionID;
      if (issuedSid === previousSid || !/^[A-Za-z0-9_-]{43}$/.test(issuedSid)) {
        throw new Error('Session regeneration failed');
      }
      req.session.csrfToken = randomBytes(32).toString('hex');
      const policy = await (await this.repository).createAuthenticated(issuedSid, principal.id, req.session);
      req.session.userId = principal.id;
      pinCookieDeadline(req.session, expiresAt(policy));
      return { id: principal.id };
    } catch (error) {
      // Upstream may generate a new request-local object even when destroy fails.
      if (regenerating) {
        if (!issuedSid && req.sessionID !== previousSid) issuedSid = req.sessionID;
        delete req.session;
      }
      if (issuedSid) {
        // If insertion/pinning failed, invalidate that issuance. Never silently
        // report success when MongoDB is unavailable. No credential data in errors.
        await (await this.repository).revoke(issuedSid);
      }
      throw error;
    } finally {
      this.#authenticating.delete(req);
    }
  }

  async renewActivity(sid) {
    return (await this.repository).renewActivity(sid);
  }
}

module.exports = VentoSessionStore;
module.exports.pinCookieDeadline = pinCookieDeadline;
