/*
  # Fix users table RLS policies

  1. Changes
    - Drop existing policies
    - Create new policies with correct JWT role checking syntax
    - Set up proper admin access
    - Enable public registration
    
  2. Security
    - Maintains RLS protection
    - Allows proper admin access
    - Preserves user data privacy
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

-- Allow public registration
CREATE POLICY "Enable insert for registration"
ON public.users
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = id
);

-- Allow users to view their own data
CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

-- Admin access policy
CREATE POLICY "Admin full access"
ON public.users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Service role access policy
CREATE POLICY "Service role full access"
ON public.users
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'service_role'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'service_role'
);

-- Set admin user
UPDATE users
SET role = 'admin'
WHERE email = 'iceiceiceiceice5@gmail.com'
AND id IS NOT NULL;