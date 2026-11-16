# Stage 2.1 Milestone 4 isolated verification

These scripts do not load dotenv, do not use MONGODB_URI, and are deliberately not
part of automatic npm test discovery. They are manual integration resources.

Before running, obtain owner approval for the local MongoDB process and synthetic
database writes. Never use Atlas or existing Vento databases. The URI guard accepts
only mongodb://127.0.0.1:37147/vento_m4_<lowercase-alphanumeric-or-underscore> with no
credentials, options, hostname aliases, remote hosts or fallback. A unique database
name per execution preserves earlier fixtures; there is no drop/delete cleanup.

PowerShell example, only with approved infrastructure:

    $env:VENTO_M4_TEST_URI='mongodb://127.0.0.1:37147/vento_m4_example_run'
    node server/integration/m4Run.cjs

The runner verifies actual MongoDB bind/port, server 8.0, disabled TTL, and disabled
automatic index setup before testing. Uses fake clocks for policy and actual local
MongoDB operations, multiple clients and separate application processes. Child
configuration/secrets travel by IPC, not command arguments or environment logs.
Passwords/signing secrets/IDs are generated in memory. Output records case names,
PASS/FAIL and error classes only. Data is retained. Real failure details must not be
dumped casually because driver/HTTP diagnostics may contain secrets.

The known publication-check/insert race is a reproduction check: PASS means the
limitation was demonstrated, not that publication and insertion are atomic.

m4Browser.cjs starts a temporary front-end at 127.0.0.1:38148 and API at :38149 using
only a guarded local database. It is not product UI. Use only with synthetic data.
Its advance-clock endpoint changes only the in-memory test clock. Stop the harness
after verification and preserve the local MongoDB data. Do not install certificates
or change browser security settings to test TLS without separate approval.

m4MongooseProbe.cjs checks the two dependency advisory payloads in a separate Node
process and isolated synthetic collection. Before the correction, 9.10.1 ignored
connection sanitization and wrote a harmless process-prototype property (archived
results in the first M4 package). The corrected probe requires exactly 9.11.4 and
asserts both vulnerable behaviors are absent, allowing the expected CastError for
the sanitized operator query and rejection of the unsafe virtual path. It first
checks a legitimate query as a control. Never import this probe in application or
shared test runtime, and never run it in production. Library reproduction alone
does not prove remote exploitability through Vento's whitelist boundaries.

No script installs infrastructure, starts mongod, enables TTL, creates custom indexes,
deletes records, or modifies application implementation. Standard MongoDB implicit
_id indexes arise with newly written synthetic collections. The external infrastructure
folder contains the approved mongod config, official checksum manifest and retained
database/log files. Those data files and raw logs must never go into a review ZIP.
