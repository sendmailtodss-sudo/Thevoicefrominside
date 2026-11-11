# Private synthetic forum API

This backend is disabled by default, including whenever `VERCEL_ENV=production`. It must only be mounted in a protected preview. No public registration, real identity/KYC, payment, email or participant pilot is activated.

Mount `api/forum.mjs` for `/api/forum/:path*` and preserve the original request URL. Every response is private/no-store JSON. The ordinary development server remains closed; it never proxies to Supabase. The production packager must omit this handler, its rewrites and all four existing private preview pages.

Enable only with `FORUM_PRIVATE_MODE=synthetic`, an explicit `FORUM_ALLOWED_ORIGINS` list (comma separated, exact origins), and the provisioned EU Free resource's `FORUM_SUPABASE_URL`, `FORUM_SUPABASE_ANON_KEY`, `FORUM_SUPABASE_SERVICE_ROLE_KEY`. `FORUM_EXPECTED_PROJECT_REF` is mandatory and pins the intended resource; missing or mismatched pins stay closed. Use server-only variables. Never put a service key or authentication cookie in HTML, JavaScript, source control, logs or reports. The Vercel URL is an additional trusted preview origin; request headers cannot add origins.

`POST /login {email,password}` accepts **seeded synthetic accounts on `.invalid` domains only**. Supabase checks the password, then `/auth/v1/user` verifies its JWT before the server registers the immutable provider session through a service-only helper. An unknown user cannot self-register or grant access. Sessions use an HttpOnly/Secure/SameSite=Strict host cookie, expire within one hour, and must log in again; no refresh token is stored. Production never accepts these cookies. For an explicitly enabled private localhost integration runner only, `FORUM_ALLOW_INSECURE_LOCAL=1` uses an HttpOnly test cookie on `/api/forum`.

All further calls use that cookie; forged Sites headers and caller roles are ignored. Mutations require a matching exact `Origin` and JSON content type. Body size is limited to 16KiB. Ordinary provider calls carry the member's verified JWT plus the anon key, not the service key. RLS and transactional RPC guards enforce membership, session revocation, room scope, versions, quotas and idempotence again in the database.

| Method/path | Payload/result |
|---|---|
| GET `/health` | `{mode:'synthetic',private:true,publicRegistration:false,realKyc:false,payments:false}` |
| GET `/me` | `{member,grants,permissions:{reviewMembership,moderateRooms},pilot:{syntheticOnly:true,kyc:false}}` |
| GET `/rooms` | `{rooms:[{id,title_no,title_en}]}` |
| GET `/threads?room=inside` | `{threads:[...]}`; room is `inside` or `relatives` |
| GET `/messages?thread_id=UUID` | `{thread,messages:[...]}`, ordered oldest first, at most100. Continue with `after_created_at=ISO8601&after_id=UUID&limit=1..100` using the last row's exact timestamp/ID; timestamp microseconds are preserved. |
| POST `/application` | `{alias,declared_role,version,ack:true}` → `{member}`; no identity or approval fields |
| POST `/threads` | `{room,title,body,idempotency_key:UUID}` → `{thread,message,replayed}` |
| POST `/messages` | `{thread_id,body,idempotency_key:UUID}` → `{message,replayed}` |
| POST `/messages/edit` | `{message_id,body,version}` → `{message}` |
| POST `/messages/delete` | `{message_id,version}` → `{message}` |
| POST `/messages/report` | `{message_id,version,reason}` |
| POST `/messages/moderate` | `{message_id,version,state:'active'|'hidden',reason}` → `{message}` |
| GET `/applications` | `{applications:[...]}` for a current membership reviewer |
| GET `/reports?room=inside` | `{reports:[...]}` for a current moderator of that room |
| POST `/members/review` | `{subject_id,version,decision,rooms,reason}`; decision=`verify_test/approve/reject/suspend/reopen` |
| POST `/privacy/export` | `{}` → own-data-only export, including own historical contributions |
| POST `/privacy/erase` | `{}` → immediately revoked access and a pending erasure job; **not a claim of completed provider deletion** |
| POST `/logout` | `{}` → revoked app session and cleared cookie |

Success is `{ok:true,data:...}`. Failures are `{ok:false,error:{code,message}}` with 400/401/403/404/409/413/415/429/503. A changed payload under the same idempotency UUID returns 409; retain an uncertain request's original UUID and exact payload. Versions are positive integers. Message bodies are plain text, 1–6000 characters; render with `textContent`, never `innerHTML`.

Real provider-backed tests and a deployed browser test are separate acceptance gates. Local model tests or this contract do not establish an operational public forum.

Membership `identity_state` is `pending`, `synthetic_verified` or `revoked`. `verify_test` only reviews a different seeded synthetic pending member; it is never real identity/KYC. Returned thread/message rows include an `author_alias` for display; render that rather than UUIDs.

## Operator-only private verification

Review `database/forum-private.sql` before applying it as the trusted migration owner to a separately approved private test resource. Do not expose database credentials or SQL execution as a public application endpoint. The migration creates only the `sfi_forum_*` pilot objects; no automatic migrations run when a browser or the development server starts.

After schema installation, run the real-provider integration check explicitly:

```sh
node --use-env-proxy scripts/check-forum-provider.mjs \
  --run-private-synthetic --credentials /private/provider.env \
  --project-ref EXPECTED_PROJECT_REF --out /private/fresh-check-directory
```

The private credential file contains JSON-quoted values under `SFI_EU_SUPABASE_URL`, `SFI_EU_SUPABASE_ANON_KEY` and `SFI_EU_SUPABASE_SERVICE_ROLE_KEY`, and must have owner-only permissions. The runner checks the HTTPS resource pin, creates fictional `.invalid` accounts without sending email, verifies their synthetic metadata, and writes a redacted result plus a **separate private account file that must never be uploaded or committed**. Once fixture tests have begun, the same output directory cannot silently reset or reactivate suspended, rejected or erased members. Reconcile a failed fixture deliberately; retain its evidence.

The runner exercises actual provider authentication, room RLS through both the app and direct provider REST, concurrent idempotency and quota boundaries, versioned membership review, scoped moderation, revoke-versus-write, own-data export and logout. It distinguishes those results from a deployed browser/cold-start test. The current erasure RPC revokes access and records a pending job; this does not establish completed content or provider-account deletion.

For protected local browser verification against that same provider and fictional accounts:

```sh
node --use-env-proxy scripts/serve-private-forum.mjs \
  --run-private-synthetic --credentials /private/provider.env \
  --project-ref EXPECTED_PROJECT_REF --public /checkout/public --port 8321
```

This separate runner binds only `127.0.0.1`, limits browser connections to its own origin, and leaves unrelated APIs closed. `npm run dev` retains its original read-only behavior. Outside localhost/development, cookies always retain Secure and the host prefix.

This is a bounded pilot: ordinary room thread lists return at most100 threads, messages have a precise forward cursor, and the transaction guard prioritizes clear revoke/write ordering over large-scale throughput. A larger real-participant service needs separate privacy, moderation, performance and operational review.

The integration runner refuses to reuse an already exercised fixture. The single explicit `--resume-after-business-conflict-fix` path accepts only the original 49-pass run stopped at `changed_payload_same_key_conflicts`, archives its report by hash, verifies the same synthetic identities/sessions without reseeding, and reuses the original thread/message/request key before continuing. This is reconciliation of one recorded failure, not a general retry or account-reactivation option.

An explicitly run, reviewed-plan operator can complete an already requested synthetic account outside the HTTP request: see [forum-erasure-operator.md](forum-erasure-operator.md). The HTTP response remains pending until actual operator work finishes; no scheduler or automatic deletion is enabled.
