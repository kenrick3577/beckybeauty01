/*
  # Fix infinite recursion in users table RLS policies

  1. Changes
     - Replace recursive RLS policies on the users table that were causing infinite recursion
     - Fix admin role checking by using auth.jwt() instead of querying the users table
     
  2. Security
     - Maintains same level of security but eliminates the recursion issue
     - Policies still restrict access based on user role and ID
*/

-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Create new policies that avoid recursion by checking role from JWT instead of querying users table
CREATE POLICY "Admins can update any user" 
ON public.users
FOR UPDATE TO authenticated
USING (auth.jwt() ->> 'app_metadata'::text = '{"role":"admin"}'::text OR (auth.jwt() ->> 'role'::text) = 'admin'::text)
WITH CHECK (auth.jwt() ->> 'app_metadata'::text = '{"role":"admin"}'::text OR (auth.jwt() ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Admins can view all users" 
ON public.users
FOR SELECT TO authenticated
USING (auth.jwt() ->> 'app_metadata'::text = '{"role":"admin"}'::text OR (auth.jwt() ->> 'role'::text) = 'admin'::text);