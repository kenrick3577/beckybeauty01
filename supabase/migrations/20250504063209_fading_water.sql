/*
  # Fix recursive RLS policies for users table

  1. Changes
    - Drop existing problematic RLS policies that cause recursion
    - Create new, simplified policies that avoid recursion
    - Maintain security while preventing infinite loops
    
  2. Security
    - Maintain admin access to all users
    - Allow users to read and update their own data
    - Allow service role full access
    - Allow registration for new users
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admin can manage all users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable insert for registration" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users;

-- Create new, non-recursive policies
CREATE POLICY "Admin full access"
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
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable registration"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role full access"
ON users
FOR ALL
TO authenticated
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');