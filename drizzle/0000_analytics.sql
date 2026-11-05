CREATE TABLE analytics_events (
  event_id TEXT PRIMARY KEY NOT NULL,
  day TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('pageview', 'visit', 'share')),
  path TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL,
  received_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX analytics_events_day_idx ON analytics_events(day);
--> statement-breakpoint
CREATE TABLE analytics_daily (
  day TEXT NOT NULL,
  kind TEXT NOT NULL,
  path TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind, path, channel, source)
);
--> statement-breakpoint
CREATE TRIGGER analytics_count_event AFTER INSERT ON analytics_events
BEGIN
  INSERT INTO analytics_daily (day, kind, path, channel, source, count)
  VALUES (NEW.day, NEW.kind, NEW.path, NEW.channel, NEW.source, 1)
  ON CONFLICT (day, kind, path, channel, source) DO UPDATE SET count = count + 1;
END;
