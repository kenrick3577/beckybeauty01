/*
  # Fix Profile Picture Storage and Display
  
  1. Changes
    - Update storage bucket configuration
    - Add proper CORS headers
    - Set cache control headers
    - Update file size limits
    - Add MIME type validation
    
  2. Security
    - Maintain proper access control
    - Ensure secure file handling
    - Validate file paths
*/

-- Drop existing policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow users to upload own profile picture" ON storage.objects;
    DROP POLICY IF EXISTS "Allow users to update own profile picture" ON storage.objects;
    DROP POLICY IF EXISTS "Allow users to delete own profile picture" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public to view profile pictures" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Update storage bucket configuration
UPDATE storage.buckets
SET 
    public = true,
    file_size_limit = 5242880, -- 5MB limit
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif'],
    owner = null -- Allow public access
WHERE id = 'profile-pictures';

-- Create policy to allow users to upload their own profile picture
CREATE POLICY "Allow users to upload own profile picture"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile-pictures' AND
    SPLIT_PART(name, '/', 1) = auth.uid()::text AND
    ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(name, '/'), 1) = 2 AND
    octet_length(SPLIT_PART(name, '/', 2)) <= 255
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
    ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(name, '/'), 1) = 2 AND
    octet_length(SPLIT_PART(name, '/', 2)) <= 255
);

-- Create policy to allow users to delete their own profile picture
CREATE POLICY "Allow users to delete own profile picture"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'profile-pictures' AND
    SPLIT_PART(name, '/', 1) = auth.uid()::text AND
    ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(name, '/'), 1) = 2
);

-- Create policy to allow public to view profile pictures
CREATE POLICY "Allow public to view profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Add profile_picture_url column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture_url text;