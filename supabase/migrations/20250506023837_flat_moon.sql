/*
  # Add updated_at column to users table
  
  1. Changes
    - Add updated_at column to users table
    - Create trigger to automatically update updated_at column
    - Add function for profile picture updates
    
  2. Security
    - Maintain existing permissions
    - Fix profile picture upload functionality
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
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    
    -- Update existing rows to set updated_at to current timestamp
    UPDATE users SET updated_at = now() WHERE updated_at IS NULL;
  END IF;
END $$;

-- Create a trigger to automatically update the updated_at column
-- when a record is modified (only if it doesn't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;

-- Drop the existing function first to avoid the return type error
DROP FUNCTION IF EXISTS update_profile_picture(uuid, text);

-- Create a function to safely update profile picture URL without triggering the updated_at trigger
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