/*
  # Add updated_at column to users table
  
  1. Changes
    - Add `updated_at` timestamp column to the `users` table
    - This column is required for the `update_users_updated_at` trigger to function correctly
  
  2. Context
    - The trigger `update_users_updated_at` attempts to update the `updated_at` column on user record changes
    - The RPC function `update_profile_picture` also expects this column to exist
    - Several application components rely on this column for tracking when user data was last modified
*/

-- Add updated_at column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
END $$;