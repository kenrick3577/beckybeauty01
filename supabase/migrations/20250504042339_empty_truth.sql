/*
  # Fix Users Table RLS Policies

  1. Changes
    - Drop existing policies on users table
    - Create new comprehensive RLS policies for users table
    
  2. Security
    - Enable RLS on users table (if not already enabled)
    - Add policies for:
      - Users can read their own data
      - Users can update their own data
      - Admins can read and manage all user data
      - Service role has full access
      - Public can insert during registration
*/

-- First, drop any existing policies on the users table
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can read own data" ON users;
  DROP POLICY IF EXISTS "Users can update own data" ON users;
  DROP POLICY IF EXISTS "Allow registration" ON users;
  DROP POLICY IF EXISTS "Service role has full access" ON users;
  DROP POLICY IF EXISTS "Admins can manage all users" ON users;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new policies

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  OR auth.jwt()->>'role' = 'service_role'
);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow public registration
CREATE POLICY "Allow registration"
ON users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

-- Service role has full access
CREATE POLICY "Service role has full access"
ON users
FOR ALL
TO authenticated
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Admins can manage all users
CREATE POLICY "Admins can manage all users"
ON users
FOR ALL
TO authenticated
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');