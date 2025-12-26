-- RLS Policies for missions table

-- Users can view missions for their properties
CREATE POLICY "Users can view property missions"
  ON missions FOR SELECT
  USING (is_property_member(property_id));

-- Members can create missions
CREATE POLICY "Members can create missions"
  ON missions FOR INSERT
  WITH CHECK (is_property_member(property_id) AND user_id = auth.uid());

-- Users can update their own missions
CREATE POLICY "Users can update own missions"
  ON missions FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own missions, owners can delete any
CREATE POLICY "Users can delete own missions"
  ON missions FOR DELETE
  USING (user_id = auth.uid() OR is_property_owner(property_id));
