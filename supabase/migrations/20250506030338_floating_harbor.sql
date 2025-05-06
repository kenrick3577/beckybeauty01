-- Drop the existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS update_profile_picture(uuid, text);

-- Create or replace the update_profile_picture function with proper return type
CREATE OR REPLACE FUNCTION update_profile_picture(user_id UUID, picture_url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users
  SET profile_picture_url = picture_url
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_profile_picture(UUID, TEXT) TO authenticated;