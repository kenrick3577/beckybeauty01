/*
  # Fix updated_at column for users table

  1. Changes
     - Add updated_at column to users table if it doesn't exist
     - Create trigger to automatically update this column
     - Create function to safely update profile picture URL
  
  2. Security
     - Maintains existing row-level security
     - Trigger runs with security definer privileges
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

-- Drop the existing function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS update_profile_picture(uuid, text);

-- Create a new function to update profile picture URL
CREATE FUNCTION update_profile_picture(user_id UUID, picture_url TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN;
BEGIN
  UPDATE users
  SET 
    profile_picture_url = picture_url,
    updated_at = now()
  WHERE id = user_id;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_profile_picture(UUID, TEXT) TO authenticated;