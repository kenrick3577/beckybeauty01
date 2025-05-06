/*
  # Add update_profile function
  
  1. New Functions
    - `update_profile`: Allows users to update their profile information
      - Parameters:
        - p_name: text (user's full name)
        - p_email: text (user's email address)
        - p_mobile: text (user's mobile number)
      - Returns: JSON with success status and message
  
  2. Security
    - Function can only be executed by authenticated users
    - Users can only update their own profile
    - Email uniqueness is enforced
*/

CREATE OR REPLACE FUNCTION public.update_profile(
  p_name text,
  p_email text,
  p_mobile text
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
    mobile = p_mobile
  WHERE id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Profile updated successfully'
  );
END;
$$;