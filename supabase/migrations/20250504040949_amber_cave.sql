/*
  # Fix users table RLS policies

  1. Changes
    - Drop existing policies that might be conflicting
    - Create new, more permissive policies for the users table
    - Ensure authenticated users can read their own data
    - Ensure admins can read all user data
    - Allow service role to have full access
  
  2. Security
    - Maintains RLS protection
    - Adds specific policies for different access patterns
    - Ensures users can only access their own data
    - Allows admins to manage all users
*/

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admin access" ON users;
DROP POLICY IF EXISTS "Enable registration" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new policies with proper access controls
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
  OR 
  (current_setting('role') = 'service_role')
);

CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable user registration"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins have full access"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
  OR 
  (current_setting('role') = 'service_role')
);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;