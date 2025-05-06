/*
  # Fix Users Table RLS Policies

  1. Changes
    - Drop existing conflicting policies
    - Add new comprehensive policies for user data access
    
  2. Security
    - Enable RLS on users table (already enabled)
    - Add policies for:
      - Users can read their own data
      - Admins can read all user data
      - Service role has full access
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admin access" ON users;
DROP POLICY IF EXISTS "Service role access" ON users;

-- Create new policies with proper access controls
CREATE POLICY "Users can read own data"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Admins can read all users"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'role')::text = 'admin'
  )
);

CREATE POLICY "Service role has full access"
ON public.users
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'service_role'
);