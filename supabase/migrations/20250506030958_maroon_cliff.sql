/*
  # Fix users table updated_at column and profile picture upload
  
  1. Changes
    - Add updated_at column to users table if it doesn't exist
    - Create or replace the trigger function for updating modified columns
    - Create trigger to automatically update the updated_at column
    - Drop and recreate update_profile_picture function with proper return type
    
  2. Security
    - Maintain proper access control
    - Enable secure profile picture management
*/

-- Add updated_at column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    
    -- Update existing rows to set updated_at to current timestamp
    UPDATE public.users SET updated_at = now() WHERE updated_at IS NULL;
  END IF;
END $$;

-- Create or replace the trigger function for updating the modified column
CREATE OR REPLACE FUNCTION public.update_modified_column()
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
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_column();
  END IF;
END $$;

-- Drop the existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS public.update_profile_picture(uuid, text);

-- Create or replace the update_profile_picture function 
-- This function doesn't return users data to avoid schema issues
CREATE OR REPLACE FUNCTION public.update_profile_picture(user_id UUID, picture_url TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN;
BEGIN
  UPDATE public.users
  SET 
    profile_picture_url = picture_url,
    updated_at = now()
  WHERE id = user_id;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_profile_picture(UUID, TEXT) TO authenticated;