# Private synthetic erasure operator

The HTTP erasure request immediately revokes access and queues a pending job. It does not claim that account/content deletion has finished. The separate operator below can finish **an already requested synthetic test account**. No HTTP route, build, cron or scheduler invokes it.

The operator requires all of: a pinned HTTPS provider project, owner-only credential/fixture files, a `.invalid` fixture identity, the database's authoritative `synthetic_test` flag, deleted/revoked membership and grants/sessions, an existing erasure job and the subject's matching `erasure_requested` audit. It checks the Auth UUID/email and original synthetic pilot metadata. It refuses real-domain identities, active access, an unreviewed target, an incomplete bounded inventory or more than100 cleanup operations.

First produce and review a dry run. This performs reads only:

```sh
node --use-env-proxy scripts/run-forum-erasure-operator.mjs \
  --run-private-synthetic-erasure --dry-run \
  --credentials /private/provider.env --fixture /private/synthetic-fixtures.json \
  --account ERASE_LABEL --job-id REQUESTED_JOB_UUID --project-ref PINNED_REF \
  --out /private/new-dry-run
```

The plan contains counts/digests, not message text, passwords or tokens. After reviewing it, execute its exact file SHA256 explicitly:

```sh
node --use-env-proxy scripts/run-forum-erasure-operator.mjs \
  --run-private-synthetic-erasure --execute \
  --reviewed-plan /private/new-dry-run/DRY-RUN-PLAN.json \
  --expected-plan-sha REVIEWED_FILE_SHA256 \
  --credentials /private/provider.env --fixture /private/synthetic-fixtures.json \
  --account ERASE_LABEL --job-id REQUESTED_JOB_UUID --project-ref PINNED_REF \
  --out /private/new-execution
```

The inventory must still match the reviewed plan, which expires after30minutes. A compare-and-swap claim on the same job ID/state/attempt prevents two workers. Cleanup changes only the subject's own message bodies/hashes, thread titles, alias/profile review fields, request hashes, and own-authored report/audit text. Message tombstones satisfy the database's deleted-state/body/hash constraint; report text becomes a valid generic reason. Threads' state stays unchanged so other authors' replies remain visible. Other authors' messages/reports/audit text are preserved; relevant replies are compared before/after cleanup.

Only after cleanup readback does the worker hard-delete the verified synthetic Auth account. A documented JSON404 `user_not_found` must confirm absence; an arbitrary404,401,403,HTML page or timeout is insufficient. The database job becomes `completed` only after that confirmation and another job readback. An uncertain DELETE is followed by a read of the **same** Auth UUID, never a blind second DELETE.

Failures leave access revoked and record `failed` when that status can be confirmed. Do not reset `running` or re-run an existing intent blindly. Inspect the same job and obtain a fresh reviewed plan after partial changes. A clean failed job whose Auth account is already absent can complete its status without another DELETE. A verified completed plan is read-only/idempotent.

This is active-content pseudonymisation plus deletion of the synthetic Auth account. It retains UUID tombstones, authorship IDs/timestamps, revoked grants/sessions, quota counters and audit action metadata. It does not establish deletion from provider backups/logs, other authors' accounts/content, or private local fixture/evidence files. Public participants and real personal data remain unsupported.
