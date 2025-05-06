/*
  # Fix users table RLS policies

  1. Changes
    - Drop existing RLS policies for users table
    - Create new, more specific RLS policies:
      - Allow users to read their own profile
      - Allow admins to read all profiles
      - Allow service role to have full access
      - Allow public to insert during registration
      - Allow users to update their own profile
  
  2. Security
    - Ensures RLS is enabled
    - Implements proper access control based on user roles
    - Maintains data privacy by restricting access to own data
*/

-- First enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "Enable insert for registration" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new policies with proper access controls

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users admin
    WHERE admin.id = auth.uid() AND admin.role = 'admin'
  )
);

-- Allow service role full access
CREATE POLICY "Service role has full access"
ON users
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'service_role'
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'service_role'
);

-- Allow public to insert during registration
CREATE POLICY "Allow registration"
ON users
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = id
);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);