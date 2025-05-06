/*
  # Add Profile Picture Support
  
  1. Changes
    - Add profile_picture_url column to users table
    - Create storage bucket for profile pictures
    - Add storage policies for profile picture management
    
  2. Security
    - Users can only manage their own pictures
    - Public can view all profile pictures
*/

-- Add profile_picture_url column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture_url text;

-- Create storage bucket for profile pictures if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can upload their own profile picture" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own profile picture" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own profile picture" ON storage.objects;
    DROP POLICY IF EXISTS "Public can view profile pictures" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Create policy to allow users to upload their own profile picture
CREATE POLICY "Users can upload their own profile picture"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy to allow users to update their own profile picture
CREATE POLICY "Users can update their own profile picture"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy to allow users to delete their own profile picture
CREATE POLICY "Users can delete their own profile picture"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy to allow public to view profile pictures
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Public can view profile pictures'
    ) THEN
        EXECUTE 'CREATE POLICY "Public can view profile pictures" ON storage.objects FOR SELECT TO public USING (bucket_id = ''profile-pictures'')';
    END IF;
END $$;