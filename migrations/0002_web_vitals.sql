-- Core Web Vitals from real visits. One row per metric per page load.
-- No IP address, user agent or full URL is stored: only the route, a
-- device class and the measured value.
CREATE TABLE web_vitals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (name IN ('LCP', 'INP', 'CLS', 'FCP', 'TTFB')),
  value REAL NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  path TEXT NOT NULL,
  device TEXT NOT NULL CHECK (device IN ('mobile', 'desktop')),
  navigation_type TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX web_vitals_by_time ON web_vitals(created_at DESC);
