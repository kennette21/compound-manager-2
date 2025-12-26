-- RLS Policies for projects table

-- Users can view projects for their properties
CREATE POLICY "Users can view property projects"
  ON projects FOR SELECT
  USING (is_property_member(property_id));

-- Members can create projects
CREATE POLICY "Members can create projects"
  ON projects FOR INSERT
  WITH CHECK (is_property_member(property_id) AND created_by = auth.uid());

-- Members can update projects
CREATE POLICY "Members can update projects"
  ON projects FOR UPDATE
  USING (is_property_member(property_id));

-- Owners and creators can delete projects
CREATE POLICY "Owners and creators can delete projects"
  ON projects FOR DELETE
  USING (is_property_owner(property_id) OR created_by = auth.uid());
