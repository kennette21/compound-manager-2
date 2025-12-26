-- RLS Policies for properties table

-- Users can view properties they are members of
CREATE POLICY "Users can view their properties"
  ON properties FOR SELECT
  USING (is_property_member(id));

-- Only owners can update properties
CREATE POLICY "Owners can update properties"
  ON properties FOR UPDATE
  USING (is_property_owner(id));

-- Any authenticated user can create a property (they become owner)
CREATE POLICY "Authenticated users can create properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only owners can delete properties
CREATE POLICY "Owners can delete properties"
  ON properties FOR DELETE
  USING (is_property_owner(id));
