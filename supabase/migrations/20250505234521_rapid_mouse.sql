/*
  # Fix profile picture storage and display
  
  1. Changes
    - Drop existing update_profile functions to avoid conflicts
    - Create new consolidated function with proper parameters
    - Update storage policies for profile pictures
    
  2. Security
    - Maintain proper access control
    - Ensure proper permissions for authenticated users
*/

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.update_profile(text, text, text);
DROP FUNCTION IF EXISTS public.update_profile(text, text, text, text);

-- Create new consolidated function
CREATE OR REPLACE FUNCTION public.update_profile(
  p_name text,
  p_email text,
  p_mobile text,
  p_profile_picture_url text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_existing_email text;
BEGIN
  -- Get the user ID of the authenticated user
  v_user_id := auth.uid();
  
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = v_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User not found'
    );
  END IF;

  -- Check if email is already taken by another user
  SELECT email INTO v_existing_email
  FROM users
  WHERE email = p_email AND id != v_user_id;
  
  IF v_existing_email IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Email is already taken'
    );
  END IF;

  -- Update user profile
  UPDATE users
  SET
    name = p_name,
    email = p_email,
    mobile = p_mobile,
    profile_picture_url = COALESCE(p_profile_picture_url, profile_picture_url),
    updated_at = now()
  WHERE id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Profile updated successfully'
  );
END;
$$;

-- Grant permissions on the function
GRANT EXECUTE ON FUNCTION public.update_profile TO authenticated;

-- Create update_modified_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create profile-pictures bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('profile-pictures', 'profile-pictures', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif'])
  ON CONFLICT (id) DO UPDATE 
  SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif'];
EXCEPTION
  WHEN undefined_table THEN
    -- If storage schema doesn't exist, just continue
    NULL;
END $$;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
  -- Drop storage policies if they exist
  DROP POLICY IF EXISTS "Allow users to upload own profile picture" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to update own profile picture" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to delete own profile picture" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public to view profile pictures" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

-- Create storage policies if storage schema exists
DO $$
BEGIN
  -- Check if storage schema exists
  IF EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage'
  ) THEN
    -- Allow users to upload own profile pictures
    EXECUTE '
      CREATE POLICY "Allow users to upload own profile picture"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = ''profile-pictures'' AND
        SPLIT_PART(name, ''/'', 1) = auth.uid()::text
      )
    ';
    
    -- Allow users to update own profile pictures
    EXECUTE '
      CREATE POLICY "Allow users to update own profile picture"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = ''profile-pictures'' AND
        SPLIT_PART(name, ''/'', 1) = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = ''profile-pictures'' AND
        SPLIT_PART(name, ''/'', 1) = auth.uid()::text
      )
    ';
    
    -- Allow users to delete own profile pictures
    EXECUTE '
      CREATE POLICY "Allow users to delete own profile picture"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = ''profile-pictures'' AND
        SPLIT_PART(name, ''/'', 1) = auth.uid()::text
      )
    ';
    
    -- Allow public to view profile pictures
    EXECUTE '
      CREATE POLICY "Allow public to view profile pictures"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = ''profile-pictures'')
    ';
  END IF;
END $$;