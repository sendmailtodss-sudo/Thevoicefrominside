CREATE TABLE merch_orders (
 id TEXT PRIMARY KEY,
 token_hash TEXT NOT NULL,
 quote_json TEXT NOT NULL,
 config_hash TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('quoted','creating','pending','paid','expired','partially_refunded','refunded')),
 mode TEXT NOT NULL CHECK(mode IN ('test','live')),
 checkout_key TEXT,
 checkout_started INTEGER,
 session_id TEXT UNIQUE,
 checkout_url TEXT,
 payment_intent TEXT UNIQUE,
 refunded_minor INTEGER NOT NULL DEFAULT 0 CHECK(refunded_minor >= 0),
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE INDEX merch_orders_created ON merch_orders(created_at);
CREATE TABLE merch_events (
 id TEXT PRIMARY KEY,
 order_id TEXT NOT NULL REFERENCES merch_orders(id),
 type TEXT NOT NULL,
 payload_hash TEXT NOT NULL,
 received_at INTEGER NOT NULL
);
