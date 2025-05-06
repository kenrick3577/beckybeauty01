/*
  # Fix infinite recursion in users table RLS policies
  
  1. Changes
    - Drop existing policies that cause recursion
    - Create new policies using JWT claims
    - Fix admin access without recursive queries
    
  2. Security
    - Maintains proper access control
    - Prevents infinite recursion
    - Preserves existing functionality
*/

-- First disable RLS to avoid conflicts while updating policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
    END LOOP;
END
$$;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new non-recursive policies
CREATE POLICY "enable_insert_for_registration"
ON public.users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "enable_select_for_users"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  auth.jwt() ->> 'role' = 'service_role' OR
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "enable_update_for_users"
ON public.users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR
  auth.jwt() ->> 'role' = 'service_role' OR
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id OR
  auth.jwt() ->> 'role' = 'service_role' OR
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
);

-- Update auth.users to ensure admin role is set in metadata
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'iceiceiceiceice5@gmail.com';

-- Update users table to ensure admin role is set
UPDATE users
SET role = 'admin'
WHERE email = 'iceiceiceiceice5@gmail.com'
AND id IS NOT NULL;