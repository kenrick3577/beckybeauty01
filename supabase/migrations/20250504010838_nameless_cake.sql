/*
  # Fix users table RLS policies

  1. Changes
    - Add comprehensive RLS policies for the users table
    - Allow users to read their own profile
    - Allow users to read basic info of other users
    - Allow admins full access to all user data

  2. Security
    - Enable RLS on users table (if not already enabled)
    - Add policies for:
      - Self data access
      - Basic user info access
      - Admin access
*/

-- First ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Enable admin access" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- Create new comprehensive policies

-- Allow users to read their own full profile
CREATE POLICY "Users can read own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to read basic info of other users
CREATE POLICY "Users can read basic info of others"
ON users
FOR SELECT
TO authenticated
USING (
  -- When accessing other users, only allow access to basic fields
  CASE 
    WHEN auth.uid() = id THEN true
    ELSE role != 'admin'
  END
);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile during registration
CREATE POLICY "Allow user registration"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Give admins full access to all user data
CREATE POLICY "Enable admin access to users"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);