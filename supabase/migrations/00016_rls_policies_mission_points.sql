-- RLS Policies for mission_points table

-- Helper to check mission ownership
CREATE OR REPLACE FUNCTION owns_mission(m_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM missions
    WHERE id = m_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to check mission property membership
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

-- Users can view mission points for missions in their properties
CREATE POLICY "Users can view mission points"
  ON mission_points FOR SELECT
  USING (is_mission_property_member(mission_id));

-- Users can add points to their own missions
CREATE POLICY "Users can add mission points"
  ON mission_points FOR INSERT
  WITH CHECK (owns_mission(mission_id));

-- Users can delete points from their own missions
CREATE POLICY "Users can delete own mission points"
  ON mission_points FOR DELETE
  USING (owns_mission(mission_id));
