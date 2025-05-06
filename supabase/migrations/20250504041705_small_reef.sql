/*
  # Fix users table RLS policies
  
  1. Changes
    - Drop all existing policies to avoid conflicts
    - Create new non-recursive policies for admin access
    - Add proper user access controls
    - Fix infinite recursion issue
    
  2. Security
    - Maintains proper access control
    - Prevents infinite recursion
    - Preserves user data privacy
*/

-- First drop ALL existing policies
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

-- Create new non-recursive policies
CREATE POLICY "service_role_access"
ON public.users
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "admin_access"
ON public.users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "users_read_own"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "enable_registration"
ON public.users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

-- Update auth.users to ensure admin role is set in metadata
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'iceiceiceiceice5@gmail.com';