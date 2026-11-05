CREATE TABLE IF NOT EXISTS workshop_profiles (
  user_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS workshop_write_quota (
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL CHECK(count >= 0 AND count <= 100),
  PRIMARY KEY(user_id, day)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS workshop_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('proposal','discussion')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','published','rejected','deleted')),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  publication_accepted_at TEXT NOT NULL,
  moderation_reason TEXT NOT NULL DEFAULT '',
  moderated_by TEXT,
  moderated_at TEXT,
  appeal_reason TEXT NOT NULL DEFAULT '',
  appeal_status TEXT CHECK(appeal_status IS NULL OR appeal_status IN ('pending','resolved')),
  appeal_created_at TEXT,
  appeal_base_version INTEGER,
  mutation_token TEXT NOT NULL,
  UNIQUE(user_id,idempotency_key)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS workshop_posts_status_kind_created ON workshop_posts(status,kind,created_at DESC,id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS workshop_posts_owner_created ON workshop_posts(user_id,created_at DESC,id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS workshop_supports (
  post_id TEXT NOT NULL REFERENCES workshop_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(post_id,user_id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS workshop_reports (
  post_id TEXT NOT NULL REFERENCES workshop_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(post_id,user_id,version)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS workshop_audit (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES workshop_posts(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  post_version INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT ''
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS workshop_audit_post_created ON workshop_audit(post_id,created_at DESC);
