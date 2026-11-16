# Stage 2.1 — session architecture and security policy

Consolidated 2026-11-15. Read AUTH_INTEGRATION.md for routes/configuration and the
root STAGE_2_1_HANDOFF.md for final review state and verification evidence.

## Layering and rationale

Routes -> controllers -> services -> repositories -> models remains Vento's backend
pattern. Session-specific middleware/configuration delegates to a native MongoDB
repository in a dedicated collection; it does not change invitation business logic.

- session.js builds express-session middleware and production cookie/logging policy.
- sessionStore.js adapts connect-mongo persistence and trusted authentication lifecycle.
- sessionRepository.js owns native conditional session operations.
- sessionPolicy.js contains pure timeout/hash rules.
- sessionLogging.js checks the exact dependency debug instances before production
  startup/requests. app.js mounts the middleware; server.js connects the native client.

The approved middleware approach was selected over a fully custom Mongoose session
framework to reuse identifier/cookie/session lifecycle mechanics. MongoDB was selected
instead of Redis to reuse existing infrastructure. MemoryStore is not used. Vento's
adapter overrides get/set/touch/destroy because normal touch/upsert semantics do not
satisfy customer-activity-only renewal and strict revocation. connect-mongo supplies
its store base and shared-client collection setup; this maintenance trade-off is
explicit. No second session database or distributed lock system was introduced.

## Trusted issuance and data representation

Only store.authenticate(req, serverOwnedVerifyCallback) issues an authenticated
session. Verify callback must authenticate and return an active principal. Failure
before verification leaves existing auth untouched. After success, regenerate revokes
old ID and generates a different random 32-byte base64url ID; insertOne creates the
new record. The controller serializes safe user data and an independent CSRF token,
never the ID or signing secret. Failed regeneration/insertion/pinning aborts; newly
issued IDs are revoked where possible, with failures propagated, never reported as
successful auth. Only fresh successful authentication starts a fresh lifetime.

Native collection vento_sessions uses:
- _id: SHA-256(raw ID), hex. MongoDB's unique _id index prevents live-record collisions.
- vento: policy-owned userId, authenticatedAt, lastActivityAt, absoluteExpiresAt,
  revokedAt. These fields cannot be replaced by client payloads/ordinary saves.
- expires: current effective auth deadline.
- cleanupAt: retention deadline, separate from authorization.
- session: allowed userId/cookie fields and independent random 32-byte hex CSRF token.

Cookie payload attributes are explicitly allowlisted. Unknown/nested fields, Domain,
client expiry, request objects and credentials are not copied. CSRF storage rejects
malformed values, raw IDs and ID hashes. IDs remain in server memory and HttpOnly
cookies; enabling upstream debug/header logging could expose them, so production
guards and deployment redaction requirements remain mandatory.

## Exact lifetime and activity rules

Idle deadline = last accepted qualifying activity + seven days.
Absolute deadline = original successful authentication + 30 days.
Effective expires = min(idle deadline, absolute deadline).
At or beyond either deadline, reads/saves/renewals reject regardless of retained data.
Activity never changes authenticatedAt/absoluteExpiresAt. Session expiry never deletes
accounts, invitations or RSVPs. Ordinary rotation alone cannot create an authenticated
record; reauthentication is the only implemented way to start a new 30-day lifetime.

Only the CSRF-protected /api/auth/activity endpoint accepts customer-activity renewal.
/me, polling, passive reads and autosave timers never qualify automatically. Frontend
must invoke activity only after actual user interaction. The server cannot prove a
physical human action. A one-minute write throttle means interactions within that
interval are not separately stored, so idle expiry can be nearly one minute earlier
than seven days after the last physical interaction. This is a documented limitation.

The store touch path is a no-op. The hydrated request's automatic cookie touch pins
the existing date rather than rolling it forward. Activity explicitly repins and
sends the renewed cookie. resave:false, saveUninitialized:false, rolling:false remain.

## Revocation and concurrency

Ordinary save performs no upsert and matches valid/nonrevoked policy plus the current
activity revision. A renewal race can cause a save error rather than overwrite a
newer cookie deadline. Renewal is a conditional atomic update pipeline with no upsert.
Revoke is the only upsert path: missing ID gets an unauthenticated marker, preventing
a delayed first insertion from authorizing it. Existing sessions get revokedAt.
If insertion wins first, revoke still invalidates it. Deleted/missing records cannot
be recreated by ordinary saves/touches. In-flight authorized business work cannot be
undone by another request logging out.

M4 verified 50 logout/save/renew and 25 insert/revoke races using actual MongoDB,
plus multiple clients/processes and API restart persistence. This is finite evidence,
not a proof for all partitions, clock skew or replica-set rollback. Concurrent ordinary
payload changes can still lose nonpolicy fields (for example future CSRF rotation);
any expanded rotation design requires review.

## Retention and cleanup

cleanupAt starts at the absolute deadline. Revocation retains a marker for at least
30 days after revocation; repeated revokes extend retention only, never authorization.
Any future separately approved TTL index must use cleanupAt, not expires. Cleanup is
currently disabled; local test mongod TTL monitor is also disabled. No cleanup of
customer/event/RSVP collections is coupled to auth. After eventual retention expiry,
the database cannot remember IDs forever; trusted issuance generates fresh random
IDs and never intentionally reuses an incoming identifier.

## Logging, dependencies and evidence

Production debug namespaces express-session/connect-mongo are forbidden at construction
and checked per request. Do not re-enable them during in-flight work. Access/proxy/
error loggers must omit Cookie, Set-Cookie, Authorization, credentials, CSRF and auth
bodies. The application introduces no access logger. Deployment-specific inspection
and real TLS/proxy log verification remain future work.

Installed core versions: express-session 1.19.0, connect-mongo 6.0.0, Mongoose 9.11.4,
direct driver 7.6.0 and Mongoose's driver 7.7.0. Required kareem/mquery updates accompanied
Mongoose. Approved proxy-addr/body-parser/qs/brace-expansion fixes are applied. Last
correction audit: zero production findings; two moderate dev findings remain. No
forced incompatible dev-tool update was applied.

59 existing tests (41 unit/service/query, 18 mocked-persistence HTTP) pass. Additional
M4 evidence: 17 real-Mongo/HTTP checks; nine browser observations before the Mongoose
correction; two patched advisory probes. Full browser-context restart, real HTTPS/
Secure-cookie and independent SameSite isolation remain unverified. Publication-check/
RSVP insertion race is reproduced, not fixed. See the handoff's command/evidence table.
