-- Append-only aggregate history; no donor or bank-account data.
CREATE TABLE IF NOT EXISTS legal_fund_reports (
  version INTEGER PRIMARY KEY CHECK (version BETWEEN 1 AND 1000000000),
  idempotency_key TEXT NOT NULL UNIQUE,
  request_hash TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  total_received_minor INTEGER NOT NULL CHECK (typeof(total_received_minor)='integer' AND total_received_minor BETWEEN 0 AND 9007199254740991),
  total_disbursed_minor INTEGER NOT NULL CHECK (typeof(total_disbursed_minor)='integer' AND total_disbursed_minor BETWEEN 0 AND 9007199254740991),
  total_refunded_minor INTEGER NOT NULL CHECK (typeof(total_refunded_minor)='integer' AND total_refunded_minor BETWEEN 0 AND 9007199254740991),
  available_minor INTEGER NOT NULL CHECK (typeof(available_minor)='integer' AND available_minor BETWEEN 0 AND 9007199254740991),
  goal_minor INTEGER NOT NULL CHECK (typeof(goal_minor)='integer' AND goal_minor BETWEEN 1 AND 9007199254740991),
  as_of TEXT NOT NULL,
  reported_at TEXT NOT NULL,
  bank_reconciled INTEGER NOT NULL CHECK (bank_reconciled=1),
  correction INTEGER NOT NULL CHECK (correction IN (0,1)),
  correction_reason TEXT NOT NULL DEFAULT '',
  CHECK (total_disbursed_minor <= total_received_minor AND total_refunded_minor <= total_received_minor - total_disbursed_minor),
  CHECK (available_minor = total_received_minor - total_disbursed_minor - total_refunded_minor),
  CHECK ((correction=0 AND correction_reason='') OR (correction=1 AND length(correction_reason) BETWEEN 10 AND 1000))
);
