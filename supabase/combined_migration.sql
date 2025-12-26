-- Compound Manager Database Setup
-- Run this entire file in the Supabase SQL Editor
-- =====================================================

-- 1. Enable Extensions
-- =====================================================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Tables
-- =====================================================

-- Properties (compounds) table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  boundary GEOMETRY(Polygon, 4326),
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_properties_boundary ON properties USING GIST (boundary);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Property members table
CREATE TABLE property_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')) DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, user_id)
);

CREATE INDEX idx_property_members_user ON property_members(user_id);
CREATE INDEX idx_property_members_property ON property_members(property_id);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_property ON categories(property_id);

-- Default categories function
CREATE OR REPLACE FUNCTION create_default_categories(prop_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO categories (property_id, name, color, icon, display_order) VALUES
    (prop_id, 'Path Clearing', '#22c55e', 'path', 1),
    (prop_id, 'Building', '#3b82f6', 'building', 2),
    (prop_id, 'Invasive Species', '#ef4444', 'warning', 3),
    (prop_id, 'Maintenance', '#f59e0b', 'tool', 4),
    (prop_id, 'Planting', '#10b981', 'plant', 5),
    (prop_id, 'Fencing', '#6366f1', 'fence', 6);
END;
$$ LANGUAGE plpgsql;

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'review', 'completed')) DEFAULT 'pending',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  location GEOMETRY(Point, 4326),
  area GEOMETRY(Geometry, 4326),
  due_date DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_location ON projects USING GIST (location);
CREATE INDEX idx_projects_area ON projects USING GIST (area);
CREATE INDEX idx_projects_property ON projects(property_id);
CREATE INDEX idx_projects_category ON projects(category_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_assigned ON projects(assigned_to);

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Missions table
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

CREATE INDEX idx_missions_track ON missions USING GIST (track);
CREATE INDEX idx_missions_property ON missions(property_id);
CREATE INDEX idx_missions_user ON missions(user_id);
CREATE INDEX idx_missions_project ON missions(project_id);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_started ON missions(started_at DESC);

-- Mission points table
CREATE TABLE mission_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  location GEOMETRY(Point, 4326) NOT NULL,
  accuracy DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_mission_points_location ON mission_points USING GIST (location);
CREATE INDEX idx_mission_points_mission ON mission_points(mission_id);
CREATE INDEX idx_mission_points_recorded ON mission_points(recorded_at);

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

CREATE INDEX idx_photos_location ON photos USING GIST (location);
CREATE INDEX idx_photos_project ON photos(project_id);
CREATE INDEX idx_photos_mission ON photos(mission_id);
CREATE INDEX idx_photos_captured ON photos(captured_at DESC);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_project ON comments(project_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_created ON comments(created_at DESC);

-- 3. Enable Row Level Security
-- =====================================================

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 4. Helper Functions
-- =====================================================

CREATE OR REPLACE FUNCTION is_property_member(prop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM property_members
    WHERE property_id = prop_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_property_owner(prop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM property_members
    WHERE property_id = prop_id AND user_id = auth.uid() AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION owns_mission(m_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM missions
    WHERE id = m_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_mission_property_member(m_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM missions m
    JOIN property_members pm ON m.property_id = pm.property_id
    WHERE m.id = m_id AND pm.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_access_photo(photo_project_id UUID, photo_mission_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF photo_project_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = photo_project_id AND is_property_member(p.property_id)
    );
  END IF;
  IF photo_mission_id IS NOT NULL THEN
    RETURN is_mission_property_member(photo_mission_id);
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_access_project(proj_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = proj_id AND is_property_member(p.property_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS Policies
-- =====================================================

-- Properties policies
CREATE POLICY "Users can view their properties" ON properties FOR SELECT USING (is_property_member(id));
CREATE POLICY "Owners can update properties" ON properties FOR UPDATE USING (is_property_owner(id));
CREATE POLICY "Authenticated users can create properties" ON properties FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owners can delete properties" ON properties FOR DELETE USING (is_property_owner(id));

-- Property members policies
CREATE POLICY "Users can view property members" ON property_members FOR SELECT USING (is_property_member(property_id));
CREATE POLICY "Owners can add members" ON property_members FOR INSERT WITH CHECK (is_property_owner(property_id) OR (user_id = auth.uid() AND role = 'owner'));
CREATE POLICY "Owners can update members" ON property_members FOR UPDATE USING (is_property_owner(property_id));
CREATE POLICY "Owners can remove members or self-remove" ON property_members FOR DELETE USING (is_property_owner(property_id) OR user_id = auth.uid());

-- Categories policies
CREATE POLICY "Users can view property categories" ON categories FOR SELECT USING (is_property_member(property_id));
CREATE POLICY "Members can create categories" ON categories FOR INSERT WITH CHECK (is_property_member(property_id));
CREATE POLICY "Members can update categories" ON categories FOR UPDATE USING (is_property_member(property_id));
CREATE POLICY "Owners can delete categories" ON categories FOR DELETE USING (is_property_owner(property_id));

-- Projects policies
CREATE POLICY "Users can view property projects" ON projects FOR SELECT USING (is_property_member(property_id));
CREATE POLICY "Members can create projects" ON projects FOR INSERT WITH CHECK (is_property_member(property_id) AND created_by = auth.uid());
CREATE POLICY "Members can update projects" ON projects FOR UPDATE USING (is_property_member(property_id));
CREATE POLICY "Owners and creators can delete projects" ON projects FOR DELETE USING (is_property_owner(property_id) OR created_by = auth.uid());

-- Missions policies
CREATE POLICY "Users can view property missions" ON missions FOR SELECT USING (is_property_member(property_id));
CREATE POLICY "Members can create missions" ON missions FOR INSERT WITH CHECK (is_property_member(property_id) AND user_id = auth.uid());
CREATE POLICY "Users can update own missions" ON missions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own missions" ON missions FOR DELETE USING (user_id = auth.uid() OR is_property_owner(property_id));

-- Mission points policies
CREATE POLICY "Users can view mission points" ON mission_points FOR SELECT USING (is_mission_property_member(mission_id));
CREATE POLICY "Users can add mission points" ON mission_points FOR INSERT WITH CHECK (owns_mission(mission_id));
CREATE POLICY "Users can delete own mission points" ON mission_points FOR DELETE USING (owns_mission(mission_id));

-- Photos policies
CREATE POLICY "Users can view property photos" ON photos FOR SELECT USING (can_access_photo(project_id, mission_id));
CREATE POLICY "Members can upload photos" ON photos FOR INSERT WITH CHECK (can_access_photo(project_id, mission_id));
CREATE POLICY "Members can update photos" ON photos FOR UPDATE USING (can_access_photo(project_id, mission_id));
CREATE POLICY "Members can delete photos" ON photos FOR DELETE USING (can_access_photo(project_id, mission_id));

-- Comments policies
CREATE POLICY "Users can view project comments" ON comments FOR SELECT USING (can_access_project(project_id));
CREATE POLICY "Members can add comments" ON comments FOR INSERT WITH CHECK (can_access_project(project_id) AND user_id = auth.uid());
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND is_property_owner(p.property_id)));

-- 6. Utility Functions
-- =====================================================

CREATE OR REPLACE FUNCTION create_property_with_owner(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_center_lat DOUBLE PRECISION DEFAULT NULL,
  p_center_lng DOUBLE PRECISION DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_property_id UUID;
BEGIN
  INSERT INTO properties (name, description, center_lat, center_lng)
  VALUES (p_name, p_description, p_center_lat, p_center_lng)
  RETURNING id INTO new_property_id;

  INSERT INTO property_members (property_id, user_id, role)
  VALUES (new_property_id, auth.uid(), 'owner');

  PERFORM create_default_categories(new_property_id);

  RETURN new_property_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_property_stats(prop_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_projects', (SELECT COUNT(*) FROM projects WHERE property_id = prop_id),
    'active_projects', (SELECT COUNT(*) FROM projects WHERE property_id = prop_id AND status IN ('pending', 'in_progress', 'review')),
    'completed_projects', (SELECT COUNT(*) FROM projects WHERE property_id = prop_id AND status = 'completed'),
    'total_missions', (SELECT COUNT(*) FROM missions WHERE property_id = prop_id AND status = 'completed'),
    'total_distance_km', (SELECT COALESCE(SUM(distance_meters), 0) / 1000 FROM missions WHERE property_id = prop_id AND status = 'completed'),
    'total_hours', (SELECT COALESCE(SUM(duration_seconds), 0) / 3600.0 FROM missions WHERE property_id = prop_id AND status = 'completed'),
    'member_count', (SELECT COUNT(*) FROM property_members WHERE property_id = prop_id)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION invite_user_to_property(
  prop_id UUID,
  user_email TEXT,
  member_role TEXT DEFAULT 'member'
)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF NOT is_property_owner(prop_id) THEN
    RAISE EXCEPTION 'Only property owners can invite members';
  END IF;

  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', user_email;
  END IF;

  INSERT INTO property_members (property_id, user_id, role, invited_by)
  VALUES (prop_id, target_user_id, member_role, auth.uid())
  ON CONFLICT (property_id, user_id) DO UPDATE SET role = member_role;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Done!
-- Don't forget to:
-- 1. Create a 'photos' storage bucket (public)
-- 2. Add storage policies for the bucket
-- 3. Optionally disable email confirmation for dev
