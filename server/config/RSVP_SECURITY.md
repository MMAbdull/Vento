# Stage 2.1 Milestone 3 — public RSVP contract

POST /api/events/:eventId/rsvps remains public, without authentication or session
CSRF. Existing exact-origin CORS restrictions and JSON body size limits still apply.
The route event ID is authoritative: a strict 24-hex ObjectId-shaped string,
canonicalized to lowercase. Body-supplied event/owner/IDs/timestamps and unknown
fields are ignored and cannot change the stored relationship.

Approved body fields:

| Field | Rule |
|---|---|
| guestName | String, trimmed, 1–200 UTF-16 code units after trimming, containing at least one Unicode letter or number. Control characters are rejected. Arabic and single-character names work. |
| status | Exactly attending or not-attending. |
| guestCount | JSON number, safe integer. Attending requires >=1; not-attending requires exactly 0. No capacity or entitlement limit is introduced. |
| message | Optional string; if supplied, trimmed length <=2000 UTF-16 code units. Empty string permitted. Null/objects/numbers rejected. Tab/newline permitted; other ASCII controls rejected. |

No coercion from string counts, booleans or null is allowed. All validation occurs
in rsvpService before any event read or insert. The event repository queries both
_id and status:published before creation; missing, draft, unpublished and deleted
targets cannot receive RSVPs through this API.

Responses retain {success,data} for 201 creation. Errors use {success:false,message}:
400 for invalid fields or malformed ID, 404 Event not found for missing/nonpublished
targets, 503 Unable to submit RSVP for unexpected storage failures. Raw database
messages and supplied error statusCode values are not trusted. Existing global JSON
parser errors remain 400/413; disallowed origins remain 403.

GET on the same path remains session-authenticated, active-account and owner-only.
No authentication returns 401, inactive account 403, other owner/missing event 404,
malformed ID after authentication 400, storage failure 503 with generic text.
An owner may list historical responses on a private/draft event; the published-only
requirement applies to new public submissions, not owner access to existing data.

Stage 3/5 client impact: send numeric counts, and explicitly set count to zero when
declining. The current frontend retains its old form behavior and must be adapted
in a separately approved frontend milestone. API rejects its declining count of 1
instead of silently changing the customer's input. Do not retry a 503 automatically:
without idempotency support, an ambiguous insert failure could have persisted.

The model, RSVP repository and route declarations are unchanged. Existing records
are not rewritten or revalidated on read. Internal creation signature changed from
createRSVP(data) to createRSVP(routeEventId,input); the controller is updated.

Verification: npm --prefix server test includes validation unit tests and actual
localhost HTTP tests with mocked repositories. Milestone 4 also verified public
RSVP operations and ownership against isolated real MongoDB 8.0.38, including after
the Mongoose 9.11.4 correction. No Atlas/replica-set or general atomicity claim is
made. Publication lookup and insert are separate operations; a concurrent
unpublish/delete after the lookup can race insertion. The inspected API has no
unpublish/delete route. Any future introduction of these operations requires a
fresh concurrency design review. Milestone 4 reproduced this race with synthetic
data; it remains unfixed. No transaction or new lock system was introduced.
Duplicates, rate limiting/spam protection and personalized invitations remain future
scope. No capacity limits, passwords, guest links, uploads, migrations, TTL, indexes,
or production-data writes were introduced in this milestone.
