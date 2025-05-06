-- Create or update profile-pictures bucket with the correct configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-pictures',
    'profile-pictures',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif'];

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow users to upload own profile picture" ON storage.objects;
    DROP POLICY IF EXISTS "Allow users to update own profile picture" ON storage.objects;
    DROP POLICY IF EXISTS "Allow users to delete own profile picture" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public to view profile pictures" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create policy to allow users to upload their own profile picture
CREATE POLICY "Allow users to upload own profile picture"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile-pictures' AND
    (auth.uid())::text = SPLIT_PART(name, '/', 1)
);

-- Create policy to allow users to update their own profile picture
CREATE POLICY "Allow users to update own profile picture"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profile-pictures' AND
    (auth.uid())::text = SPLIT_PART(name, '/', 1)
)
WITH CHECK (
    bucket_id = 'profile-pictures' AND
    (auth.uid())::text = SPLIT_PART(name, '/', 1)
);

-- Create policy to allow users to delete their own profile picture
CREATE POLICY "Allow users to delete own profile picture"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'profile-pictures' AND
    (auth.uid())::text = SPLIT_PART(name, '/', 1)
);

-- Create policy to allow public to view profile pictures
CREATE POLICY "Allow public to view profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Add updated_at column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create or replace update_modified_column function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;