/*
  # Fix admin member view access
  
  1. Changes
    - Drop existing policies that may be causing conflicts
    - Create simplified policies for admin access
    - Add policy for admins to view all users without recursion
    - Update admin user role
  
  2. Security
    - Maintains proper access control
    - Prevents infinite recursion
    - Ensures admin can view all users
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
WITH CHECK ((auth.uid() = id) AND (role = 'user'));

-- Admin policies using direct role check
CREATE POLICY "Admin read all"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'admin'
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
    AND auth.users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'admin'
  )
);

-- Service role access
CREATE POLICY "Service role access"
ON users
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Ensure admin user exists and has correct role
UPDATE users
SET 
  role = 'admin',
  account_status = 'active',
  account_type = 'premium'
WHERE email = 'iceiceiceiceice5@gmail.com'
AND id IS NOT NULL;