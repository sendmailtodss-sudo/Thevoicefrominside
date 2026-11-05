CREATE TABLE IF NOT EXISTS original_orders (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL,
 request_key TEXT NOT NULL,
 request_hash TEXT NOT NULL,
 artwork_id TEXT NOT NULL REFERENCES creative_works(id),
 artist_id TEXT NOT NULL REFERENCES creative_artists(id),
 snapshot_json TEXT NOT NULL,
 config_hash TEXT NOT NULL,
 mode TEXT NOT NULL CHECK(mode IN ('test','live')),
 status TEXT NOT NULL CHECK(status IN ('held','creating','pending','paid','expired','cancelled','payment_failed','needs_review','partially_refunded','refunded')),
 hold_expires_at INTEGER NOT NULL,
 checkout_started INTEGER,
 checkout_language TEXT CHECK(checkout_language IN ('no','en')),
 session_id TEXT UNIQUE,
 checkout_url TEXT,
 payment_intent TEXT UNIQUE,
 refunded_minor INTEGER NOT NULL DEFAULT 0 CHECK(refunded_minor>=0),
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 UNIQUE(user_id,request_key)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS original_orders_holds ON original_orders(status,hold_expires_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS original_orders_user ON original_orders(user_id,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS original_sales_events (
 id TEXT PRIMARY KEY,
 order_id TEXT NOT NULL REFERENCES original_orders(id),
 type TEXT NOT NULL,
 payload_hash TEXT NOT NULL,
 received_at INTEGER NOT NULL
);
