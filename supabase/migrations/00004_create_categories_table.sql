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

-- Index for property lookup
CREATE INDEX idx_categories_property ON categories(property_id);

-- Insert default categories function (called when creating a property)
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
