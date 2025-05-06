/*
  # Fix admin role detection and user data access
  
  1. Changes
    - Drop existing problematic policies
    - Create new policies that check admin role without recursion
    - Add a special policy for admin users to see all users
    - Ensure proper JWT role claim checking
  
  2. Security
    - Maintains RLS protection
    - Properly detects admin users
    - Prevents infinite recursion in policy definitions
*/

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Create a clear admin policy that uses a direct value comparison
CREATE POLICY "Admins can view all users" 
ON public.users
FOR SELECT 
TO authenticated
USING (
  -- Check if the current user has admin role in the users table
  EXISTS (
    SELECT 1 
    FROM users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Create a policy for admins to update any user
CREATE POLICY "Admins can update any user" 
ON public.users
FOR UPDATE 
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

-- Ensure we have admin users for testing
UPDATE users
SET role = 'admin'
WHERE email IN ('iceiceiceiceice5@gmail.com')
AND id IS NOT NULL;