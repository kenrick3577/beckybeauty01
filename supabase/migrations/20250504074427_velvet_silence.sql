/*
  # Fix users table RLS policies

  1. Changes
    - Drop existing policies that might conflict
    - Add new policies for users table:
      - Allow users to read their own data
      - Allow admins to read all user data
      - Allow service role to have full access
      - Allow public access for registration
  
  2. Security
    - Ensures RLS is enabled
    - Implements proper access control based on user roles
    - Maintains data privacy by limiting access to own data
*/

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admin access" ON users;
DROP POLICY IF EXISTS "Enable registration" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Service role access" ON users;

-- Create new policies
CREATE POLICY "Users can read own data"
ON users FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Users can update own data"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can manage all users"
ON users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Enable insert for registration"
ON users FOR INSERT
TO authenticated, anon
WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role has full access"
ON users FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'service_role'
);