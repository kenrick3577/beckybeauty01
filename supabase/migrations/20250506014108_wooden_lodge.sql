/*
  # Configure profile pictures bucket and RLS policies
  
  1. Changes
    - Update profile-pictures bucket to enable RLS
    - Create RLS policies for profile picture management
    - Allow users to upload/delete their own profile pictures
    - Allow public read access to all profile pictures
    
  2. Security
    - Users can only manage their own pictures
    - Public read access for all profile pictures
*/

-- Ensure the profile-pictures bucket exists with RLS enabled
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
    SPLIT_PART(name, '/', 1) = auth.uid()::text AND
    ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(name, '/'), 1) = 2
);

-- Create policy to allow users to update their own profile picture
CREATE POLICY "Allow users to update own profile picture"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profile-pictures' AND
    SPLIT_PART(name, '/', 1) = auth.uid()::text AND
    ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(name, '/'), 1) = 2
)
WITH CHECK (
    bucket_id = 'profile-pictures' AND
    SPLIT_PART(name, '/', 1) = auth.uid()::text AND
    ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(name, '/'), 1) = 2
);

-- Create policy to allow users to delete their own profile picture
CREATE POLICY "Allow users to delete own profile picture"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'profile-pictures' AND
    SPLIT_PART(name, '/', 1) = auth.uid()::text
);

-- Create policy to allow public to view profile pictures
CREATE POLICY "Allow public to view profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');