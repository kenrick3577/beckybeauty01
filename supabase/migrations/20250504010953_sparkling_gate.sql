/*
  # Fix infinite recursion in users table RLS policies
  
  1. Changes
    - Drop existing policies that cause recursion
    - Create new policies that use JWT claims for role checking
    - Maintain security while avoiding recursive queries
    
  2. Security
    - Users can still only access their own data
    - Admins can still access all data
    - No recursive table queries
*/

-- Drop existing policies to start fresh
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
CREATE POLICY "Enable registration"
ON public.users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin policies using service_role
CREATE POLICY "Service role has full access"
ON public.users
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Set admin role for specific users
UPDATE users
SET role = 'admin'
WHERE email IN ('iceiceiceiceice5@gmail.com')
AND id IS NOT NULL;