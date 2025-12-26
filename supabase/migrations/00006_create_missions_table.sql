-- Missions (GPS tracking sessions) table
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  track GEOMETRY(LineString, 4326),
  distance_meters DOUBLE PRECISION,
  duration_seconds INTEGER,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index on track
CREATE INDEX idx_missions_track ON missions USING GIST (track);

-- Regular indexes
CREATE INDEX idx_missions_property ON missions(property_id);
CREATE INDEX idx_missions_user ON missions(user_id);
CREATE INDEX idx_missions_project ON missions(project_id);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_started ON missions(started_at DESC);
