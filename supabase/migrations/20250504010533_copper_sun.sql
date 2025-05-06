/*
  # Fix users table RLS policies to avoid recursion

  1. Changes
    - Drop all existing policies that may cause recursion
    - Create new policies using JWT claims and auth.users table
    - Ensure proper access control for all user types
    - Fix admin role detection
    
  2. Security
    - Maintains same security model
    - Prevents infinite recursion
    - Ensures proper data access
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
WITH CHECK (auth.uid() = id);

-- Allow public registration
CREATE POLICY "Public registration"
ON users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

-- Admin policies using auth.users metadata to avoid recursion
CREATE POLICY "Admin read all"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_app_meta_data->>'role' = 'admin'
      OR auth.users.raw_app_meta_data->>'is_admin' = 'true'
    )
  )
);

CREATE POLICY "Admin write all"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_app_meta_data->>'role' = 'admin'
      OR auth.users.raw_app_meta_data->>'is_admin' = 'true'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_app_meta_data->>'role' = 'admin'
      OR auth.users.raw_app_meta_data->>'is_admin' = 'true'
    )
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
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin", "is_admin": true}'::jsonb
WHERE email = 'iceiceiceiceice5@gmail.com';

-- Update users table to ensure admin role is set
UPDATE users
SET role = 'admin'
WHERE email = 'iceiceiceiceice5@gmail.com'
AND id IS NOT NULL;