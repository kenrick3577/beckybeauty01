/*
  # Fix users table policies infinite recursion

  1. Changes
    - Replace recursive policies on the users table that were causing infinite recursion
    - Modify "Admins can update any user" policy to use auth.jwt() instead of a recursive subquery
    - Modify "Admins can view all users" policy to use auth.jwt() instead of a recursive subquery
  
  2. Security
    - Maintain the same security intent while eliminating recursion
    - Policies still restrict access based on user role
*/

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Create new non-recursive policies that use the JWT claims
CREATE POLICY "Admins can update any user" 
ON public.users
FOR UPDATE 
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all users" 
ON public.users
FOR SELECT 
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');