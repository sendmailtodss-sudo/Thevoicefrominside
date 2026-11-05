CREATE TABLE IF NOT EXISTS retention_heartbeat (
 job_id TEXT PRIMARY KEY,
 completed_at TEXT NOT NULL,
 scheduled_at TEXT NOT NULL,
 cron TEXT NOT NULL,
 expired_records INTEGER NOT NULL CHECK(expired_records >= 0)
);
