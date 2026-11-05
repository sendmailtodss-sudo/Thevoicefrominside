CREATE TABLE counsel_ballot_votes (
  version TEXT NOT NULL,
  user_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (version,user_id)
);
--> statement-breakpoint
CREATE INDEX counsel_ballot_counts ON counsel_ballot_votes(version,candidate_id);
--> statement-breakpoint
CREATE TABLE counsel_ballot_limits (
  user_id TEXT NOT NULL,
  bucket INTEGER NOT NULL,
  attempts INTEGER NOT NULL CHECK(attempts BETWEEN 1 AND 10),
  mutation_token TEXT NOT NULL,
  PRIMARY KEY (user_id,bucket)
);
