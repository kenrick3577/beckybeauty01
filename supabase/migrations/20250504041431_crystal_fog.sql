/*
  # Fix users table permissions

  1. Changes
    - Add RLS policies for users table to allow:
      - Public access for registration
      - Users to read their own profile
      - Service role to have full access
      - Admins to have full access

  2. Security
    - Ensures RLS is enabled
    - Adds specific policies for different access levels
    - Maintains data privacy while allowing necessary operations
*/

-- First ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "enable_registration" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "admin_full_access" ON users;

-- Allow users to read their own profile
CREATE POLICY "users_read_own"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- Allow public registration
CREATE POLICY "enable_registration"
ON users
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = id
);

-- Allow users to update their own profile
CREATE POLICY "users_update_own"
ON users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

-- Allow service role and admins full access
CREATE POLICY "admin_full_access"
ON users
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'service_role' OR
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'service_role' OR
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);