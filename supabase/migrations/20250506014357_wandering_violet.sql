/*
  # Create profile picture update function

  1. New Functions
    - `update_profile_picture` - A dedicated function to safely update a user's profile picture URL
      without triggering the `update_modified_column()` function that expects an `updated_at` column

  2. Purpose
    - Provides a safe way to update just the profile picture URL without affecting other columns
    - Avoids errors related to missing `updated_at` column in the users table
*/

-- Create a function to safely update profile picture URL
CREATE OR REPLACE FUNCTION update_profile_picture(user_id UUID, picture_url TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET profile_picture_url = picture_url
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_profile_picture(UUID, TEXT) TO authenticated;