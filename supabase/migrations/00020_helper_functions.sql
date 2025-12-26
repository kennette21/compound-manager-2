-- Additional helper functions for the app

-- Function to create a new property with the creator as owner
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
  -- Create the property
  INSERT INTO properties (name, description, center_lat, center_lng)
  VALUES (p_name, p_description, p_center_lat, p_center_lng)
  RETURNING id INTO new_property_id;

  -- Add creator as owner
  INSERT INTO property_members (property_id, user_id, role)
  VALUES (new_property_id, auth.uid(), 'owner');

  -- Create default categories
  PERFORM create_default_categories(new_property_id);

  RETURN new_property_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get property stats
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

-- Function to invite a user to a property (by email)
CREATE OR REPLACE FUNCTION invite_user_to_property(
  prop_id UUID,
  user_email TEXT,
  member_role TEXT DEFAULT 'member'
)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Check if caller is owner
  IF NOT is_property_owner(prop_id) THEN
    RAISE EXCEPTION 'Only property owners can invite members';
  END IF;

  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', user_email;
  END IF;

  -- Add member
  INSERT INTO property_members (property_id, user_id, role, invited_by)
  VALUES (prop_id, target_user_id, member_role, auth.uid())
  ON CONFLICT (property_id, user_id) DO UPDATE SET role = member_role;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
