-- RLS Policies for categories table

-- Users can view categories for their properties
CREATE POLICY "Users can view property categories"
  ON categories FOR SELECT
  USING (is_property_member(property_id));

-- Members can create categories
CREATE POLICY "Members can create categories"
  ON categories FOR INSERT
  WITH CHECK (is_property_member(property_id));

-- Members can update categories
CREATE POLICY "Members can update categories"
  ON categories FOR UPDATE
  USING (is_property_member(property_id));

-- Owners can delete categories
CREATE POLICY "Owners can delete categories"
  ON categories FOR DELETE
  USING (is_property_owner(property_id));
