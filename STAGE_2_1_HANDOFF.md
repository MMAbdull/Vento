# Vento — Stage 2.1 handoff and final review preparation

Date: 2026-11-16 (Asia/Amman); accepted implementation evidence retained from 2026-11-15.
Repository: MMAbdull/Vento. Workspace: C:/Users/ASUS/Desktop/SE-Projects/SE-Jordan/Vento.
Branch: feature/stage-2-session-rsvp-hardening.
Integration/base branch: stage-2/foundation.
Stage 2.1 base: 33becd957770ed2054e5e9301079c7aac9e7e3f9 (Stage 2 PR #2 merge).
Stage 2.1 commit/push/PR finalization authorized 2026-11-16. Actual commit IDs and PR receipt are recorded in the external handoff after creation; merge remains unapproved.
Backend commit: d5bf583160e538d2d7e12f4a674673e4e0c67176. Documentation is recorded in the commit containing this handoff. At documentation-commit preparation, push/PR creation remains pending execution and verification. The remote foundation was verified unchanged at 33becd957770ed2054e5e9301079c7aac9e7e3f9. No merge/deployment is authorized.
The existing feature/stage-3-client-auth branch remains at 33becd9 and is preserved.

Status: Milestones 1–5 and comprehensive Stage 2.1 review accepted. Reviewed commits, feature push and PR are authorized; merge and Stage 3 implementation require separate approval. Acceptance does not close outstanding risks or constitute production deployment approval.

The external ../Vento-Codex/handoffs/STAGE_2_1_HANDOFF.md retains this content and may append the final Git/PR receipt after the documentation commit. Repository
paths below are relative to Vento unless explicitly labeled Vento-Codex. The external
protocol ../Vento-Codex/AGENTS.md governs supervised checkpoints and separate Git approvals.

## Finalization and outstanding issues (2026-11-16)

The owner accepted comprehensive Stage 2.1 review and explicitly approved two reviewed
commits, feature push and PR targeting stage-2/foundation. Do not merge automatically.
The persistent local register is `../Vento-Codex/VENTO_OUTSTANDING_ISSUES.md`, stable
IDs VENTO-001–025. It is outside the repository; this handoff references it without
uploading that sibling file. Security defects/gaps, dev maintenance, frontend drafts,
autosave/recovery, index verification and future business policy remain open there.

Stage 3 autosave must persist account drafts in MongoDB. Unpaid drafts expire after
30 inactive days with seven additional recovery days, protecting paid/published
invitations. These are not session expiration or implemented cleanup. Stage 3 guest
sessionStorage, auth modal edit preservation, owner listing, decline count zero,
meaningful activity and failed-save/multi-tab handling remain explicit requirements.
Planning files are in `../Vento-Codex/`, not the Vento root.

Stage 3 publication remains provisional until Stage 6 checkout/entitlement enforcement:
all eventual publications require checkout including zero-JOD orders; one purchased
invitation gives one active publication; theme upgrades replace the active design
without an additional link; additional independent invitations require separate
entitlement. Preserve approved future rules without treating unfinalized price/refund
proposals as final. Private RSVPs/passwords/personalized links remain deferred.

The next Stage 3 chat should consume the updated sibling protocol/roadmap/prompt,
external handoff and register only after separately approved Stage 2.1 merge. No
Stage 3 branch synchronization or implementation is performed by this finalization.

## Executive summary

Stage 2.1 replaces browser-facing bearer JWT authorization with persistent, revocable
server-managed sessions using express-session/connect-mongo and a narrow native MongoDB
policy/repository adapter. It adds cookie login/register, current-user restoration,
explicit activity renewal, logout, CSRF protection and restricted credentialed CORS.
Existing user-status and server-side event ownership checks remain authoritative.

Public RSVP creation now validates the authoritative route ID and guest fields and
requires an existing published event; body event/owner fields cannot redirect writes.
Public submission remains account-free and response listing remains owner-only.
The Mongoose security correction pins 9.11.4 and removes the production advisories
reported during M4. No Stage 3 frontend or product expansion was implemented.

59 existing tests passed again during Git finalization on 2026-11-16 (npm --prefix server test: 59 pass, 0 fail, 0 skipped). The staged whitespace check passed after the three approved test EOF corrections. Historical accepted M4 evidence includes 17 real-Mongo/HTTP
checks, 75 concurrency iterations, API-process restart, nine browser observations,
and patched advisory probes. One real check reproduces the known RSVP race rather
than proving publication/insertion atomicity. Important production/browser gaps remain.

## Milestones and acceptance evidence

| Milestone | Implemented result | Evidence / checkpoint |
|---|---|---|
| 1: session foundation and review corrections | Idle/absolute policy, hashed IDs, trusted issuance, conditional save/renew, pre-insert revoke markers, cookie allowlist, debug guards | Policy/store tests; corrections reviewed. Middleware/HTTP status not claimed from unit tests alone. |
| 2: dependency remediation and HTTP auth | Cookie authentication, /me, activity, logout, CSRF/CORS, JWT cutover; owner queries preserved | Cookie-aware mocked-persistence HTTP tests, registration/login/error/security cases. |
| 3: public RSVP hardening | Explicit types/counts/lengths; published-event lookup; body relationship override removed | 11 new RSVP cases, bringing existing suite to 59; owner listing preserved. |
| 4: real infrastructure and security correction | Approved portable loopback MongoDB; real persistence/concurrency/HTTP; browser harness; Mongoose 9.11.4 | 17 real checks pass; 9 historical browser observations; two advisory behaviors blocked after update. Owner accepted M4 progression with documented gaps. |
| 5: docs/handoff/final review | Current architecture/API/environment/testing docs, roadmap and Stage 3 handoff context; comprehensive review ZIP | 59-test regression and git diff --check passed; comprehensive review accepted 2026-11-16. Git finalization authorized; merge pending. |

## Complete Stage 2.1 file-change inventory

Compared with Stage 2.1 base 33becd9; includes the complete accepted stage. No deleted
implementation files. Context-only unchanged files in the ZIP are not claimed changed.
Test-only indicates verification/support code rather than product implementation.

| Path | Change vs HEAD | Test-only | Role |
|---|---|---|---|
| `server/.env.example` | Modified | No | Environment template |
| `server/app.js` | New | No | Backend implementation |
| `server/config/AUTH_INTEGRATION.md` | New | No | Documentation |
| `server/config/database.js` | Modified | No | Backend implementation |
| `server/config/RSVP_SECURITY.md` | New | No | Documentation |
| `server/config/SESSION_FOUNDATION.md` | New | No | Documentation |
| `server/config/session.js` | New | No | Backend implementation |
| `server/config/sessionLogging.js` | New | No | Backend implementation |
| `server/config/sessionStore.js` | New | No | Backend implementation |
| `server/controllers/authController.js` | Modified | No | Backend implementation |
| `server/controllers/rsvpController.js` | Modified | No | Backend implementation |
| `server/integration/m4Browser.cjs` | New | Yes | Verification/support |
| `server/integration/m4Guard.cjs` | New | Yes | Verification/support |
| `server/integration/m4Host.cjs` | New | Yes | Verification/support |
| `server/integration/m4MongooseProbe.cjs` | New | Yes | Verification/support |
| `server/integration/m4Run.cjs` | New | Yes | Verification/support |
| `server/integration/README.md` | New | No | Documentation |
| `server/middleware/authMiddleware.js` | Modified | No | Backend implementation |
| `server/middleware/csrfMiddleware.js` | New | No | Backend implementation |
| `server/package-lock.json` | Modified | No | Dependency manifest/lock |
| `server/package.json` | Modified | No | Dependency manifest/lock |
| `server/README.md` | New | No | Documentation |
| `server/repositories/authRepository.js` | Modified | No | Backend implementation |
| `server/repositories/eventRepository.js` | Modified | No | Backend implementation |
| `server/repositories/sessionRepository.js` | New | No | Backend implementation |
| `server/routes/authRoutes.js` | Modified | No | Backend implementation |
| `server/routes/eventRoutes.js` | Modified | No | Backend implementation |
| `server/server.js` | Modified | No | Backend implementation |
| `server/services/authService.js` | Modified | No | Backend implementation |
| `server/services/rsvpService.js` | Modified | No | Backend implementation |
| `server/services/sessionPolicy.js` | New | No | Backend implementation |
| `server/tests/authController.test.js` | Modified | Yes | Verification/support |
| `server/tests/authHttp.test.js` | New | Yes | Verification/support |
| `server/tests/rsvpSecurity.test.js` | New | Yes | Verification/support |
| `server/tests/sessionFoundation.test.js` | New | Yes | Verification/support |
| `server/testSupport/sessionCollection.js` | New | Yes | Verification/support |
| `STAGE_2_1_HANDOFF.md` | New | No | Documentation |

External Vento-Codex documentation outside this repository:

- Modified VENTO_ROADMAP.md: record Stage 2.1 and prerequisite relationship to Stage 3.
- Modified CODEX_STAGE_3_PROMPT.md: consume approved cookie/CSRF contract and preserve
  agreed pages/popup/draft/autosave/retention requirements without starting implementation.
- New handoffs/STAGE_2_1_HANDOFF.md: exact mirror of this file.
- New dated final-review folder/ZIP: sanitized source, diff/inventory/dependency/results evidence.
- AGENTS.md was read and preserved, not changed. No automatic version control of the
  sibling folder or test infrastructure is assumed.

Milestone 5 changes only documentation plus the historical mounting comment in
server/config/session.js. That comment now correctly identifies app.js as the caller;
no JavaScript runtime logic, dependency, existing tests or product behavior changed.

## Architecture, alternatives and session lifecycle

Application pattern remains routes -> controllers -> services -> repositories -> models.
server.js reads configuration/connects Mongoose; app.js assembles Express using the
existing native client. Session configuration, store adapter and policy are separated
from event business logic. Models User/Event/RSVP were not changed by Stage 2.1.

Chosen: express-session 1.19.0 + connect-mongo 6.0.0 and MongoDB storage. Alternatives
considered: fully custom Mongoose session machinery (more security code to own),
Redis (additional infrastructure), and in-memory sessions (not restart/scaling safe).
The middleware choice is approved and retained. The adapter deliberately overrides
get/set/touch/destroy because stock touch/upsert behavior violates the activity and
revocation requirements. This maintenance responsibility is explicit, not concealed.

Trusted store.authenticate(req, verifyCredentials) verifies an active principal before
regeneration. Fresh successful authentication revokes the old identifier and creates
a different random 32-byte base64url identifier. Failed credentials do not rotate the
existing session; failed regeneration/issuance aborts and attempts to invalidate the
new ID. Only this trusted lifecycle authorizes creation; ordinary saves cannot insert.
Only fresh authentication starts a new 30-day lifetime; no separate periodic rotation
without reauthentication is implemented.

vento_sessions stores _id=SHA-256(raw ID), policy-owned vento metadata (userId,
authenticatedAt,lastActivityAt,absoluteExpiresAt,revokedAt), expires, cleanupAt and
an allowlisted session payload. Raw IDs are not stored in standard payloads/database
keys or JSON. Cookie and CSRF fields are validated; arbitrary nested fields are ignored
or rejected. MongoDB's unique _id index rejects duplicates while retained records exist.

Idle deadline = last accepted customer activity + seven days.
Absolute deadline = successful authentication + 30 days, immutable.
Effective expiry = earlier of these deadlines. At/beyond either, get/save/renew reject.
Passive /me/polling and ordinary saves/touches never extend activity. A controlled
CSRF-protected activity endpoint accepts renewal at most once/minute; physical actions
inside that interval are not separately stored, giving a near-one-minute precision
trade-off. Frontend must not send unattended activity heartbeats or autosave renewals.

Save uses valid/nonrevoked filters and an activity revision guard, with no upsert.
Renewal uses a conditional atomic pipeline, no upsert, and never changes original auth
or absolute timestamps. Logout marks the record revoked. Revocation is the only upsert
path and creates an unauthenticated marker for a missing ID, blocking a later insert.
In-flight already-authorized operations cannot be undone by logout. Finite native
race tests passed; replica rollback/partitions/all possible schedules are not proven.

cleanupAt starts at the absolute deadline; revocation retains markers at least 30 days
after revocation. It is not an auth extension. Any future approved TTL must target
cleanupAt, not expires. Cleanup/TTL remains disabled; no event/account/RSVP cleanup is
associated with session expiry. Eventual deletion cannot preserve ID history forever;
trusted auth always generates a fresh random ID rather than reusing client input.

## Cookie, CSRF, CORS and environment configuration

Production session cookie: __Host-vento.sid; HttpOnly, Secure, SameSite=Lax, Path=/,
no Domain; persistent expiry capped by policy. Development: vento.sid.dev, HttpOnly,
SameSite=Lax, Path=/, non-Secure for local HTTP. The bootstrap CSRF cookie follows
the same environment rules (__Host-vento.csrf / vento.csrf.dev), with 15-minute expiry.
Cross-site SameSite=None hosting is not enabled. Real production TLS/cookie behavior
has not been independently verified; earlier HTTP tests simulate an explicit TLS proxy.

Anonymous CSRF bootstrap returns a short-lived, signed double-submit token and matching
HttpOnly bootstrap cookie; after auth, an independent random hex token is stored in the
session. Origin, JSON and constant-time CSRF comparisons protect auth/private mutations.
Tokens change on fresh authentication. Frontend may keep CSRF in memory but must never
store session IDs, passwords or auth credentials in localStorage/sessionStorage.

CORS uses exact configured origins and credentials:true; explicit unapproved origins
are rejected. Protected/auth mutations require an allowed Origin even when CORS alone
would not stop a nonbrowser client. Public RSVP POST is deliberately session/CSRF-free.
Auth/private responses use Cache-Control:no-store. Global JSON size is 32kb.

| Variable | Required meaning |
|---|---|
| MONGODB_URI | Explicit approved application environment; not an integration fallback. Never assume an existing URI targets a safe test database. |
| SESSION_SECRET | Random >=32-byte signing secret, consistent across API instances. Never commit/log real values. |
| FRONTEND_ORIGINS | Comma-separated exact origins without trailing slash; HTTPS required in production. |
| NODE_ENV | production enables Secure host cookies/guards; development explicitly supports local HTTP. |
| TRUST_PROXY_IPS | Optional actual trusted proxy IPs/CIDRs; default false, never blanket trust. |
| PORT | API port; defaults 5000. |
| DEBUG | Unset or exclude express-session/connect-mongo; production guard refuses their enabled namespaces. |
| VENTO_M4_TEST_URI | Manual integration scripts only; approved exact loopback port and vento_m4_ database prefix; never reads dotenv/MONGODB_URI. |

.env.example contains empty/template values only. Real .env was never copied into
reports/ZIP. Owner configured the runtime environment; this documentation pass did
not read/change it. Startup errors are sanitized. Access/proxy/error logs must redact
Cookie, Set-Cookie, Authorization, secrets, CSRF and auth bodies; the app adds no access
logger. Deployment-specific log/proxy inspection remains future work.

## HTTP API contracts and protected operations

All private/auth frontend fetches use credentials:'include'. Send JSON and X-CSRF-Token
on mutations; send {} for otherwise bodyless activity/logout/publish. Safe user payload
is {id,name,email}; response bodies never include passwordHash, JWT or raw session ID.

| API | Inputs / success | Rejections / effects |
|---|---|---|
| GET /api/auth/csrf | {success:true,csrfToken}; anonymous signed bootstrap cookie or current session token | Disallowed Origin 403; store failures generic 503. Does not authenticate or renew activity. |
| POST /api/auth/register | {name,email,password}; 201 {success:true,user,csrfToken}, persistent session cookie | CSRF/Origin 403; missing/blank required fields or password shorter than 8 -> 400; duplicate email detected -> 400; unexpected storage/auth failure generic 500. Password hashed with bcrypt cost 12. |
| POST /api/auth/login | {email,password}; 200 safe user/CSRF, new cookie and lifetime | Input 400, bad credentials 401, inactive account 403, CSRF/Origin 403, unexpected failure generic 500. |
| GET /api/auth/me | 200 {success:true,user,csrfToken}; account checked on every protected request | Missing/expired/replayed session 401; inactive/deleted account 403 with revocation; store/account errors generic 503. No idle renewal. |
| POST /api/auth/activity | {}; 200 {success:true,renewed,expiresAt}, explicit cookie delivery | Auth/CSRF required; expired session 401; errors generic 503. renewed:false can indicate throttle/concurrent winning renewal. |
| POST /api/auth/logout | {}; 200 {success:true}, await revocation then clear cookie | Auth/CSRF required; no/replayed/expired session 401 (not an anonymous idempotent endpoint); errors generic 503. |
| POST /api/events | Existing editable event fields; 201 {success:true,data} | Session + CSRF; server sets owner, ignores supplied owner/status/slug. |
| GET/PUT /api/events/:id | Private read / editable-field update | Session; PUT also CSRF; owner-filtered queries. Other owner gets 404. |
| PUT /api/events/:id/publish | {} -> saved event publication | Session + CSRF + owner. Existing slug logic preserved. |
| GET /api/events/slug/:slug | Published event only, public | Missing/nonpublished -> 404; no login required. |
| POST /api/events/:eventId/rsvps | Approved guest fields -> 201 {success:true,data}, public | ID/input 400, missing/nonpublished 404, unexpected storage 503. No account or CSRF required. |
| GET /api/events/:eventId/rsvps | 200 {success:true,data:[...]}, owner only | Session/active account; other owner/missing -> 404; malformed authenticated ID 400; unexpected storage 503. |

Auth email is normalized lowercase; passwords are not silently trimmed. Existing
validation is not represented as comprehensive account-abuse protection. JSON parser
errors return 400/413. Registration may create an account before session insertion
fails; recover via login rather than deleting the account. Ambiguous RSVP insertion
failures can have persisted; no automatic blind retry/idempotency guarantee.

JWT cutover is complete in protected middleware: Authorization:Bearer does not
authenticate. Existing JWT clients must log in again. JWT_SECRET is unused for auth;
jsonwebtoken remains for legacy rejection tests and future approved dependency cleanup.
No dual-mode fallback, token exchange, refresh-token subsystem or auth credentials in
JSON/browser storage were introduced. My Invitations owner-list endpoint is still missing.

## Event ownership and RSVP contract

Existing account status checks, server-owned event identity and owner-filtered private
read/update/publish/response listing remain. UI route guards cannot replace server checks.
No event/RSVP model migration or existing record rewrite occurred.

RSVP route ID must be exactly 24 hexadecimal characters and is canonicalized lowercase.
Only guestName/status/guestCount/optional message are persisted; event/owner/_id and
timestamps supplied in the body are ignored. guestName is trimmed, <=200 UTF-16 code
units, contains a Unicode letter/number and no ASCII controls. Status is attending or
not-attending. guestCount is a numeric safe integer: attending >=1; declining exactly 0.
Optional message must be a string, trimmed <=2000 code units; empty allowed; newline/tab
allowed but other ASCII controls rejected. No string/boolean/null count coercion.

Published-event lookup occurs before new insertion. Owners can still read historical
responses for draft/private events. Publication-check/insertion race is reproduced:
an administrative unpublish between lookup and insert can still allow the RSVP. It is
NOT fixed; current product routes have no unpublish/delete endpoint. No complex locking
or transaction design was introduced without approval. Future unpublish/deletion work
must reassess this race. No capacity, guest links/passwords, payments or upload features.

## Dependencies and security correction

| Installed component | Version / change |
|---|---|
| Mongoose | Exactly 9.11.4; approved correction from 9.10.1 |
| kareem / mquery | 3.4.1 / 6.0.1, required by corrected Mongoose |
| MongoDB driver | Direct 7.6.0 for connect-mongo; nested Mongoose driver 7.7.0 |
| express-session / connect-mongo / Express | 1.19.0 / 6.0.0 / 5.2.1 |
| proxy-addr / body-parser | Approved compatible fixes 2.0.8 / 2.4.0 |
| qs / brace-expansion | 6.16.1 (explicit override) / 5.0.12 |
| minimatch / nodemon | 10.2.6 / 3.1.14; two moderate dev package findings remain |

No unrelated version upgrades were required for Mongoose: kareem, mquery and its nested
driver were the only additional changed dependency paths. Direct driver, Express and
session packages remained. Two prior Mongoose probes changed from vulnerable:true on
9.10.1 to blocked on 9.11.4: connection-level sanitizeFilter rejects the operator input
(with a legitimate-query control), and unsafe Schema.virtual paths no longer write
prototype properties. No Vento remote auth bypass was demonstrated by the earlier
library reproductions. Other Mongoose advisory payloads were not individually tested;
the vendor-fixed package no longer appears in the production audit.

## Actual test evidence and reproduction commands

| Evidence class | Actual result | Scope / limitation |
|---|---|---|
| M5 fresh existing suite | 59 pass, 0 fail/cancelled/skipped/todo | 41 unit/service/query-construction + 18 real localhost HTTP with mocked persistence. |
| Accepted M4 correction real suite | 17 pass, 0 fail | MongoDB 8.0.38, Mongoose 9.11.4, drivers 7.6/7.7; one pass intentionally reproduces the known RSVP race. |
| Native concurrency within real suite | 50 logout/save/renew + 25 first-insert/revoke iterations passed | Actual clients, conditional Mongo queries; not mathematical proof for every failure/interleaving. |
| Multi-process / restart within real suite | Passed | Two API processes, simultaneous requests, API-process restart persistence, cross-process logout replay. |
| Patched Mongoose probes | Both protected behaviors asserted, exit 0 | Isolated process/collection; not a general remote-exploit audit. |
| Browser (M4 before correction) | Nine observations passed | Local real browser + real Mongo; not rerun for dependency-only correction or M5 docs. |
| Audit after correction / M5 fresh | Zero production; two moderate development package findings | Current npm database snapshot, not permanent vulnerability guarantee. |
| git diff --check | Passed | Windows LF/CRLF notices are informational. |

Commands actually used (root unless noted):

    npm --prefix server test
    npm --prefix server audit --json
    npm --prefix server audit --omit=dev --json
    npm --prefix server ls mongoose mongodb connect-mongo express express-session kareem mquery --all
    git diff --check

Manual real tests from M4, NOT rerun in this documentation-only milestone:

    $env:VENTO_M4_TEST_URI='mongodb://127.0.0.1:37147/vento_m4_20261115_verified_http_failure'
    node server/integration/m4Run.cjs
    node server/integration/m4MongooseProbe.cjs

Browser harness previously started with a dedicated approved vento_m4_ browser DB:

    node server/integration/m4Browser.cjs

Only run manual integration scripts with an explicitly approved isolated environment.
Guard rejects absent/remote/SRV/credentials/query options/other ports/non-test DB names;
it never reads dotenv or MONGODB_URI. Child app secrets travel via IPC. Test clocks
simulate days; no seven-/30-day waits. Generated passwords/keys/IDs stay out of output.
Actual setup commands, failures and corrected assertions are preserved in prior M4
reports. Initial TTL parsed-type and empty-cookie scanner failures were test-only
defects, not application security regressions; correction results are retained.

Real-suite coverage includes register/login, invalid/inactive/deleted accounts, /me,
CSRF/CORS/JWT rejection, ownership, RSVP valid/invalid writes, hash/uniqueness, exact
expiry, renewal/throttle/passive reads, revocation races, process restart, closed-client
failure/HTTP 503/new-client recovery, safe response/log scans and absence of TTL/custom
indexes. It uses native operations/models, not collection doubles.

Browser observations: synthetic registration; HttpOnly cookie invisible to document.cookie;
refresh; rejected CSRF; shared tabs/cross-tab logout; clock-driven expiry; reauth;
unapproved origin network rejection; close/reopen tabs retaining a valid session.
Tab reopen is NOT full browser-context restart. Origin rejection alone does not isolate
SameSite behavior. Final browser test session was logged out; harness stopped.

## Environment/data impact and outstanding risks

Portable official MongoDB Community 8.0.38, SHA256 verified, runs only on approved
127.0.0.1:37147. Binaries/config/log/data retained at
C:/Users/ASUS/Desktop/SE-Projects/SE-Jordan/Vento-Codex/test-infrastructure/milestone4/.
No Windows service installed. M4 used only dedicated vento_m4_* databases and synthetic
records; data was deliberately retained, not dropped/deleted. No Atlas/customer-data
access, destructive migration or production deployment occurred. M5 touches no database.
Only implicit _id indexes arose on synthetic collections; custom indexes/TTL were not
enabled. Runtime autoIndex/autoCreate remain false; deployed index health is unverified.

Explicitly retained limits:
1. RSVP publication-check/insertion race reproduced and unfixed.
2. Full browser-context restart unverified.
3. Real HTTPS/Secure-cookie and independent SameSite isolation unverified.
4. Two moderate dev dependency findings (one minimatch advisory inherited via nodemon).
5. Public RSVP abuse/rate limiting, duplicate/idempotency work and deployment-specific
   logging/proxy checks remain future work.
6. MongoDB session cleanup/TTL remains disabled. No deletion permission inferred.
7. Standalone local tests do not prove Atlas replication/failover, rollback, partitions,
   service crash durability, majority-write behavior or all clock-skew schedules.
8. Auth-service generic 500 vs middleware 503 are current contracts, not silently unified.
   Account-created/session-failed recovery and ambiguous insert retry behavior remain.
9. No frontend E2E customer journey, deployment, new theme/payment feature or performance
   certification is claimed. Current frontend still requires Stage 3 integration.

## Stage 3 frontend handoff — requirements preserved, not implemented

Wait for comprehensive Stage 2.1 review/integration and explicit Stage 3 approval.
Preserve the existing Stage 3 branch; do not reset/recreate it. Refresh its base only
through an approved Git plan after Stage 2.1 integration.

- Dedicated login/signup pages and a login/signup popup preserving guest edits.
- Cookie/CSRF fetch helper with credentials:'include'; /me restores customer state after
  refresh; in-memory CSRF is refreshed after auth. No stored auth token/credentials.
- Clear loading/error/empty and expiry UX. A 401 preserves unsaved edits, returns to
  authentication and avoids automatic replay of writes. Missing/inactive/other-owner
  states handled distinctly. Logout clears private caches across the app.
- Anonymous editor/live preview independent of database saves. Temporary guest progress
  in browser-tab sessionStorage only for draft content, never credentials; define privacy
  and recovery details in the approved frontend design.
- Account-backed autosave. Only genuine customer interaction may renew activity; background
  autosave/polling alone must not defeat idle expiry.
- Agreed unpaid draft lifecycle: 30 inactive days plus seven-day recovery, protecting paid
  and published invitations. Not implemented in Stage 2.1. Approve data/lifecycle/cleanup
  design separately; never couple invitation deletion to authentication timeouts.
- Owner-only save/edit/publish/RSVP list and My Invitations. Owner list endpoint is absent;
  add it server-scoped only in an approved milestone. Do not trust client-side owner filters.
- Public RSVP decline UI must send guestCount:0; current default count 1 on decline will
  be rejected. Numeric/length validation errors must be presented clearly.
- Preserve mobile, Arabic/English RTL/LTR, language/theme selection and public guest access.
  Payments/coupons/AI/cloud media/unrestricted builder/deployment remain outside Stage 3.

## Manual verification path and safe prerequisites

Review only sanitized docs/templates first. Ensure an approved isolated URI/config before
starting any server; npm start otherwise uses the configured application database. Do not
reuse Atlas implicitly. Start no infrastructure, custom indexes or cleanup without approval.

In the approved synthetic environment: bootstrap CSRF; register/login; inspect safe /me;
create event as A; ensure B cannot read/update/publish/list responses; publish as A; view
public slug; submit public RSVP with route-authoritative ID and valid count; decline with
zero; verify owner listing; reject draft/invalid input; logout then replay cookie -> 401;
simulate expiry using approved clock harness and reauthenticate. Do not print cookies or
passwords while testing. Real browser restart/TLS/SameSite checks still need a safe plan.

## Authorized Git finalization plan — merge NOT authorized

1. Owner comprehensively reviews the ZIP, exact allowlist/inventory, runtime contracts,
   known risks and sanitized diffs. Decide whether any follow-up is required first.
2. Commit approval was received 2026-11-16; stage only reviewed repository files (never .env,
   infrastructure/data/logs, archives or secrets), inspect staged diff and secret exclusions.
   Recommended two coherent commits: backend/dependencies/tests; then docs/source-comment/
   handoff. One combined stage commit is simpler but separates review intent less clearly.
3. Vento-Codex is outside this Git root. Version its docs only through an explicitly
   approved location/workflow; do not git-init/move files automatically. Root handoff is
   the branch-contained copy. Preserve the owner's existing formatting/uncommitted work.
4. Before publication, with approval fetch remote state and compare updated foundation.
   Resolve any integration conflicts with reviewed code; do not force/reset user work.
5. Feature push and PR creation were approved 2026-11-16 for feature/stage-2-session-rsvp-hardening,
   targeting stage-2/foundation, with owner-controlled merge requiring separate approval.
   Never direct-push main/foundation or auto-merge. No deployment permission inferred.
6. After integration, approve Stage 3 plan and branch synchronization separately. No
   automatic new stage or further infrastructure cleanup is authorized by this handoff.

## Executed test names (evidence index)

### Existing suite — npm --prefix server test; all 59 PASS in M5

- PASS: registration rejects missing, blank, and whitespace-only required fields
- PASS: registration trims name and email and accepts an eight-character password
- PASS: login rejects missing, blank, and whitespace-only email or password
- PASS: login trims email and leaves the password unchanged
- PASS: HTTP registration sets persistent HttpOnly cookie; me restores safe state without renewal
- PASS: HTTP login accepts correct credentials, rejects wrong credentials and inactive users
- PASS: HTTP registration rejects invalid/duplicate input and CSRF-free login or registration
- PASS: HTTP logout rejects bad CSRF, revokes on success, and rejects captured cookie replay
- PASS: HTTP activity enforces CSRF, renews cookie with fixed absolute cap and rejects expiry
- PASS: HTTP seven inactive days rejects the session even while its record remains
- PASS: HTTP CORS allows configured credentialed origin and rejects other/missing mutation origins
- PASS: HTTP owner isolation, mutation CSRF, server-owned identity and legacy JWT rejection
- PASS: HTTP store/account errors fail closed without leaking raw errors
- PASS: HTTP session cookie tampering and expired/forged bootstrap CSRF are rejected
- PASS: HTTP login rotates sessions, rejects old cookies and old CSRF, and deleted users lose access
- PASS: HTTP logout store failure returns service error and registration insert failure never authenticates
- PASS: HTTP production headers contain Secure host cookies behind an explicitly trusted TLS proxy
- PASS: HTTP parsing errors are bounded and do not leak request body or crash the server
- PASS: RSVP service canonicalizes route ID and whitelists fields without editing existing records
- PASS: malformed RSVP IDs reject before any repository operation
- PASS: guest fields reject coercion, missing values, arrays and unsupported statuses
- PASS: declining means exactly zero; positive safe-integer attendance has no capacity limit
- PASS: trimmed name/message length boundaries and optional message are explicit
- PASS: missing and nonpublished events never receive RSVPs
- PASS: real event repository queries both authoritative ID and published status
- PASS: HTTP public submissions need no account or CSRF and ignore forged event relationships
- PASS: HTTP malformed IDs, invalid input and missing/unpublished events have predictable errors
- PASS: HTTP RSVP listing remains authenticated and owner-only, with ID validation
- PASS: HTTP database errors are sanitized for lookup, insert and private listing
- PASS: rejects exactly seven inactive days, before TTL cleanup
- PASS: day-29 activity caps expiry at day 30 and cannot revive at the boundary
- PASS: passive reads, store touches and ordinary saves never renew activity
- PASS: dedicated activity renewal is throttled and never writes during the interval
- PASS: revocation blocks delayed saves, touches, renewals and identifier reuse
- PASS: logout between save validation and write wins atomically
- PASS: logout between activity validation and update cannot be undone
- PASS: parallel renewals perform one update and stale saves cannot undo renewal
- PASS: only explicit fresh authentication with a new ID starts a new lifetime
- PASS: session records contain hashed IDs and whitelisted payloads only
- PASS: malformed policy metadata fails closed
- PASS: database errors propagate through get/save/renew/logout without granting access
- PASS: middleware hydration pins automatic cookie touches to the approved date
- PASS: foundation config uses real middleware with no database cleanup or HTTP mounting
- PASS: middleware regeneration revokes the old identifier without creating a new lifetime
- PASS: pre-insert revocation creates a durable marker and defeats delayed creation
- PASS: revocation retention is independent from idle expiry; deleted IDs cannot be saved
- PASS: cookie allowlist drops nested extras and rejects invalid supported attributes
- PASS: CSRF storage accepts independent random hex and rejects identifiers or nested input
- PASS: trusted authentication verifies before regeneration and uses only a new generated ID
- PASS: credential failures and disabled principals never regenerate or create authentication
- PASS: regeneration error and invalid/reused regenerated IDs never issue authentication
- PASS: authentication insert failure leaves no usable request session and revokes issuance
- PASS: concurrent authentication attempts on the same request are rejected
- PASS: unsafe production debug is rejected both at construction and per request
- PASS: regeneration that generates an ID then fails leaves a revoked issuance and no request session
- PASS: failure after insertion revokes the new record rather than leaving usable credentials
- PASS: production environment cannot select insecure development session configuration
- PASS: connect-mongo debug namespace is independently blocked in production
- PASS: failed revocation during failed issuance propagates and cannot return authentication success

### Accepted M4 real suite — node server/integration/m4Run.cjs; 17 PASS

- PASS: real session creation, hashed identity, unique-ID rejection and retrieval
- PASS: exact idle expiry rejects even with retained Mongo record
- PASS: native renewal pipeline, throttle and nonrenewable day-30 deadline
- PASS: pre-insert revoke creates real Mongo unique tombstone that blocks issuance
- PASS: two independent clients: concurrent logout/save/renew cannot resurrect records (50 races)
- PASS: real concurrent first insert/revoke leaves no authorized record (25 races)
- PASS: real HTTP registration, login and safe me response
- PASS: real HTTP passive requests do not update activity; cookie renewal throttle
- PASS: real HTTP CSRF, CORS and legacy bearer rejection
- PASS: real event ownership read/update/publish and owner-only RSVP listing
- PASS: real public RSVP insertion, route authority and invalid input rejection
- PASS: known publication-check/insertion race reproduced without adding transactions
- PASS: real two-process persistence and cookie authorization after server restart
- PASS: real disabled/deleted accounts lose authorization; logout replay and expiry fail
- PASS: real closed-client store fails securely and new-client recovery preserves DB session
- PASS: API bodies and captured child application logs contain no session identifiers/passwords/secrets
- PASS: no custom indexes or TTL indexes were enabled

### Historical M4 browser observations — nine PASS, two verification gaps

- PASS: Synthetic registration returns 201 and browser sends the session cookie
- PASS: HttpOnly session cookie not visible through document.cookie
- PASS: Page refresh restores session with HTTP 200
- PASS: Invalid CSRF activity request returns 403
- PASS: Second tab shares session; logout makes original tab return 401
- PASS: Controlled seven-day inactivity makes browser request return 401
- PASS: Reauthentication after expiry returns 200
- PASS: Unapproved localhost origin produces browser network rejection
- PASS: Closing and reopening test tabs retains valid authentication

- NOT VERIFIED: Independent browser-context/process shutdown and restart with persisted profile
- NOT VERIFIED: Actual browser TLS/Secure-cookie operation and independent SameSite cross-site cookie exclusion

### Patched probe — node server/integration/m4MongooseProbe.cjs

- PASS: connection-level sanitizeFilter blocks operator payload; legitimate query control succeeds.
- PASS: unsafe virtual path rejected and prototype property absent.

## PASTE INTO MAIN VENTO CHAT

Vento Stage 2.1 (Persistent Sessions & Public RSVP Security) handoff, 2026-11-16.
Branch feature/stage-2-session-rsvp-hardening; base
33becd957770ed2054e5e9301079c7aac9e7e3f9 on stage-2/foundation. Milestones 1–5 and
comprehensive review accepted. Commit/push/PR finalization is authorized; actual
commit IDs/PR/check receipt will be appended to the external handoff after creation.
Merge and deployment are not authorized. Existing feature/stage-3-client-auth is preserved at base.

Backend now uses express-session 1.19.0/connect-mongo 6.0.0 with hashed IDs, revocation,
trusted issuance and explicit activity policy. Persistent HttpOnly cookies; seven-day
idle and immutable 30-day absolute limits, with one-minute accepted-activity precision.
Fresh login/register rotates ID; logout revokes server-side. /api/auth/csrf, /me,
/activity and /logout integrate CSRF/exact-origin credentialed CORS. Bearer JWTs no
longer authenticate; safe auth JSON contains user/CSRF, not credentials. Existing
active-account and server-owned event/RSVP-list ownership checks remain.

Public RSVP route ID is authoritative, requires existing published event, validates
approved fields, and sanitizes DB errors. Counts: attending positive safe integer,
declining exactly zero; names <=200 and message <=2000 UTF-16 units. No existing
records migrated/deleted. Mongoose corrected/pinned 9.11.4 with required kareem 3.4.1,
mquery 6.0.1 and nested driver 7.7.0; direct driver 7.6.0 retained. Last audits: zero
production findings, two moderate development package findings minimatch/nodemon.

Evidence: fresh 59 unit/mocked-persistence HTTP tests pass; accepted M4 correction
17 real-MongoDB/HTTP checks pass (75 native race iterations, two API processes,
API-process restart, account/ownership/RSVP/CSRF/error checks); patched Mongoose probes
block both reproduced behaviors. Nine M4 browser observations passed before the
dependency correction. Approved local MongoDB 8.0.38 on 127.0.0.1:37147; synthetic
data/binaries/logs retained outside repo. No Atlas/customer-data access, TTL/custom
indexes or destructive migrations. M5 edits docs and one historical source comment,
not runtime behavior. Handoff exists in repository root and Vento-Codex/handoffs.

Explicit limits: known RSVP publication-check/insert race reproduced NOT fixed;
full browser-context restart, real HTTPS/Secure-cookie and independent SameSite
isolation unverified; dev advisories remain; public abuse/rate limiting and production
logging/proxy/replica-set checks deferred; cleanup/TTL disabled. Not a deployment or
production-readiness approval. Review ZIP includes exact inventory/source/tests/docs,
sanitized diffs/dependencies and original evidence, excluding real .env/secrets/raw
cookies/database files/raw logs. Approve commits/push/PR/merge separately.

Stage 3 is not implemented: integrate cookie/CSRF fetch and /me, dedicated auth pages
and draft-preserving popup, guest live preview/tab sessionStorage, account autosave,
My Invitations with missing owner-list endpoint, and agreed unpaid-draft 30-day idle
plus seven-day recovery protecting paid/published invitations. These lifecycle rules
are separate from auth expiry and need approved design before cleanup. Adapt decline
UI to zero count, preserve mobile/RTL/LTR. Persistent register: ../Vento-Codex/VENTO_OUTSTANDING_ISSUES.md (VENTO-001–025). Stage 3 publication remains provisional until Stage 6 checkout and publishing entitlements, including zero-JOD orders. No automatic merge, Stage 3 implementation or test-data deletion is authorized.
