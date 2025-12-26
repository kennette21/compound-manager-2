-- RLS Policies for comments table

-- Helper to check project access
CREATE OR REPLACE FUNCTION can_access_project(proj_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = proj_id AND is_property_member(p.property_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users can view comments on projects they can access
CREATE POLICY "Users can view project comments"
  ON comments FOR SELECT
  USING (can_access_project(project_id));

-- Members can add comments
CREATE POLICY "Members can add comments"
  ON comments FOR INSERT
  WITH CHECK (can_access_project(project_id) AND user_id = auth.uid());

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own comments, project owners can delete any
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND is_property_owner(p.property_id)
    )
  );
