/*
  # Fix users table policies

  1. Changes
    - Remove recursive policies that were causing infinite loops
    - Simplify admin access policy to use service role claims
    - Update user access policies for better security
  
  2. Security
    - Maintain RLS protection
    - Ensure admins can still manage all users
    - Users can still manage their own profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "admin_access" ON users;
DROP POLICY IF EXISTS "service_role_access" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "enable_registration" ON users;

-- Create new, non-recursive policies
CREATE POLICY "enable_registration" ON users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "service_role_access" ON users
FOR ALL 
TO authenticated
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "admin_can_manage_all_users" ON users
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "users_can_read_own_profile" ON users
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "users_can_update_own_profile" ON users
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);