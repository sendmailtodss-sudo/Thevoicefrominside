CREATE TABLE IF NOT EXISTS witness_records (
 id TEXT PRIMARY KEY,
 owner_id TEXT NOT NULL,
 request_key TEXT NOT NULL,
 request_hash TEXT NOT NULL,
 private_json TEXT NOT NULL,
 public_json TEXT NOT NULL DEFAULT '{}',
 status TEXT NOT NULL CHECK(status IN ('pending','awaiting_consent','published','rejected','withdrawn','expired')),
 version INTEGER NOT NULL DEFAULT 1 CHECK(version>0),
 reviewer_id TEXT,
 reviewed_at TEXT,
 consent_version TEXT NOT NULL,
 publication_consent_at TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 mutation_token TEXT NOT NULL,
 UNIQUE(owner_id,request_key)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS witness_records_status_created ON witness_records(status,created_at,id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS witness_records_owner ON witness_records(owner_id,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS witness_feedback (
 id TEXT PRIMARY KEY,
 record_id TEXT NOT NULL REFERENCES witness_records(id) ON DELETE CASCADE,
 author_id TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('correction','reply')),
 private_text TEXT NOT NULL,
 public_text TEXT NOT NULL,
 consent_public INTEGER NOT NULL CHECK(consent_public IN (0,1)),
 status TEXT NOT NULL CHECK(status IN ('pending','accepted','rejected','withdrawn')),
 record_version INTEGER NOT NULL,
 version INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL,
 reviewed_at TEXT,
 reviewer_id TEXT
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS witness_audit (
 id TEXT PRIMARY KEY,
 record_id TEXT NOT NULL REFERENCES witness_records(id) ON DELETE CASCADE,
 actor_id TEXT NOT NULL,
 action TEXT NOT NULL,
 record_version INTEGER NOT NULL,
 created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS witness_quota (
 actor_id TEXT NOT NULL,
 day TEXT NOT NULL,
 count INTEGER NOT NULL CHECK(count BETWEEN 0 AND 60),
 PRIMARY KEY(actor_id,day)
);
