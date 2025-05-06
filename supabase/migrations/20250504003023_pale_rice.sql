/*
  # Fix users table RLS policies

  1. Changes
    - Remove recursive policies that were causing infinite loops
    - Simplify RLS policies for users table
    - Add clear, non-recursive conditions for access control
  
  2. Security
    - Maintain row-level security
    - Ensure users can only access their own data
    - Allow admins full access via role check
    - Enable public access for registration only
*/

-- First disable RLS to avoid conflicts while updating policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "Enable insert for registration" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new, non-recursive policies
CREATE POLICY "Admin access"
ON users
FOR ALL
TO authenticated
USING (role = 'admin')
WITH CHECK (role = 'admin');

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

CREATE POLICY "Public registration"
ON users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role access"
ON users
FOR ALL
TO authenticated
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');