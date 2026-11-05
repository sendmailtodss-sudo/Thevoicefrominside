-- Private allocation journal only. These tables never initiate money transfers.
CREATE TABLE merch_settlement_orders (
 order_id TEXT PRIMARY KEY REFERENCES merch_orders(id),
 payment_intent TEXT NOT NULL UNIQUE,
 mode TEXT NOT NULL CHECK(mode IN ('test','live')),
 gross_minor INTEGER NOT NULL CHECK(gross_minor >= 0),
 refunded_minor INTEGER NOT NULL DEFAULT 0 CHECK(refunded_minor >= 0 AND refunded_minor <= gross_minor),
 status TEXT NOT NULL CHECK(status IN ('awaiting_confirmed_costs','planned_no_transfer','refund_hold')),
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE TABLE merch_settlement_observations (
 event_id TEXT PRIMARY KEY REFERENCES merch_events(id),
 order_id TEXT NOT NULL REFERENCES merch_settlement_orders(order_id),
 event_type TEXT NOT NULL,
 payload_hash TEXT NOT NULL,
 gross_minor INTEGER NOT NULL,
 refunded_minor INTEGER NOT NULL,
 received_at INTEGER NOT NULL
);
CREATE TABLE merch_settlement_plans (
 order_id TEXT PRIMARY KEY REFERENCES merch_settlement_orders(order_id),
 plan_hash TEXT NOT NULL,
 plan_json TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('planned_no_transfer','refund_hold')),
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE TABLE merch_settlement_entries (
 order_id TEXT NOT NULL REFERENCES merch_settlement_plans(order_id),
 entry_key TEXT NOT NULL,
 account_kind TEXT NOT NULL,
 amount_minor INTEGER NOT NULL CHECK(amount_minor BETWEEN -100000000 AND 100000000),
 provider_account TEXT,
 source_event_id TEXT REFERENCES merch_events(id),
 created_at INTEGER NOT NULL,
 PRIMARY KEY(order_id,entry_key)
);
CREATE INDEX merch_settlement_observations_order ON merch_settlement_observations(order_id,received_at);
