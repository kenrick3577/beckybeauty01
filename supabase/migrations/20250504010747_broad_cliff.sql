/*
  # Fix users table RLS policies

  1. Changes
    - Remove recursive policies on users table
    - Implement new, non-recursive policies for admin and user access
    - Maintain security while preventing infinite recursion

  2. Security
    - Replace role-based policy with direct admin check using auth.jwt()
    - Maintain user access to their own data
    - Ensure admins can still manage all users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable admin full access" ON users;
DROP POLICY IF EXISTS "Enable insert access for registration" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update access for users to their own data" ON users;

-- Create new, non-recursive policies
CREATE POLICY "Enable admin access"
ON users
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.is_super_admin = true
  )
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.is_super_admin = true
  )
);

CREATE POLICY "Users can read their own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow user registration"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);