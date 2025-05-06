/*
  # Final fix for users table RLS policies
  
  1. Changes
    - Clear all existing policies
    - Implement new non-recursive policies for each operation
    - Use JWT claims for admin role checking
    
  2. Security
    - Public can sign up
    - Users can view and update their own data
    - Admins can view and update any user
    - Service role has full access
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

-- 4. Admin policies using JWT metadata instead of recursively querying users table
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'app_metadata'::text) = '{"role":"admin"}'::text OR (auth.jwt() ->> 'role'::text) = 'admin'::text
);

CREATE POLICY "Admins can update any user"
ON public.users
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'app_metadata'::text) = '{"role":"admin"}'::text OR (auth.jwt() ->> 'role'::text) = 'admin'::text
)
WITH CHECK (
  (auth.jwt() ->> 'app_metadata'::text) = '{"role":"admin"}'::text OR (auth.jwt() ->> 'role'::text) = 'admin'::text
);

-- 5. Service role access policy
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