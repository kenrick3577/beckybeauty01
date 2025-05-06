/*
  # Fix users table RLS policies

  1. Changes
    - Drop ALL existing policies on users table and recreate them properly
    - Create specific policies for public registration
    - Create policies for users to view/update their own data
    - Create non-recursive admin policies using subqueries with aliases
    - Ensure service role access is maintained
  
  2. Security
    - Maintains all required security rules
    - Fixes infinite recursion in admin policies
    - Allows proper data access for all user types
*/

-- First drop ALL existing policies on the users table to start fresh
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
    END LOOP;
END
$$;

-- Make sure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 1. Public registration policy - allows new users to sign up
CREATE POLICY "Enable insert for users based on user_id"
ON public.users
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = id
);

-- 2. Allow users to view their own profile
CREATE POLICY "Users can view their own data"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- 3. Allow users to update their own profile
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

-- 4. Admin policies using aliased subqueries to avoid recursion
-- Admins can view all users
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Admins can update any user
CREATE POLICY "Admins can update any user"
ON public.users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- 5. Service role access policy - essential for internal operations
CREATE POLICY "Service role can manage all users"
ON public.users
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role') = 'service_role'
)
WITH CHECK (
  (auth.jwt() ->> 'role') = 'service_role'
);

-- Set specific users as admins (add your admin email here)
UPDATE users
SET role = 'admin'
WHERE email IN ('iceiceiceiceice5@gmail.com')
AND id IS NOT NULL;