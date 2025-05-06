/*
  # Fix users table RLS policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Add policy for users to create their own profile during signup
    - Add policy for users to view their own data
    - Add policy for service role to manage all users
    - Enable RLS on users table

  2. Security
    - Users can only create their own profile with matching auth.uid()
    - Users can only view their own data
    - Service role has full access to manage users
*/

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all user data" ON public.users;

-- Allow users to create their own profile during signup
CREATE POLICY "Users can create their own profile"
ON public.users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

-- Allow users to view their own data
CREATE POLICY "Users can view their own data"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow service role full access
CREATE POLICY "Service role can manage all users"
ON public.users
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');