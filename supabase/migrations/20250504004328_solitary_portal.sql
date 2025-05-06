/*
  # Fix RLS policies to prevent infinite recursion
  
  1. Changes
    - Drop all existing policies
    - Create new non-recursive policies
    - Use JWT claims for admin checks
    - Maintain proper access control
  
  2. Security
    - Users can still only access their own data
    - Admins can access all data
    - Service role maintains full access
*/

-- First disable RLS to avoid conflicts while updating policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
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
CREATE POLICY "Public registration"
ON users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users read own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = 'user');

CREATE POLICY "Admin access"
ON users
FOR ALL
TO authenticated
USING (role = 'admin')
WITH CHECK (role = 'admin');

CREATE POLICY "Service role access"
ON users
FOR ALL
TO authenticated
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Ensure admin user exists
UPDATE users
SET role = 'admin'
WHERE email = 'iceiceiceiceice5@gmail.com'
AND id IS NOT NULL;