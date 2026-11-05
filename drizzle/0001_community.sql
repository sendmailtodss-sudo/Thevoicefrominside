CREATE TABLE community_profiles (
  user_id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  name_kind TEXT NOT NULL CHECK(name_kind IN ('name','artist')),
  social_url TEXT NOT NULL,
  social_provider TEXT NOT NULL,
  social_handle TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  proof_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX community_verified_social_profile ON community_profiles(social_url) WHERE verified=1;
--> statement-breakpoint
CREATE TABLE community_verifications (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES community_profiles(user_id),
  code TEXT NOT NULL,
  social_url TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','checking')),
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE community_contributions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES community_profiles(user_id),
  idempotency_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('art','music')),
  origin TEXT NOT NULL CHECK(origin IN ('original','ai-assisted','ai-generated')),
  inspiration TEXT NOT NULL CHECK(inspiration IN ('home','chapter9','chapter10')),
  alt_text TEXT NOT NULL DEFAULT '',
  object_key TEXT NOT NULL,
  media_type TEXT NOT NULL,
  media_size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('uploading','pending','published','rejected','deleted')),
  featured INTEGER NOT NULL DEFAULT 0,
  promotion_allowed INTEGER NOT NULL DEFAULT 0,
  rights_accepted_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  UNIQUE(user_id,idempotency_key)
);
--> statement-breakpoint
CREATE INDEX community_contributions_list ON community_contributions(status,created_at);
--> statement-breakpoint
CREATE INDEX community_contributions_owner ON community_contributions(user_id,created_at);
--> statement-breakpoint
CREATE TABLE community_likes (
  contribution_id TEXT NOT NULL REFERENCES community_contributions(id),
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(contribution_id,user_id)
);
--> statement-breakpoint
CREATE TABLE community_shares (
  event_id TEXT PRIMARY KEY NOT NULL,
  contribution_id TEXT NOT NULL REFERENCES community_contributions(id),
  channel TEXT NOT NULL CHECK(channel IN ('copy','native','x','facebook','bluesky','whatsapp','email')),
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX community_shares_contribution ON community_shares(contribution_id);
--> statement-breakpoint
CREATE TABLE community_reports (
  contribution_id TEXT NOT NULL REFERENCES community_contributions(id),
  user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(contribution_id,user_id)
);
