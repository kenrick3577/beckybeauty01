/*
  # Fix Users Table RLS Policies

  1. Changes
    - Simplify and fix RLS policies for the users table
    - Ensure authenticated users can read their own profile
    - Ensure admins can read all profiles
    - Clean up redundant policies

  2. Security
    - Maintain strict RLS enforcement
    - Ensure users can only access their own data
    - Grant appropriate admin access
*/

-- Drop existing policies to clean up and simplify
DROP POLICY IF EXISTS "Admin read all" ON public.users;
DROP POLICY IF EXISTS "Admin write all" ON public.users;
DROP POLICY IF EXISTS "Public registration" ON public.users;
DROP POLICY IF EXISTS "Service role access" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;

-- Create new, simplified policies
CREATE POLICY "Enable read access for authenticated users"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR 
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Enable update access for users to their own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert access for registration"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable admin full access"
ON public.users
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);