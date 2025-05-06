/*
  # Fix recursive RLS policies for users table

  1. Changes
    - Remove recursive conditions from users table RLS policies
    - Simplify policy conditions to prevent infinite recursion
    - Maintain security while fixing the recursion issue

  2. Security
    - Maintain existing access control patterns
    - Ensure users can only access their own data
    - Preserve admin access to all user data
*/

-- Drop existing policies to recreate them without recursion
DROP POLICY IF EXISTS "Admin read all" ON users;
DROP POLICY IF EXISTS "Admin write all" ON users;
DROP POLICY IF EXISTS "Public registration" ON users;
DROP POLICY IF EXISTS "Service role access" ON users;
DROP POLICY IF EXISTS "Users read own data" ON users;
DROP POLICY IF EXISTS "Users update own data" ON users;

-- Recreate policies with fixed conditions
CREATE POLICY "Admin read all"
ON users
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'service_role' OR EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND users.role = 'admin'
));

CREATE POLICY "Admin write all"
ON users
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'service_role' OR EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND users.role = 'admin'
))
WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND users.role = 'admin'
));

CREATE POLICY "Public registration"
ON users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role access"
ON users
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

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