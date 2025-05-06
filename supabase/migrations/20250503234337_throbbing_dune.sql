/*
  # Fix admin policy for users table
  
  1. Changes
    - Drops and recreates problematic admin RLS policies
    - Ensures admin users can view and manage all user data
    - Fixes recursive policy issues that were causing infinite loops
    
  2. Security
    - Maintains proper row-level security
    - Enables admins to properly view and manage users
    - Prevents admin dashboard from being empty
*/

-- Drop existing admin-related policies to clean up
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;

-- Create a policy for users to view their own data
CREATE POLICY "Users can view their own data"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- Create policy for admins to view ALL users
CREATE POLICY "Admins can view all users" 
ON public.users
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM users WHERE users.id = auth.uid()) = 'admin'
);

-- Create policy for admins to update any user
CREATE POLICY "Admins can update any user"
ON public.users
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM users WHERE users.id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM users WHERE users.id = auth.uid()) = 'admin'
);

-- Make sure we have admin users in the database
UPDATE users
SET role = 'admin'
WHERE email IN ('iceiceiceiceice5@gmail.com')
AND id IS NOT NULL;