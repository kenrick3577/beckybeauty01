/*
  # Add updated_at field to users table

  1. Changes
    - Add `updated_at` timestamp field to the `users` table
    - Set default value to `now()`
    - Update existing rows to set value to current timestamp
  
  2. Reason
    - The `update_profile` RPC function and trigger are attempting to access this field,
      but it doesn't exist in the table schema, causing errors when uploading profile
      pictures and updating user profiles
*/

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