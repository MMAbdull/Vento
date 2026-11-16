const { createHash } = require('node:crypto');

const DAY = 24 * 60 * 60 * 1000;
const IDLE_MS = 7 * DAY;
const ABSOLUTE_MS = 30 * DAY;
const RENEWAL_INTERVAL_MS = 60 * 1000;

function storageId(sid) {
  if (typeof sid !== 'string' || !sid) throw new TypeError('Session identifier required');
  return createHash('sha256').update(sid).digest('hex');
}

function initialPolicy(userId, now) {
  if (typeof userId !== 'string' || !userId) throw new TypeError('User ID required');
  return {
    userId,
    authenticatedAt: new Date(now),
    lastActivityAt: new Date(now),
    absoluteExpiresAt: new Date(now + ABSOLUTE_MS),
    revokedAt: null,
  };
}

function expiresAt(policy) {
  return new Date(Math.min(
    new Date(policy.lastActivityAt).getTime() + IDLE_MS,
    new Date(policy.absoluteExpiresAt).getTime(),
    new Date(policy.authenticatedAt).getTime() + ABSOLUTE_MS,
  ));
}

function isLive(policy, now) {
  if (!policy || policy.revokedAt !== null || !policy.userId) return false;
  const authenticated = new Date(policy.authenticatedAt).getTime();
  const activity = new Date(policy.lastActivityAt).getTime();
  const absolute = new Date(policy.absoluteExpiresAt).getTime();
  return Number.isFinite(authenticated) && Number.isFinite(activity)
    && Number.isFinite(absolute) && authenticated <= activity && activity <= now
    && absolute === authenticated + ABSOLUTE_MS && now < expiresAt(policy).getTime();
}

module.exports = {
  IDLE_MS, ABSOLUTE_MS, RENEWAL_INTERVAL_MS,
  storageId, initialPolicy, expiresAt, isLive,
};
