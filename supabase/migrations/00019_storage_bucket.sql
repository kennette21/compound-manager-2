-- Create storage bucket for photos
-- Note: This needs to be run after the storage extension is set up
-- You may need to create this bucket via the Supabase dashboard instead

-- Insert bucket (this may fail if bucket already exists - that's OK)
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies need to be created via the dashboard or using the Supabase CLI
-- Here are the policies you should create:

/*
Policy 1: Allow authenticated users to upload photos
- Name: "Allow authenticated uploads"
- Allowed operation: INSERT
- Target roles: authenticated
- Policy definition: bucket_id = 'photos'

Policy 2: Allow public read access to photos
- Name: "Allow public read access"
- Allowed operation: SELECT
- Target roles: public
- Policy definition: bucket_id = 'photos'

Policy 3: Allow users to delete their uploaded photos
- Name: "Allow authenticated deletes"
- Allowed operation: DELETE
- Target roles: authenticated
- Policy definition: bucket_id = 'photos'
*/
