/*
  # Fix profile picture display issues
  
  1. Changes
    - Add updated_at column to users table if it doesn't exist
    - Create trigger for auto-updating the updated_at column
    - Fix storage permissions and policies
    
  2. Security
    - Maintain proper access control for profile pictures
    - Ensure public access to view profile images
*/

-- First, create the update_modified_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    
    -- Update existing rows to set updated_at to current timestamp
    UPDATE public.users SET updated_at = now() WHERE updated_at IS NULL;
  END IF;
END $$;

-- Create a trigger to automatically update the updated_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.update_profile_picture(uuid, text);

-- Create a new function to update profile picture URL
CREATE FUNCTION public.update_profile_picture(user_id UUID, picture_url TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN;
BEGIN
  UPDATE public.users
  SET 
    profile_picture_url = picture_url,
    updated_at = now()
  WHERE id = user_id;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_profile_picture(UUID, TEXT) TO authenticated;

-- Ensure the profile-pictures bucket exists with proper configuration
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
    SPLIT_PART(name, '/', 1) = auth.uid()::text
);

-- Create policy to allow users to update their own profile picture
CREATE POLICY "Allow users to update own profile picture"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profile-pictures' AND
    SPLIT_PART(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'profile-pictures' AND
    SPLIT_PART(name, '/', 1) = auth.uid()::text
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