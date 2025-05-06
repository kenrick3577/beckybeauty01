/*
  # Fix Users Table RLS Policies
  
  1. Changes
    - Drop all existing policies to start fresh
    - Create new non-recursive policies for all operations
    - Use auth.jwt() for role checks instead of recursive table queries
    - Maintain proper access control for all user types
  
  2. Security
    - Users can only access their own data
    - Admins can access all data
    - Service role has full access
    - Public registration enabled
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
CREATE POLICY "users_read_own"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  auth.jwt() ->> 'role' = 'service_role'
);

CREATE POLICY "users_update_own"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow public registration
CREATE POLICY "enable_registration"
ON users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

-- Admin access using JWT claims and metadata
CREATE POLICY "admin_full_access"
ON users
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_app_meta_data->>'role' = 'admin' OR
      auth.users.raw_app_meta_data->>'is_admin' = 'true'
    )
  )
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_app_meta_data->>'role' = 'admin' OR
      auth.users.raw_app_meta_data->>'is_admin' = 'true'
    )
  )
);

-- Update admin metadata in auth.users table
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'iceiceiceiceice5@gmail.com';

-- Update admin role in users table
UPDATE users
SET role = 'admin'
WHERE email = 'iceiceiceiceice5@gmail.com'
AND id IS NOT NULL;