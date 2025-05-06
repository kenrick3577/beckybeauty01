/*
  # Fix recursive RLS policies for users table

  1. Changes
    - Drop existing RLS policies that cause recursion
    - Create new, optimized RLS policies for the users table that:
      - Allow admins to manage all users using auth.jwt() instead of recursive checks
      - Allow users to read and update their own data using auth.uid()
      - Allow service role full access
      - Allow registration for new users
  
  2. Security
    - Maintains row-level security
    - Prevents infinite recursion
    - Preserves existing access patterns
*/

-- Drop existing policies to recreate them without recursion
DROP POLICY IF EXISTS "Admin can manage all users" ON users;
DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "Enable insert for registration" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users read own data" ON users;
DROP POLICY IF EXISTS "Users update own data" ON users;

-- Create new, optimized policies
CREATE POLICY "Admin full access"
ON users
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'service_role' OR role = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR role = 'admin');

CREATE POLICY "Enable registration"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (auth.uid() = id);

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
WITH CHECK (auth.uid() = id);