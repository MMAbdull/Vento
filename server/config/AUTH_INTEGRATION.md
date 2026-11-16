# Stage 2.1 — authentication, API and environment contract

Consolidated 2026-11-15 after Milestones 1–4 and the Mongoose security correction.
Final comprehensive review/Git approval is pending; no production deployment approval.

## Runtime and data boundary

`server.js` loads environment configuration, connects MongoDB, and constructs the
Express app with the existing native Mongoose client. `app.js` separates application
assembly from network/database startup so HTTP tests never connect to Atlas.
Mongoose autoIndex/autoCreate and connect-mongo cleanup/index creation are disabled.
Milestone 4 used only approved isolated loopback MongoDB synthetic data, retained
outside the repository. No Atlas/customer records or production indexes were touched.
Runtime authentication creates session records; ordinary startup does not run schema
migrations or cleanup. Database index inventory still needs deployment-specific review.

Keep NODE_ENV=production in production. Configure SESSION_SECRET (random >=32 bytes),
FRONTEND_ORIGINS (comma-separated exact origins; HTTPS in production), and optional
TRUST_PROXY_IPS (only actual trusted proxy IPs/CIDRs). Do not set blanket proxy trust.
Development uses HTTP-only transport with a non-Secure development cookie; production
uses __Host-vento.sid, HttpOnly, Secure, SameSite=Lax, Path=/, no Domain. A trusted TLS
proxy must forward protocol correctly. Cross-site None-cookie hosting is not enabled.

Never enable express-session/connect-mongo DEBUG namespaces or log Cookie,
Set-Cookie, Authorization, passwords, CSRF values, or auth request bodies. The
existing debug guard blocks startup/requests with unsafe namespace settings. No
request/access logger is introduced. Startup and API store errors are generic.

## API and frontend contract

All auth responses and private routes use Cache-Control:no-store. Use
credentials:'include' on cross-origin frontend fetches. Do not store credentials in
browser storage. Every authentication/private mutation must send an allowed Origin, Content-Type:
application/json, and X-CSRF-Token. Send {} for bodyless activity/logout/publish.

| Method/path | Behavior |
|---|---|
| GET /api/auth/csrf | Anonymous: signed double-submit token and HttpOnly 15-minute bootstrap cookie. Authenticated: stored session-bound CSRF token. |
| POST /api/auth/register | Existing field validation and password hashing, then trusted active-principal session issuance. Returns safe user and fresh CSRF token. |
| POST /api/auth/login | Verify password/current status before regeneration; revoke old ID, create new ID/lifetime, issue cookie and fresh CSRF token. |
| GET /api/auth/me | Validate live session and active account, return only id/name/email and CSRF token. Does not renew inactivity. |
| POST /api/auth/activity | Validate account/CSRF; throttled explicit activity renewal, cap at absolute deadline, explicitly return renewed cookie. |
| POST /api/auth/logout | Validate account/CSRF; await server revocation, clear cookie. Missing/expired session returns 401; inactive/deleted user returns 403 and revokes access. |

Expired sessions require obtaining a new bootstrap CSRF token and authenticating.
Login CSRF cannot use a token from another anonymous browser without its matching
cookie, or a token from another authenticated session. Bootstrap signatures are
domain-separated HMACs and use the signing secret; bootstrap tokens confer no
authentication. Browser JS sees CSRF tokens, never the session identifier.

Auth service returns an internal principal {id,status,user}; controllers pass it
through store.authenticate, but serialize only safe user and csrfToken. The existing
password/account/event models remain unchanged. Protected middleware checks the
account on every request and revokes missing/inactive accounts. Database failures
never grant access; auth failures use controlled 4xx/500 responses, middleware/store
failures use generic 503, invalid JSON 400 and oversized bodies 413.

Bearer JWTs are no longer accepted on private routes. jsonwebtoken/JWT_SECRET are
not used for authentication; dependency retained for legacy rejection tests and
separate cleanup review. Existing JWT clients must reauthenticate with cookies.
No dual-auth fallback exists. No frontend integration was performed in this stage.

Event creation/update/publish retain controller field whitelists and owner-filtered
queries and now require session authentication plus CSRF. RSVP listing retains the
existing owner check and now uses session authentication. Public invitation lookup
and RSVP submission bypass session loading and remain account-free. Milestone 3 now
validates public submissions and fixes relationship overrides; see RSVP_SECURITY.md.

## Dependencies

Approved transitive updates: proxy-addr 2.0.8, body-parser 2.4.0, qs 6.16.1,
brace-expansion 5.0.12. npm initially chose qs 6.17.1; a package override pins the
specifically approved 6.16.1. No Express or nodemon major change was made.
Remaining audit: minimatch 10.2.6 and inherited nodemon 3.1.14, two moderate
development findings; no forced upgrades/downgrades. Mongoose is pinned to 9.11.4,
with required kareem 3.4.1, mquery 6.0.1 and nested MongoDB driver 7.7.0. Direct driver
7.6.0 and connect-mongo 6.0.0 remain unchanged. The last security-correction audit
reported zero production findings. Verify the current tree with npm ls and npm audit.

## Verification boundaries and known limitations

`npm --prefix server test` runs 59 tests: four controller, 30 foundation/policy,
seven RSVP service/query and 18 cookie-aware localhost HTTP tests using real Express/session/bcrypt with mocked
account/event repositories and a collection double. The fake clock tests days without
waiting. Tests validate HTTP headers, CSRF/CORS, credentials, rotation, logout replay,
expiry, ownership, errors and legacy JWT rejection. Production cookie tests simulate
an explicitly trusted TLS proxy over loopback; they are not browser/TLS tests.

Milestone 4 additionally passed 17 real-MongoDB/HTTP checks on MongoDB Community
8.0.38 with the patched Mongoose; 50 logout/save/renew races, 25 first-insert/revoke
races, shared sessions across API processes and API-process restart were exercised.
One check deliberately reproduced the known RSVP publication-check/insert race;
its PASS does not mean that race was fixed. Nine browser observations passed before
the dependency correction. No full browser-context restart, real HTTPS/Secure-cookie
or independent SameSite isolation verification is claimed. Atlas/replica-set failover,
TTL and production logging/proxy checks remain unverified. See the root handoff and
server/integration/README.md for evidence, isolation rules and outstanding limits.
In-flight authorized work cannot be undone by logout. Throttled accepted activity
has the documented near-one-minute precision trade-off. Session bootstrap requests
can create request-local IDs but do not persist authenticated state.

Registration creates an account before session insertion. If session storage fails,
the account may exist without a logged-in session; retry via login. No destructive
rollback or account deletion is attempted. Future rate limiting/abuse protection
remains a deployment/security milestone. Authentication expiry never deletes saved
invitations. No cleanup is enabled.
