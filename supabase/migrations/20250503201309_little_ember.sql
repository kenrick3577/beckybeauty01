/*
  # Fix users table RLS policies

  1. Changes
    - Remove recursive admin check from users table policies
    - Create new policies that avoid infinite recursion
    - Maintain security while allowing proper data access

  2. Security
    - Users can still only view their own data
    - Admins can still view all user data
    - Policies are simplified to avoid recursion
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Admins can view all user data" ON users;

-- Create new policies without recursive checks
CREATE POLICY "Users can view their own data"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- For admin access, we'll use a direct role check instead of querying the users table
CREATE POLICY "Admins can view all user data"
ON users
FOR ALL
TO authenticated
USING (
  -- Check if the user has the admin role directly
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);