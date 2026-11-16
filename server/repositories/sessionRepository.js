const {
  IDLE_MS, ABSOLUTE_MS, RENEWAL_INTERVAL_MS, storageId, initialPolicy, expiresAt, isLive,
} = require('../services/sessionPolicy');

// Only this dedicated session collection is touched. No account/event mutations.
class SessionRepository {
  constructor(collection, clock = Date.now) {
    this.collection = collection;
    this.clock = clock;
  }

  liveFilter(sid, now) {
    return {
      _id: storageId(sid),
      'vento.revokedAt': null,
      'vento.absoluteExpiresAt': { $gt: new Date(now) },
      expires: { $gt: new Date(now) },
    };
  }

  // Persistence primitive, called only by the store's trusted authenticate lifecycle.
  // A missing-ID revoke inserts a tombstone, so even pre-insert revocation wins.
  async createAuthenticated(sid, userId, session) {
    const vento = initialPolicy(userId, this.clock());
    const expires = expiresAt(vento);
    await this.collection.insertOne({
      _id: storageId(sid), vento, expires,
      cleanupAt: vento.absoluteExpiresAt,
      session: this.payload(sid, session, vento),
    });
    return vento;
  }

  payload(sid, session, policy) {
    // Do not persist request objects, arbitrary fields, or client-supplied identity.
    const cookie = session.cookie?.toJSON ? session.cookie.toJSON() : session.cookie;
    if (!cookie || cookie.httpOnly !== true || typeof cookie.secure !== 'boolean'
      || !['lax', 'strict', 'none'].includes(cookie.sameSite) || cookie.path !== '/'
      || (cookie.sameSite === 'none' && !cookie.secure)) {
      throw new TypeError('Invalid session cookie attributes');
    }
    const result = {
      userId: policy.userId,
      cookie: {
        httpOnly: true, secure: cookie.secure, sameSite: cookie.sameSite, path: '/',
        expires: expiresAt(policy), originalMaxAge: 0,
      },
    };
    if (session.csrfToken !== undefined) {
      // Independent random 32-byte hex token; never the session ID or its DB key.
      if (typeof session.csrfToken !== 'string' || !/^[a-f0-9]{64}$/.test(session.csrfToken)
        || session.csrfToken === sid || session.csrfToken === storageId(sid)) {
        throw new TypeError('Invalid CSRF token');
      }
      result.csrfToken = session.csrfToken;
    }
    return result;
  }

  async findLive(sid) {
    const now = this.clock();
    const doc = await this.collection.findOne(this.liveFilter(sid, now));
    return doc && isLive(doc.vento, now) ? doc : null;
  }

  async saveExisting(sid, session) {
    const doc = await this.findLive(sid);
    if (!doc) throw new Error('Session is unavailable');
    const now = this.clock();
    // Revision guards prevent a stale save from undoing a renewal or revocation.
    const result = await this.collection.updateOne({
      ...this.liveFilter(sid, now),
      'vento.lastActivityAt': doc.vento.lastActivityAt,
    }, { $set: { session: this.payload(sid, session, doc.vento) } });
    if (result.matchedCount !== 1) throw new Error('Session changed or is unavailable');
  }

  async renewActivity(sid) {
    const now = this.clock();
    const doc = await this.findLive(sid);
    if (!doc) throw new Error('Session is unavailable');
    if (now - new Date(doc.vento.lastActivityAt).getTime() < RENEWAL_INTERVAL_MS) {
      return { renewed: false, expiresAt: expiresAt(doc.vento) };
    }
    // One atomic pipeline: no upsert, no change to authentication/absolute dates.
    const result = await this.collection.findOneAndUpdate({
      ...this.liveFilter(sid, now),
      'vento.lastActivityAt': { $lte: new Date(now - RENEWAL_INTERVAL_MS) },
    }, [{ $set: {
      'vento.lastActivityAt': new Date(now),
      expires: { $min: [new Date(now + IDLE_MS), '$vento.absoluteExpiresAt'] },
      'session.cookie.expires': { $min: [new Date(now + IDLE_MS), '$vento.absoluteExpiresAt'] },
    } }], { returnDocument: 'after', includeResultMetadata: false });
    if (result) return { renewed: true, expiresAt: expiresAt(result.vento) };
    // A simultaneous renewal may have won. Recheck; never treat logout as success.
    const current = await this.findLive(sid);
    if (!current) throw new Error('Session is unavailable');
    return { renewed: false, expiresAt: expiresAt(current.vento) };
  }

  async revoke(sid) {
    // Upsert ONLY revocation, never authentication. Revoke-before-insert therefore
    // blocks creation. Keep markers for at least 30 days after revocation, covering
    // any pending issuance lifetime. Repeated revokes may extend retention only.
    const now = this.clock();
    await this.collection.updateOne({ _id: storageId(sid) }, {
      $set: { 'vento.revokedAt': new Date(now) },
      $max: { cleanupAt: new Date(now + ABSOLUTE_MS) },
    }, { upsert: true });
  }
}

module.exports = SessionRepository;
