/*
  # Fix RLS policies for users table
  
  1. Changes
    - Drop all existing policies to avoid conflicts
    - Create new non-recursive policies for user access
    - Create new non-recursive policies for admin access
    - Add service role access policy
    - Ensure proper role checking without recursion
  
  2. Security
    - Users can only view and update their own data
    - Admins can view and manage all users
    - Service role has full access
    - Prevents infinite recursion in policy evaluation
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

-- Create basic user policies
CREATE POLICY "Users can view own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = 'user');

-- Allow public registration
CREATE POLICY "Public registration"
ON users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

-- Admin policies using JWT claims to avoid recursion
CREATE POLICY "Admin read all"
ON users
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin write all"
ON users
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
);

-- Service role access
CREATE POLICY "Service role access"
ON users
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Update auth.users to ensure admin role is set in metadata
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'iceiceiceiceice5@gmail.com';

-- Update users table to ensure admin role is set
UPDATE users
SET role = 'admin'
WHERE email = 'iceiceiceiceice5@gmail.com'
AND id IS NOT NULL;