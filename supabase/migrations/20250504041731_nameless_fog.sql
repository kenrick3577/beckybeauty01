/*
  # Update users table RLS policies

  1. Changes
    - Add new RLS policies for users table to fix permission denied errors
    - Allow users to read their own profile data
    - Allow admins to read all user data
    - Allow service role to have full access
    - Allow public access for registration

  2. Security
    - Ensures users can only access their own data
    - Maintains admin access to all user data
    - Preserves service role access
    - Enables secure user registration
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "admin_access" ON users;
DROP POLICY IF EXISTS "service_role_access" ON users;
DROP POLICY IF EXISTS "enable_registration" ON users;

-- Re-create policies with proper permissions
CREATE POLICY "users_read_own"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "admin_access"
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

CREATE POLICY "service_role_access"
ON users
FOR ALL
TO authenticated
USING (
  (current_setting('request.jwt.claims', true)::json->>'role')::text = 'service_role'
)
WITH CHECK (
  (current_setting('request.jwt.claims', true)::json->>'role')::text = 'service_role'
);

CREATE POLICY "enable_registration"
ON users
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = id
);