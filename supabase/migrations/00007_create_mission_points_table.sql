-- Mission points (raw GPS data) table
CREATE TABLE mission_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  location GEOMETRY(Point, 4326) NOT NULL,
  accuracy DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL
);

-- Spatial index
CREATE INDEX idx_mission_points_location ON mission_points USING GIST (location);

-- Regular index
CREATE INDEX idx_mission_points_mission ON mission_points(mission_id);
CREATE INDEX idx_mission_points_recorded ON mission_points(recorded_at);
