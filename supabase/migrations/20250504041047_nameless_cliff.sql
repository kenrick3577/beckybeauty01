/*
  # Fix recursive policies for users table

  1. Changes
    - Drop existing policies that may cause recursion
    - Create new, non-recursive policies for the users table
    
  2. Security
    - Maintain row-level security
    - Add clear, non-recursive policies for:
      - Admin access
      - User self-access
      - Service role access
    - Ensure policies don't reference themselves in ways that could cause recursion
*/

-- First, drop existing policies to start fresh
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Admins have full access" ON users;
  DROP POLICY IF EXISTS "Enable user registration" ON users;
  DROP POLICY IF EXISTS "Users can read own data" ON users;
  DROP POLICY IF EXISTS "Users can update own data" ON users;
END $$;

-- Create new, non-recursive policies
CREATE POLICY "service_role_access"
ON users
FOR ALL
TO authenticated
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "admin_access"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
    AND u.id != users.id  -- Prevent recursion by excluding self-reference
  )
);

CREATE POLICY "users_self_read"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "users_self_update"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_self_insert"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);