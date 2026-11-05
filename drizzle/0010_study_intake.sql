CREATE TABLE IF NOT EXISTS study_intake_jobs (
 id TEXT PRIMARY KEY, study_id TEXT NOT NULL, owner_id TEXT NOT NULL, owner_token TEXT NOT NULL,
 request_key TEXT NOT NULL, request_hash TEXT NOT NULL, document_fingerprint TEXT NOT NULL, analysis_fingerprint TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('prepared','running','complete','failed','uncertain','withdrawn','expired')),
 version INTEGER NOT NULL DEFAULT 1, key_id TEXT NOT NULL,
 source_ciphertext TEXT, result_ciphertext TEXT, coding_json TEXT,
 approval_digest TEXT NOT NULL, config_hash TEXT NOT NULL,
 aggregate_opt_in INTEGER NOT NULL CHECK(aggregate_opt_in IN (0,1)),
 consent_version TEXT NOT NULL, transmission_consent_at INTEGER,
 created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, content_expires_at INTEGER NOT NULL,
 metadata_expires_at INTEGER NOT NULL, run_started_at INTEGER, run_token TEXT,
 failure_code TEXT, published_at INTEGER,
 UNIQUE(owner_id,request_key), UNIQUE(study_id,owner_id,analysis_fingerprint)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS study_jobs_owner ON study_intake_jobs(owner_id,created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS study_jobs_expiry ON study_intake_jobs(content_expires_at,metadata_expires_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS study_intake_control (
 study_id TEXT PRIMARY KEY, privacy_key_tag TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0,
 publication_locked INTEGER NOT NULL DEFAULT 0 CHECK(publication_locked IN (0,1)), current_release TEXT
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS study_intake_releases (
 id TEXT PRIMARY KEY, study_id TEXT NOT NULL, request_key TEXT NOT NULL, request_hash TEXT NOT NULL,
 public_json TEXT NOT NULL, guard_ciphertext TEXT, key_id TEXT NOT NULL,
 created_at INTEGER NOT NULL, guard_expires_at INTEGER NOT NULL,
 UNIQUE(study_id,request_key)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS study_intake_retention (
 job_id TEXT PRIMARY KEY, completed_at INTEGER NOT NULL, scheduled_at INTEGER NOT NULL, cron TEXT NOT NULL
);
