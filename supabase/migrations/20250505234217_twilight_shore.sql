/*
  # Update profile functions to fix parameter conflict
  
  1. Changes
    - Drop existing update_profile function
    - Create new update_profile function with all necessary parameters
    - Add profile_picture_url parameter to maintain DB consistency
    
  2. Security
    - Maintains proper security model
    - Preserves user data privacy
    - Ensures only authorized users can update profiles
*/

-- Drop existing function to avoid conflicts
DROP FUNCTION IF EXISTS public.update_profile(text, text, text);
DROP FUNCTION IF EXISTS public.update_profile(text, text, text, text);

-- Create new combined function
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
    profile_picture_url = COALESCE(p_profile_picture_url, profile_picture_url)
  WHERE id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Profile updated successfully'
  );
END;
$$;

-- Grant permissions on the function
GRANT EXECUTE ON FUNCTION public.update_profile TO authenticated;