# Vento backend — Stage 2.1 review guide

Stage 2.1 implements persistent, revocable cookie sessions and public RSVP security.
Final comprehensive review and Git approval are pending. No Stage 3 UI was added.

## Documentation map

- `../STAGE_2_1_HANDOFF.md`: complete stage summary, inventory, evidence and approval plan.
- `config/SESSION_FOUNDATION.md`: session storage/lifecycle/concurrency and retention.
- `config/AUTH_INTEGRATION.md`: API, cookie, CSRF, CORS and environment contract.
- `config/RSVP_SECURITY.md`: strict public input contract and known publication race.
- `integration/README.md`: isolated real-Mongo/browser/advisory verification scripts.
- `../../Vento-Codex/VENTO_ROADMAP.md`: project sequence and deferred Stage 3 work.

## Architecture and runtime

`server.js` loads environment configuration, connects Mongoose and passes its native
client to `app.js`. `app.js` assembles Express without connecting by itself, enabling
isolated HTTP tests. Route -> controller -> service -> repository -> model remains
the application pattern. Session configuration/store/policy responsibilities are
separate from event/RSVP business logic.

Pinned security foundation: Mongoose 9.11.4, express-session 1.19.0, connect-mongo
6.0.0, direct MongoDB driver 7.6.0; Mongoose requires its nested driver 7.7.0,
kareem 3.4.1 and mquery 6.0.1. Exact installed versions are in package-lock.json.
Express remains 5.2.1. The last correction audit has zero production findings and
two moderate development package findings (minimatch/nodemon), not yet remediated.

Mongoose autoIndex/autoCreate and session cleanup/index setup are disabled. Any
required production index review/migration remains separately approved work.
Session expiration never deletes saved invitations or guest responses.

## Environment (template, never real values in documentation)

Use `.env.example` as the template. Configure only an explicitly approved database;
never assume an existing MONGODB_URI is safe for testing. `npm --prefix server start`
starts the API against that configured database; it is not an isolated-test command.

| Variable | Meaning |
|---|---|
| MONGODB_URI | Explicit approved application database connection; never reused by integration scripts implicitly. |
| SESSION_SECRET | Random secret with at least 32 bytes, identical across API instances. Do not commit or log it. |
| FRONTEND_ORIGINS | Comma-separated exact origins without trailing slash. HTTPS required in production; e.g. local dev origin http://localhost:5173. |
| NODE_ENV | production for Secure host cookies; development for local non-Secure dev cookies. |
| TRUST_PROXY_IPS | Optional exact actual proxy IPs/CIDRs; default false. Never use blanket trust. |
| PORT | API port, defaults to 5000. |
| DEBUG | Unset, or explicitly exclude express-session/connect-mongo. Production guard rejects sensitive debug namespaces. |

JWT_SECRET is no longer consumed for authentication. jsonwebtoken remains installed
for rejection tests and separately reviewed dependency cleanup; no bearer fallback.
The repository contains no real session secret or database credentials.

## Client integration essentials

All frontend auth/private fetches must use credentials:'include'. GET /api/auth/csrf
before login/register; retain returned CSRF token in memory; replace after successful
authentication. GET /api/auth/me restores safe customer state and CSRF after refresh.
Private/auth mutations require configured Origin, JSON, X-CSRF-Token. Send {} on
activity/logout/publish. Never store auth credentials in localStorage/sessionStorage.

Only user interaction may trigger POST /api/auth/activity. Polling, passive /me and
unattended autosave timers must not keep sessions alive. Seven-day idle and immutable
30-day absolute deadlines are server-enforced, with one-minute accepted-renewal
precision. Logout revokes server-side; expired/replayed sessions return 401.

Public invitation lookup and RSVP submission remain account-free. RSVP decline must
send numeric guestCount:0; attending must send a positive safe integer. The current
frontend still needs its approved Stage 3 integration and decline-form adaptation.

## Testing and evidence boundaries

Run existing isolated-memory tests:

    npm --prefix server test

59 cases: 41 unit/service/query-construction and 18 actual localhost HTTP requests
with mocked persistence. Loopback permissions may require escalation in restricted
execution environments. This command never loads application .env or connects Atlas.

Additional real-DB verification is manual, only with approved infrastructure:

    $env:VENTO_M4_TEST_URI='mongodb://127.0.0.1:37147/vento_m4_20261115_verified_http_failure'
    node server/integration/m4Run.cjs
    node server/integration/m4MongooseProbe.cjs

Guard requires precisely the approved loopback host/port and vento_m4_ database name;
no credentials/options/SRV/remote URI and no MONGODB_URI fallback. Scripts create
synthetic records; do not run without the applicable database-write approval.
MongoDB must already be running with the retained isolated config. Nothing is dropped.

Historical accepted M4 evidence: 17 real-DB/HTTP checks including 75 race iterations,
API-process restart/shared sessions and error recovery; two patched advisory probes;
nine browser observations before the Mongoose correction. Real browser context restart,
real HTTPS/Secure-cookie and independent SameSite isolation remain unverified.
The known published-check/RSVP-insert race is reproduced, not fixed. TTL is disabled.

Optional read-only dependency checks:

    npm --prefix server ls mongoose mongodb connect-mongo express-session --all
    npm --prefix server audit
    npm --prefix server audit --omit=dev

Audit findings are time-sensitive; retain actual command output. Do not run audit fix
or upgrade dev-tool majors without separate authorization. Do not expose Cookie,
Set-Cookie, Authorization, CSRF, secrets, auth bodies or database diagnostics in logs.
