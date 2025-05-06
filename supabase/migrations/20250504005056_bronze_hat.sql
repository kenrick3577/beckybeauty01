/*
  # Fix users table permissions and policies
  
  1. Changes
    - Drop all existing policies to start fresh
    - Add comprehensive set of policies for all user types
    - Fix public registration policy
    - Add proper admin and service role policies
    
  2. Security
    - Users can view and update their own data
    - Admins can view and manage all users
    - Service role has full access
    - Public can register new accounts
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
WITH CHECK (
  auth.uid() = id AND role = 'user'
);

-- Admin read all
CREATE POLICY "Admin read all"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_app_meta_data->>'role' = 'admin'
      OR
      EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
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
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_app_meta_data->>'role' = 'admin'
      OR
      EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_app_meta_data->>'role' = 'admin'
      OR
      EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
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

-- Ensure admin users are set
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email IN ('iceiceiceiceice5@gmail.com');