/*
  # Add updated_at column to users table

  1. Changes
    - Add `updated_at` column to the `users` table with the following properties:
      - Type: timestamp with time zone
      - Default value: now()
      - Nullable: true
  
  2. Why This Change is Needed
    - Frontend code and RPC functions are trying to access this column
    - Needed for tracking when user records were last modified
*/

-- Add updated_at column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at timestamp with time zone DEFAULT now();
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