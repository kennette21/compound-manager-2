-- RLS Policies for photos table

-- Helper to check photo access via project
CREATE OR REPLACE FUNCTION can_access_photo(photo_project_id UUID, photo_mission_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check via project
  IF photo_project_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = photo_project_id AND is_property_member(p.property_id)
    );
  END IF;

  -- Check via mission
  IF photo_mission_id IS NOT NULL THEN
    RETURN is_mission_property_member(photo_mission_id);
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users can view photos for their property projects/missions
CREATE POLICY "Users can view property photos"
  ON photos FOR SELECT
  USING (can_access_photo(project_id, mission_id));

-- Members can upload photos to projects they can access
CREATE POLICY "Members can upload photos"
  ON photos FOR INSERT
  WITH CHECK (can_access_photo(project_id, mission_id));

-- Members can update photo metadata
CREATE POLICY "Members can update photos"
  ON photos FOR UPDATE
  USING (can_access_photo(project_id, mission_id));

-- Members can delete photos
CREATE POLICY "Members can delete photos"
  ON photos FOR DELETE
  USING (can_access_photo(project_id, mission_id));
