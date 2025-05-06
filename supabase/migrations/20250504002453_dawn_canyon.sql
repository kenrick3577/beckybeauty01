/*
  # Fix users table RLS policies for admin access
  
  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policies that properly handle admin access
    - Ensure admins can view and manage all users
    - Maintain user privacy for non-admin users
  
  2. Security
    - Users can still only view their own data
    - Admins can view and manage all user data
    - Maintains proper RLS protection
*/

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.users;
    DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
    DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
    DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
END $$;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own data
CREATE POLICY "Users can view their own data"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

-- Allow public registration
CREATE POLICY "Enable insert for users based on user_id"
ON public.users
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = id
);

-- Allow admins to view all users
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Allow admins to update any user
CREATE POLICY "Admins can update any user"
ON public.users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Allow service role full access
CREATE POLICY "Service role can manage all users"
ON public.users
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'service_role'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'service_role'
);

-- Ensure admin users are set
UPDATE users
SET role = 'admin'
WHERE email IN ('iceiceiceiceice5@gmail.com')
AND id IS NOT NULL;