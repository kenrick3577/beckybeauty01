/*
  # Add updated_at column to users table
  
  1. Changes
    - Add `updated_at` column to the `users` table
    - This column will store the timestamp of when a user record was last updated
    - Set default value to the current timestamp (now())
    - Make the column nullable to accommodate existing records
  
  2. Purpose
    - Enable tracking of when user records are modified
    - Support profile picture upload functionality that depends on this column
*/

-- Add updated_at column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END $$;

-- Create or replace the trigger function for updating the modified column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
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