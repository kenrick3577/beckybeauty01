/*
  # Add updated_at column to users table

  1. Changes
    - Add `updated_at` timestamp column to the `users` table
    - Set default value to now()
  
  2. Purpose
    - Fix errors related to the missing updated_at column that's referenced by triggers
    - Enable proper timestamp tracking for user record updates
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END $$;