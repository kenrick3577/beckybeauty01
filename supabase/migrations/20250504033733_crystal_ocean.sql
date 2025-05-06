/*
  # Fix users table RLS policies for admin access
  
  1. Changes
    - Drop existing policies
    - Create new simplified policies
    - Fix admin access using service role
    
  2. Security
    - Maintain proper access control
    - Fix admin data access
    - Prevent recursion issues
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

-- Create simplified policies
CREATE POLICY "Enable insert for registration"
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

-- Admin policies using service role
CREATE POLICY "Admin full access"
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
WHERE email = 'iceiceiceice5@gmail.com';

-- Update users table admin role
UPDATE users
SET role = 'admin'
WHERE email = 'iceiceiceice5@gmail.com'
AND id IS NOT NULL;