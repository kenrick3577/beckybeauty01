/*
  # Fix Profile Picture Upload Functionality
  
  1. Changes
    - Drop existing storage policies to avoid conflicts
    - Create new storage policies with proper permissions
    - Add helper function for file path validation
    
  2. Security
    - Users can only access their own profile pictures
    - Public can view all profile pictures
    - Proper path validation for security
*/

-- Create helper function to validate file paths
CREATE OR REPLACE FUNCTION storage.is_valid_path(path text)
RETURNS boolean AS $$
BEGIN
  -- Check if path follows the pattern: {user_id}/{filename}
  RETURN path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+$';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can upload their own profile picture" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own profile picture" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own profile picture" ON storage.objects;
    DROP POLICY IF EXISTS "Public can view profile pictures" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Allow users to upload their own profile picture
CREATE POLICY "Users can upload their own profile picture"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile-pictures' 
    AND storage.is_valid_path(name) 
    AND SPLIT_PART(name, '/', 1) = auth.uid()::text
);

-- Allow users to update their own profile picture
CREATE POLICY "Users can update their own profile picture"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profile-pictures' 
    AND storage.is_valid_path(name) 
    AND SPLIT_PART(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'profile-pictures' 
    AND storage.is_valid_path(name) 
    AND SPLIT_PART(name, '/', 1) = auth.uid()::text
);

-- Allow users to delete their own profile picture
CREATE POLICY "Users can delete their own profile picture"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'profile-pictures' 
    AND storage.is_valid_path(name) 
    AND SPLIT_PART(name, '/', 1) = auth.uid()::text
);

-- Allow public to view profile pictures
CREATE POLICY "Public can view profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Add profile_picture_url column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture_url text;