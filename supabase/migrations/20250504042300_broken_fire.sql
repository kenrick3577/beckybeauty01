/*
  # Fix users table RLS policies
  
  1. Changes
    - Drop existing policies to avoid conflicts
    - Create simplified policies for user access
    - Fix admin access using auth.users metadata
    - Ensure proper service role access
    
  2. Security
    - Users can only access their own data
    - Admins can access all data
    - Service role has full access
*/

-- Drop existing policies
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

-- Create new policies
CREATE POLICY "Allow registration"
ON public.users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to read own data"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND au.raw_app_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Allow users to update own data"
ON public.users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND au.raw_app_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id OR
  auth.jwt()->>'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND au.raw_app_meta_data->>'role' = 'admin'
  )
);

-- Update admin metadata
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'iceiceiceiceice5@gmail.com';

-- Update users table admin role
UPDATE users
SET role = 'admin'
WHERE email = 'iceiceiceiceice5@gmail.com'
AND id IS NOT NULL;