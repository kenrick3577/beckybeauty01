/*
  # Fix Profile Pictures Storage Configuration
  
  1. Changes
    - Create or update profile-pictures bucket
    - Add proper storage policies
    - Add metadata for caching
    
  2. Security
    - Users can only manage their own profile pictures
    - Public can view profile pictures
*/

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

-- Update metadata for profile pictures if metadata column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'storage' 
    AND table_name = 'objects' 
    AND column_name = 'metadata'
  ) THEN
    -- Update metadata for existing objects
    UPDATE storage.objects 
    SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{cacheControl}', '"public, max-age=3600"')
    WHERE bucket_id = 'profile-pictures';
  END IF;
EXCEPTION
  WHEN undefined_column OR undefined_table THEN
    -- Do nothing if column or table doesn't exist
  WHEN others THEN
    RAISE NOTICE 'Error updating metadata: %', SQLERRM;
END $$;