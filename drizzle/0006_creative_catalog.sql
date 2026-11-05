CREATE TABLE IF NOT EXISTS creative_artists (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL,
 eligibility_attested_at TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS creative_works (
 id TEXT PRIMARY KEY, artist_id TEXT NOT NULL REFERENCES creative_artists(id), user_id TEXT NOT NULL,
 idempotency_key TEXT NOT NULL, request_hash TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('art','music')),
 title TEXT NOT NULL, description TEXT NOT NULL, author_name TEXT NOT NULL, origin TEXT NOT NULL,
 media_key TEXT, media_type TEXT, media_size INTEGER, media_width INTEGER, media_height INTEGER,
 source_url TEXT, music_requests TEXT NOT NULL DEFAULT '[]', rights_attested_at TEXT NOT NULL,
 reproduction_allowed INTEGER NOT NULL DEFAULT 0 CHECK(reproduction_allowed IN (0,1)), artist_fee_minor INTEGER,
 physical_original INTEGER NOT NULL DEFAULT 0 CHECK(physical_original IN (0,1)), original_sale_allowed INTEGER NOT NULL DEFAULT 0 CHECK(original_sale_allowed IN (0,1)),
 original_status TEXT NOT NULL DEFAULT 'not_listed' CHECK(original_status IN ('not_listed','available','reserved','sold')),
 original_price_minor INTEGER, reservation_id TEXT, reserved_at TEXT,
 status TEXT NOT NULL CHECK(status IN ('uploading','pending','published','rejected','deleted')),
 version INTEGER NOT NULL DEFAULT 1, moderation_reason TEXT NOT NULL DEFAULT '', mutation_token TEXT NOT NULL,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(user_id,idempotency_key),
 CHECK(original_status='not_listed' OR (physical_original=1 AND original_sale_allowed=1 AND original_price_minor>0)),
 CHECK(reproduction_allowed=0 OR artist_fee_minor>0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS creative_works_public ON creative_works(status,kind,created_at DESC,id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS creative_works_artist ON creative_works(artist_id,status);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS creative_priority_votes (
 user_id TEXT NOT NULL, work_id TEXT NOT NULL REFERENCES creative_works(id), version INTEGER NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(user_id,work_id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS creative_write_quota (
 user_id TEXT NOT NULL, day TEXT NOT NULL, count INTEGER NOT NULL CHECK(count<=100), PRIMARY KEY(user_id,day)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS creative_audit (
 id TEXT PRIMARY KEY, work_id TEXT NOT NULL REFERENCES creative_works(id), action TEXT NOT NULL, actor_id TEXT NOT NULL,
 version INTEGER NOT NULL, created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS creative_collaboration_offers (
 id TEXT PRIMARY KEY, work_id TEXT NOT NULL REFERENCES creative_works(id), sender_id TEXT NOT NULL,
 help_types TEXT NOT NULL, message TEXT NOT NULL, private_email TEXT NOT NULL,
 contact_consent_at TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('pending','approved','declined')),
 version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 UNIQUE(work_id,sender_id)
);
