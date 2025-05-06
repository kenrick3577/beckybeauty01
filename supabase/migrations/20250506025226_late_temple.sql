/*
  # Fix update_profile_picture function
  
  1. Changes
    - Drop existing function that has incompatible return type
    - Create new function that returns the updated user record
    
  2. Security
    - Function maintains SECURITY DEFINER to run with owner privileges
    - Limited to updating only the profile_picture_url field
*/

-- Drop the existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS update_profile_picture(uuid, text);

-- Create or replace the update_profile_picture function with proper return type
CREATE OR REPLACE FUNCTION update_profile_picture(user_id UUID, picture_url TEXT)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY
  UPDATE users
  SET profile_picture_url = picture_url
  WHERE id = user_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_profile_picture(UUID, TEXT) TO authenticated;