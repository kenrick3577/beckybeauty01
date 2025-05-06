/*
  # Fix recursive RLS policies for users table

  1. Changes
    - Remove recursive policies that query the users table within their own definition
    - Simplify admin access policy to use role from JWT claims
    - Maintain existing access patterns but implement them more efficiently

  2. Security
    - Maintains same level of access control
    - Prevents infinite recursion
    - Uses JWT claims for role checks instead of recursive queries
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Enable insert for registration" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;

-- Create new, non-recursive policies
CREATE POLICY "Admin full access"
ON users
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Service role full access"
ON users
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Enable insert for registration"
ON users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');