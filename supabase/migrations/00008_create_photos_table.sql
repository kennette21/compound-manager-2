-- Photos table
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  location GEOMETRY(Point, 4326),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  photo_type TEXT CHECK (photo_type IN ('before', 'during', 'after', 'general')) DEFAULT 'general',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index
CREATE INDEX idx_photos_location ON photos USING GIST (location);

-- Regular indexes
CREATE INDEX idx_photos_project ON photos(project_id);
CREATE INDEX idx_photos_mission ON photos(mission_id);
CREATE INDEX idx_photos_captured ON photos(captured_at DESC);
