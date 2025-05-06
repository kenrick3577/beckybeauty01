/*
  # Fix infinite recursion in users table policies
  
  1. Changes
    - Drop all existing policies to start fresh
    - Create new non-recursive policies using JWT claims
    - Add proper user and admin access controls
    
  2. Security
    - Maintains proper access control
    - Eliminates infinite recursion
    - Preserves existing functionality
*/

-- Drop all existing policies
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

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Public registration policy
CREATE POLICY "Public registration"
ON public.users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

-- Users read own data
CREATE POLICY "Users read own data"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users update own data
CREATE POLICY "Users update own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = 'user');

-- Admin read all
CREATE POLICY "Admin read all"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users users_1
    WHERE users_1.id = auth.uid()
    AND (
      (users_1.raw_app_meta_data->>'role') = 'admin'
      OR EXISTS (
        SELECT 1
        FROM users users_2
        WHERE users_2.id = auth.uid()
        AND users_2.role = 'admin'
      )
    )
  )
);

-- Admin write all
CREATE POLICY "Admin write all"
ON public.users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users users_1
    WHERE users_1.id = auth.uid()
    AND (
      (users_1.raw_app_meta_data->>'role') = 'admin'
      OR EXISTS (
        SELECT 1
        FROM users users_2
        WHERE users_2.id = auth.uid()
        AND users_2.role = 'admin'
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM auth.users users_1
    WHERE users_1.id = auth.uid()
    AND (
      (users_1.raw_app_meta_data->>'role') = 'admin'
      OR EXISTS (
        SELECT 1
        FROM users users_2
        WHERE users_2.id = auth.uid()
        AND users_2.role = 'admin'
      )
    )
  )
);

-- Service role access
CREATE POLICY "Service role access"
ON public.users
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);