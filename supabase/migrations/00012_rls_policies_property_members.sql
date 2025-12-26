-- RLS Policies for property_members table

-- Users can view members of properties they belong to
CREATE POLICY "Users can view property members"
  ON property_members FOR SELECT
  USING (is_property_member(property_id));

-- Owners can add members
CREATE POLICY "Owners can add members"
  ON property_members FOR INSERT
  WITH CHECK (is_property_owner(property_id) OR
    -- Or user is creating themselves as owner of a new property
    (user_id = auth.uid() AND role = 'owner')
  );

-- Owners can update member roles
CREATE POLICY "Owners can update members"
  ON property_members FOR UPDATE
  USING (is_property_owner(property_id));

-- Owners can remove members, users can remove themselves
CREATE POLICY "Owners can remove members or self-remove"
  ON property_members FOR DELETE
  USING (is_property_owner(property_id) OR user_id = auth.uid());
