/*
  # Fix users table RLS policies without JWT claim table dependency
  
  1. Changes
    - Drop existing policies
    - Create new policies for user access
    - Fix admin access using proper JWT checks
    - Ensure service role access
    
  2. Security
    - Maintains proper access control
    - Users can only access their own data
    - Admins can access all data
    - Service role has full access
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

-- Public insert policy for registration
CREATE POLICY "Enable insert for registration"
ON public.users
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = id
);

-- Users can view their own data
CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- Users can update their own data
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

-- Admin access using role check
CREATE POLICY "Admin full access"
ON public.users
FOR ALL
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

-- Service role access
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

-- Ensure admin user exists
UPDATE users
SET role = 'admin'
WHERE email = 'iceiceiceiceice5@gmail.com'
AND id IS NOT NULL;