/*
  # Fix infinite recursion in users table RLS policies
  
  1. Changes
    - Drop existing policies that cause recursion
    - Create new non-recursive policies using JWT claims
    - Fix admin access checks
    
  2. Security
    - Maintains proper access control
    - Prevents infinite recursion
    - Preserves existing functionality
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

-- Create new non-recursive policies
CREATE POLICY "Enable registration"
ON public.users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own data"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin access using JWT claims
CREATE POLICY "Admin access"
ON public.users
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
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